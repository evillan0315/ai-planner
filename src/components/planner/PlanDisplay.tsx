import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
  // REMOVED Snackbar,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import { plannerStore, setApplyStatus } from './stores/plannerStore';
import { plannerService } from './api/plannerService';
import type { IPlan, IFileChange } from './types';
// REMOVED CloseIcon import
import EditIcon from '@mui/icons-material/Edit';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'; // Import MarkdownRenderer

// New Sub-components
import PlanSectionAccordion from './PlanSectionAccordion';
import PlanMetricsDisplay from './PlanMetricsDisplay';
import PlanFileChangesTable from './PlanFileChangesTable';
import { CustomSnackbar } from '@/components/ui/CustomSnackbar'; // <-- ADDED

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

const mainTitleSx = {
  marginBottom: 0,
  color: 'primary.main',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

const loadingOverlaySx = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
  borderRadius: '12px',
};

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, onEditPlanMetadata, onEditFileChange }) => {
  const { applyStatus, applyError, projectRoot } = useStore(plannerStore);
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

  useEffect(() => {
    if (applyStatus === 'success') {
      setSnackbarMessage('Plan applied successfully! Please check your project directory.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } else if (applyStatus === 'failure') {
      setSnackbarMessage(`Error applying plan: ${applyError}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    // Reset snackbar state when applyStatus goes back to idle/applying
    else if (applyStatus === 'idle' || applyStatus === 'applying') {
      setSnackbarOpen(false);
    }
  }, [applyStatus, applyError]);

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleApplyPlan = async () => {
    if (!plan || !plan.id) {
      setApplyStatus('failure', 'No plan available to apply or plan ID is missing.');
      return;
    }
    setApplyStatus('applying');
    try {
      const result = await plannerService.applyPlan(plan, projectRoot);
      if (result.ok) {
        setApplyStatus('success');
        const newStatuses = new Map(individualChangeStatus);
        plan.changes.forEach((_, index) => {
          newStatuses.set(index, { status: 'success', error: null });
        });
        setIndividualChangeStatus(newStatuses);
      } else {
        setApplyStatus('failure', result.error || 'Failed to apply plan.');
      }
    } catch (err: unknown) {
      setApplyStatus('failure', (err as Error).message || 'An unexpected error occurred during application.');
    }
  };

  const handleApplySingleChange = async (changeIndex: number) => {
    if (!plan || !plan.id) {
      setIndividualChangeStatus((prev) =>
        new Map(prev).set(changeIndex, { status: 'failure', error: 'No plan available.' }),
      );
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
      } else {
        setIndividualChangeStatus((prev) =>
          new Map(prev).set(changeIndex, {
            status: 'failure',
            error: result.error || 'Failed to apply change.',
          }),
        );
      }
    } catch (err: unknown) {
      setIndividualChangeStatus((prev) =>
        new Map(prev).set(changeIndex, {
          status: 'failure',
          error: (err as Error).message || 'An unexpected error occurred.',
        }),
      );
    }
  };

  return (
    <Box className="space-y-4 p-2 relative">
      {applyStatus === 'applying' && (
        <Box sx={loadingOverlaySx}>
          <CircularProgress color="primary" size={60} />
          <Typography variant="h6" color="primary.contrastText" sx={{ mt: 2 }}>
            Applying Plan...
          </Typography>
        </Box>
      )}

      {/* 1. Plan Metadata (Title & Summary) */}
      <Card className="mb-4 rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md">
        <CardContent>
          <Box className="flex items-center justify-between mb-2">
            <Typography variant="h5" component="h2" gutterBottom sx={mainTitleSx}>
              {plan.title}
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
        </CardContent>
      </Card>

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
      <PlanSectionAccordion title="Documentation">
        {plan.documentation ? (
          <MarkdownRenderer content={plan.documentation} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No documentation provided.
          </Typography>
        )}
      </PlanSectionAccordion>

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
          <MarkdownRenderer content={gitInstructionsContent} />
        </PlanSectionAccordion>
      )}

      {/* 10. Metadata */}
      {plan.metadata && (plan.metadata.planId || plan.metadata.tokensUsed !== undefined && plan.metadata.tokensUsed !== null) && (
        <Card className="rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md">
          <CardContent>
            <Typography variant="h6" sx={mainTitleSx} className="mb-0">Metadata</Typography>
            {plan.metadata.planId && (
              <Typography variant="body1" color="text.primary">
                Plan ID: {plan.metadata.planId}
              </Typography>
            )}
            {plan.metadata.tokensUsed !== undefined && plan.metadata.tokensUsed !== null && (
              <Typography variant="body1" color="text.primary">
                Tokens Used: {plan.metadata.tokensUsed}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {plan.error && (
        <Alert severity="error" className="mb-4">Plan Error: {plan.error}</Alert>
      )}

      {/* Apply Button */}
      <Box className="flex justify-end p-4">
        <Button
          variant="contained"
          color="primary"
          onClick={handleApplyPlan}
          disabled={applyStatus === 'applying'}
          startIcon={applyStatus === 'applying' && <CircularProgress size={20} color="inherit" />}
        >
          {applyStatus === 'applying' ? 'Applying Plan...' : 'Apply Plan'}
        </Button>
      </Box>

      {/* REPLACED SNACKBAR */}
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
