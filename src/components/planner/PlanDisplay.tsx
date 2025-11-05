import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import { plannerStore, setApplyStatus } from './stores/plannerStore';
import { plannerService } from './api/plannerService';
import type { IPlan, IFileChange } from './types';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import ExpandMoreIcon

interface PlanDisplayProps {
  plan: IPlan;
  onEditPlanMetadata: () => void;
  onEditFileChange: (changeIndex: number, fileChange: IFileChange) => void;
}

type ChangeApplyStatus = 'idle' | 'applying' | 'success' | 'failure';

const sectionTitleSx = {
  marginBottom: 1,
  color: 'primary.main',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

const tableContainerSx = {
  borderRadius: '8px',
  overflowY: 'auto',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
};

const tableHeadCellSx = {
  fontWeight: 'bold',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
};

const codeBlockSx = {
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  padding: 2,
  borderRadius: '8px',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  maxHeight: '300px',
  overflowY: 'auto',
  color: 'text.secondary',
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
    Map<number, { status: ChangeApplyStatus; error: string | null }>
  >(new Map());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('info');

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

      <Card className="mb-4 rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md">
        <CardContent>
          <Box className="flex items-center justify-between mb-2">
            <Typography variant="h5" component="h2" gutterBottom sx={sectionTitleSx}>
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

      <Accordion defaultExpanded className="rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="thought-process-content" id="thought-process-header">
          <Typography variant="h6" sx={sectionTitleSx} className="mb-0">
            Thought Process
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {plan.thoughtProcess ? (
            <Typography variant="body2" color="text.secondary" sx={codeBlockSx}>
              {plan.thoughtProcess}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No detailed thought process provided.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion className="rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="documentation-content" id="documentation-header">
          <Typography variant="h6" sx={sectionTitleSx} className="mb-0">
            Documentation
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {plan.documentation ? (
            <Typography variant="body2" color="text.secondary" sx={codeBlockSx}>
              {plan.documentation}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No documentation provided.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded className="rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="file-changes-content" id="file-changes-header">
          <Typography variant="h6" sx={sectionTitleSx} className="mb-0">
            File Changes ({plan.changes.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0 }}> {/* Remove horizontal padding for table */} 
          {plan.changes.length > 0 ? (
            <TableContainer sx={tableContainerSx} className="max-h-[400px] shadow-none">
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableHeadCellSx}>File Path</TableCell>
                    <TableCell sx={tableHeadCellSx}>Action</TableCell>
                    <TableCell sx={tableHeadCellSx}>Reason</TableCell>
                    <TableCell sx={tableHeadCellSx} align="center" width="120px">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plan.changes.map((change, index) => {
                    const status = individualChangeStatus.get(index)?.status || 'idle';
                    return (
                      <TableRow key={index} hover>
                        <TableCell>{change.filePath}</TableCell>
                        <TableCell>
                          <Chip
                            label={change.action}
                            color={
                              change.action === 'ADD'
                                ? 'success'
                                : change.action === 'MODIFY'
                                  ? 'info'
                                  : change.action === 'DELETE'
                                    ? 'error'
                                    : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{change.reason || '-'}</TableCell>
                        <TableCell sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'center' }}>
                          {status === 'applying' ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : status === 'success' ? (
                            <Tooltip title="Applied successfully">
                              <CheckCircleOutlineIcon color="success" fontSize="small" />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Apply this change">
                              <IconButton
                                onClick={() => handleApplySingleChange(index)}
                                size="small"
                                color="primary"
                                aria-label={`apply change ${index}`}
                              >
                                <RocketLaunchIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit this change">
                            <IconButton
                              onClick={() => onEditFileChange(index, change)}
                              size="small"
                              color="secondary"
                              aria-label={`edit change ${index}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No file changes proposed.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion className="rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="git-instructions-content" id="git-instructions-header">
          <Typography variant="h6" sx={sectionTitleSx} className="mb-0">
            Git Instructions
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {plan.gitInstructions && plan.gitInstructions.length > 0 ? (
            <Box sx={codeBlockSx}>
              {plan.gitInstructions.map((instruction, index) => (
                <Typography key={index} variant="body2" color="text.secondary">
                  {instruction}
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No specific Git instructions provided.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleSnackbarClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlanDisplay;
