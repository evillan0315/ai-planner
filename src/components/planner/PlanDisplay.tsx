import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Tooltip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import { plannerStore } from './stores/plannerStore';
import { plannerService } from './api/plannerService';
import type { IPlan, IFileChange } from './types';
import EditIcon from '@mui/icons-material/Edit';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'; 

// New Sub-components
import PlanSectionAccordion from './PlanSectionAccordion';
import PlanMetricsDisplay from './PlanMetricsDisplay';
import PlanFileChangesTable from './PlanFileChangesTable';
import { CustomSnackbar } from '@/components/ui/CustomSnackbar'; 

interface PlanDisplayProps {
  plan: IPlan;
  onEditPlanMetadata: () => void;
  onEditFileChange: (changeIndex: number, fileChange: IFileChange) => void;
}

type ChangeApplyStatus = 'idle' | 'applying' | 'success' | 'failure';

interface FileChangeStatus {
    status: ChangeApplyStatus;
    error: string | null;
}

// Removed mainTitleSx and loadingOverlaySx

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, onEditPlanMetadata, onEditFileChange }) => {
  // We need globalApplyStatus to reset individual change statuses upon global application
  const { applyStatus: globalApplyStatus, projectRoot } = useStore(plannerStore); 
  const [individualChangeStatus, setIndividualChangeStatus] = useState<
    Map<number, FileChangeStatus>
  >(new Map());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('info');

  // Memoize the thought process content to resolve esbuild parsing error
  const thoughtProcessContent = useMemo(() => {
    if (Array.isArray(plan.thoughtProcess) && plan.thoughtProcess.length > 0) {
      // Use markdown list format for array
      return plan.thoughtProcess.map(t => `- ${t}`).join('\n');
    }
    if (typeof plan.thoughtProcess === 'string') {
      return plan.thoughtProcess;
    }
    return ''; // Ensure it's always a string for MarkdownRenderer
  }, [plan.thoughtProcess]);

  const assumptionsContent = useMemo(() => {
    if (Array.isArray(plan.assumptions) && plan.assumptions.length > 0) {
      return plan.assumptions.map(a => `- ${a}`).join('\n');
    }
    return '';
  }, [plan.assumptions]);

  const buildScriptsContent = useMemo(() => {
    if (plan.buildScripts && Object.keys(plan.buildScripts).length > 0) {
      return (
        '```bash\n' +
        Object.entries(plan.buildScripts).map(([key, value]) => `# ${key}\n${value}`).join('\n\n') +
        '\n```'
      );
    }
    return '';
  }, [plan.buildScripts]);

  const gitInstructionsContent = useMemo(() => {
    if (plan.gitInstructions) {
      return (
        `**Branch Name:** \`${plan.gitInstructions.branchName || 'N/A'}\`\n\n` +
        `**Commit Message:** \`${plan.gitInstructions.commitMessage || 'N/A'}\`` +
        (
          plan.gitInstructions.commands?.length
            ? `\n\n**Commands:**\n\`\`\`bash\n${plan.gitInstructions.commands.join('\n')}\n\`\`\``
            : ''
        )
      );
    }
    return '';
  }, [plan.gitInstructions]);

  // Effect: Reset individual statuses when global application starts/succeeds
  useEffect(() => {
    if (globalApplyStatus === 'success') {
      // Mark all changes as success if global application succeeded
      const newStatuses = new Map<number, FileChangeStatus>();
      plan.changes.forEach((_, index) => {
        newStatuses.set(index, { status: 'success', error: null });
      });
      setIndividualChangeStatus(newStatuses);
    } else if (globalApplyStatus === 'applying' || globalApplyStatus === 'idle') {
        // Reset statuses when global apply starts or is idle/failed
        // Note: We only fully reset if we were previously successful, otherwise preserve manual attempts
        if (Array.from(individualChangeStatus.values()).some(s => s.status === 'success')) {
             setIndividualChangeStatus(new Map());
        }
    }
  }, [globalApplyStatus, plan.changes]);

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleApplySingleChange = async (changeIndex: number) => {
    if (!plan || !plan.id) {
      setIndividualChangeStatus((prev) =>
        new Map(prev).set(changeIndex, { status: 'failure', error: 'No plan available.' }),
      );
      setSnackbarMessage('Error: No plan available to apply individual change.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setIndividualChangeStatus((prev) =>
      new Map(prev).set(changeIndex, { status: 'applying', error: null }),
    );

    try {
      const result = await plannerService.applyFileChange(plan.id, changeIndex, projectRoot);
      if (result.ok) {
        setIndividualChangeStatus((prev) =>
          new Map(prev).set(changeIndex, { status: 'success', error: null }),
        );
        setSnackbarMessage(`Change to ${plan.changes[changeIndex]?.filePath} applied successfully.`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        const errorMsg = result.error || 'Failed to apply change.';
        setIndividualChangeStatus((prev) =>
          new Map(prev).set(changeIndex, {
            status: 'failure',
            error: errorMsg,
          }),
        );
        setSnackbarMessage(`Failed to apply change: ${errorMsg}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || 'An unexpected error occurred.';
      setIndividualChangeStatus((prev) =>
        new Map(prev).set(changeIndex, {
          status: 'failure',
          error: errorMsg,
        }),
      );
      setSnackbarMessage(`Failed to apply change: ${errorMsg}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box className="space-y-4 p-2 w-full h-full"> 

      {(plan.summary || plan.metadata?.planId || plan.metadata?.tokensUsed !== undefined) && (
        <Card className="rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md">
          <CardContent>
            <Box className="flex items-center justify-between mb-2">
                <Typography variant="h6" fontWeight="bold" color="primary.main" className="mb-0">
                    Plan Details
                </Typography>
                <Tooltip title="Edit Plan Metadata">
                    <IconButton
                        onClick={onEditPlanMetadata}
                        size="small"
                        color="primary"
                        aria-label="edit plan metadata"
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
            
            {plan.summary && (
              <Typography variant="body1" paragraph color="text.secondary">
                {plan.summary}
              </Typography>
            )}

            {plan.metadata?.planId && (
              <Typography variant="body1" color="text.primary">
                Plan ID: {plan.metadata.planId}
              </Typography>
            )}
            {plan.metadata?.tokensUsed !== undefined && plan.metadata?.tokensUsed !== null && (
              <Typography variant="body1" color="text.primary">
                Tokens Used: {plan.metadata.tokensUsed}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* 2. Thought Process */}
      <PlanSectionAccordion title="Thought Process" defaultExpanded>
        {thoughtProcessContent ? (
          <MarkdownRenderer content={thoughtProcessContent} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No detailed thought process provided.
          </Typography>
        )}
      </PlanSectionAccordion>


      {/* 3. Assumptions */}
      {assumptionsContent && (
        <PlanSectionAccordion title={`Assumptions (${plan.assumptions?.length || 0})`}>
          <MarkdownRenderer content={assumptionsContent} />
        </PlanSectionAccordion>
      )}

      {/* 4. Confidence and Effort Metrics */}
      <PlanMetricsDisplay
        confidence={plan.confidence}
        estimatedEffortMinutes={plan.estimatedEffortMinutes}
      />

      {/* 5. Build Scripts */}
      {buildScriptsContent && (
        <PlanSectionAccordion title={`Build Scripts (${Object.keys(plan.buildScripts || {}).length})`}>
          <MarkdownRenderer content={buildScriptsContent} />
        </PlanSectionAccordion>
      )}

      {/* 6. Documentation */}
      {plan.documentation && (
      <PlanSectionAccordion title="Documentation">
        
          <MarkdownRenderer content={plan.documentation} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No documentation provided.
          </Typography>
        
      </PlanSectionAccordion>
      )}
      {/* 7. File Changes Table */}
      <PlanSectionAccordion title={`File Changes (${plan.changes.length})`} defaultExpanded>
        <PlanFileChangesTable
            changes={plan.changes}
            individualChangeStatus={individualChangeStatus}
            onApplySingleChange={handleApplySingleChange}
            onEditFileChange={onEditFileChange}
        />
      </PlanSectionAccordion>

      {/* 8. Tests */}
      {plan.tests && (plan.tests.add.length > 0 || plan.tests.modify.length > 0) && (
        <PlanSectionAccordion title={`Tests (${plan.tests.add.length + plan.tests.modify.length})`}>
          {plan.tests.add.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">Added Tests:</Typography>
              <MarkdownRenderer content={plan.tests.add.map(test => `- \`${test}\``).join('\n')} />
            </Box>
          )}
          {plan.tests.modify.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Modified Tests:</Typography>
              <MarkdownRenderer content={plan.tests.modify.map(test => `- \`${test}\``).join('\n')} />
            </Box>
          )}
        </PlanSectionAccordion>
      )}

      {/* 9. Git Instructions */}
      {gitInstructionsContent && (
        <PlanSectionAccordion title="Git Instructions">
          {JSON.stringify(gitInstructionsContent)}
         
        </PlanSectionAccordion>
      )}



      {plan.error && (
        <Alert severity="error" className="mb-4">Plan Error: {plan.error}</Alert>
      )}

      {/* Individual Change Status Snackbar */}
      {snackbarOpen && (
        <CustomSnackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          message={snackbarMessage}
        />
      )}
    </Box>
  );
};
export default PlanDisplay;
