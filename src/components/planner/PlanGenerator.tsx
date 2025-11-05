import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Snackbar,
  useTheme,
  Chip,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import {
  plannerStore,
  setUserPrompt,
  setIsLoading,
  setError,
  setPlan,
  resetPlannerState,
  setProjectRoot,
  setScanPathsInput,
  updateCurrentPlanMetadata,
  updateFileChange,
  setCurrentPlanId,
  setAdditionalInstructions,
  setExpectedOutputFormat,
  setFileDataAndMimeType,
} from './stores/plannerStore';
import { plannerService } from './api/plannerService';
import PlanDisplay from './PlanDisplay';
import type { GlobalAction } from '@/types/action';
import type { ILlmInput, IFileChange } from './types';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import DescriptionIcon from '@mui/icons-material/Description';
import SchemaIcon from '@mui/icons-material/Schema';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BugReportIcon from '@mui/icons-material/BugReport';
import UploadFileIcon from '@mui/icons-material/UploadFile';
// Removed unused import: import ClearIcon from '@mui/icons-material/Clear';

import CustomDrawer from '@/components/Drawer/CustomDrawer';
import DirectoryPickerDrawer from '@/components/planner/drawerContent/DirectoryPickerDrawer';
import ScanPathsDrawer from '@/components/planner/drawerContent/ScanPathsDrawer';
import InstructionEditorDrawer from '@/components/planner/drawerContent/InstructionEditorDrawer';
import PlanMetadataEditorDrawer from '@/components/planner/drawerContent/PlanMetadataEditorDrawer';
import FileChangeEditorDrawer from '@/components/planner/drawerContent/FileChangeEditorDrawer';
import PlannerList from '@/components/planner/PlannerList';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import Loading from '@/components/Loading';

const styles = {
  card: {
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
  },
  formSection: {
    padding: 3,
  },
  generateButton: {
    marginTop: 2,
    marginBottom: 2,
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 1,
    mt: 2,
    justifyContent: 'flex-end',
  },
};

// Styles for the error drawer content
const drawerErrorContentSx = {
  flexGrow: 1,
  '.MuiInputBase-root': { height: '100%', alignItems: 'flex-start' },
  '.MuiInputBase-root .MuiInputBase-input': { height: '100% !important', alignItems: 'flex-start' },
};

const PlanGenerator: React.FC = () => {
  const {
    userPrompt,
    plan,
    isLoading,
    error,
    projectRoot,
    scanPathsInput,
    additionalInstructions,
    expectedOutputFormat,
    currentPlanId,
    fileData,
    fileMimeType,
  } = useStore(plannerStore);
  const globalProjectRoot = useStore(projectRootDirectoryStore);
  const navigate = useNavigate(); // Initialize useNavigate
  const theme = useTheme();

  const [isProjectRootPickerDialogOpen, setIsProjectRootPickerDialogOpen] = useState(false);
  const [isScanPathsDialogOpen, setIsScanPathsDialogOpen] = useState(false);
  const [isAiInstructionDrawerOpen, setIsAiInstructionDrawerOpen] = useState(false);
  const [isExpectedOutputDrawerOpen, setIsExpectedOutputDrawerOpen] = useState(false);
  const [isPlanMetadataEditorOpen, setIsPlanMetadataEditorOpen] = useState(false);
  const [isFileChangeEditorOpen, setIsFileChangeEditorOpen] = useState(false);
  const [editingFileChange, setEditingFileChange] = useState<IFileChange | null>(null);
  const [editingFileChangeIndex, setEditingFileChangeIndex] = useState<number | null>(null);
  const [isPlannerListDrawerOpen, setIsPlannerListDrawerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isErrorDetailsDrawerOpen, setIsErrorDetailsDrawerOpen] = useState(false); // New state for error details drawer

  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State for selected file object

  // Local state for the project root input field within the DirectoryPickerDrawer
  const [tempDrawerProjectRootInput, setTempDrawerProjectRootInput] = useState(projectRoot || '');
  // Local state for scan paths within the drawer before confirming
  const [localScanPaths, setLocalScanPaths] = useState<string[]>([]); // Initialize as empty array

  // Effect to ensure plannerStore's projectRoot is in sync with globalProjectRoot
  // and also to update tempDrawerProjectRootInput when plannerStore.projectRoot changes
  useEffect(() => {
    // Only update if globalProjectRoot is valid and different from current plannerStore.projectRoot
    if (globalProjectRoot && projectRoot !== globalProjectRoot) {
      setProjectRoot(globalProjectRoot);
    }
    // Always update tempDrawerProjectRootInput to reflect the current projectRoot from store
    setTempDrawerProjectRootInput(projectRoot || '');
  }, [globalProjectRoot, projectRoot, setProjectRoot]);

  // Sync localScanPaths with plannerStore's scanPathsInput when the drawer is opened or parent changes it
  useEffect(() => {
    const currentPaths = scanPathsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setLocalScanPaths(currentPaths);
  }, [scanPathsInput]);

  // Effect to populate generator fields when a plan is loaded
  useEffect(() => {
    if (plan && currentPlanId === plan.id) {
      setUserPrompt(plan.llmInput?.userPrompt || '');
      // Prioritize plan's projectRoot, then global, then current store value
      setProjectRoot(plan.llmInput?.projectRoot || globalProjectRoot || projectRoot || '');
      setScanPathsInput(plan.llmInput?.scanPaths?.join(', ') || 'src, public, package.json, README.md, .env');
      setAdditionalInstructions(plan.llmInput?.additionalInstructions || '');
      setExpectedOutputFormat(plan.llmInput?.expectedOutputFormat || '');
      // No direct setting of fileData/MimeType from plan as it's an ephemeral input for new generation.
    }
  }, [plan, currentPlanId, globalProjectRoot, projectRoot]);

  // Effect to open snackbar when an error occurs in the store
  useEffect(() => {
    if (error) {
      setSnackbarOpen(true);
    } else {
      setSnackbarOpen(false);
    }
  }, [error]);

  const currentScanPathsArray = useMemo(
    () =>
      scanPathsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [scanPathsInput],
  );

  const scanPathAutocompleteOptions = useMemo(() => {
    return Array.from(new Set(['src', 'public', 'package.json', 'README.md', '.env'])).sort();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        // Ensure result is a string before splitting. Data URL format is 'data:[<MIME-type>][;charset=<encoding>][;base64],<data>'
        const base64Data = (e.target?.result as string)?.split(',')[1]; 
        const mimeType = file.type;
        setFileDataAndMimeType(base64Data, mimeType);
      };
      reader.onerror = () => {
        setError('Failed to read file.');
        setSelectedFile(null);
        setFileDataAndMimeType(null, null);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setFileDataAndMimeType(null, null);
    }
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setFileDataAndMimeType(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input field
    }
  }, []);

  const handleLoadProject = useCallback(
    (selectedPath: string) => {
      if (!selectedPath.trim()) {
        setError('Please provide a project root path.');
        return;
      }
      setProjectRoot(selectedPath);
      projectRootDirectoryStore.set(selectedPath);
      setError('');
      setPlan(null, null); // Clear existing plan on new project root selection
    },
    [setProjectRoot, setError, setPlan],
  );

  const updateScanPaths = useCallback(
    (paths: string[]) => setScanPathsInput([...new Set(paths)].sort().join(', ')),
    [setScanPathsInput],
  );

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    //resetPlannerState(); // Decide if full reset is desired before generation
    try {
      const llmInput: ILlmInput = {
        userPrompt,
        projectRoot,
        relevantFiles: [],
        additionalInstructions,
        expectedOutputFormat,
        scanPaths: currentScanPathsArray,
        requestType: 'LLM_GENERATION',
        output: 'JSON',
        fileData: fileData || undefined,
        fileMimeType: fileMimeType || undefined,
      };

      // Adjust requestType based on file presence
      if (llmInput.fileData && llmInput.fileMimeType) {
        if (llmInput.fileMimeType.startsWith('image/')) {
          llmInput.requestType = 'TEXT_WITH_IMAGE';
        } else {
          llmInput.requestType = 'TEXT_WITH_FILE';
        }
      }

      console.log(llmInput, 'llmInput');
      const response = await plannerService.generatePlan(llmInput);
      setPlan(response.planId, response.plan);
      setCurrentPlanId(response.planId);
      navigate(`/planner-generator/${response.planId}`); // Navigate to the generated plan's URL
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      console.error(err, 'Plan generation error');
      setError((err as Error).message || 'Failed to generate plan.');
    } finally {
      // setIsLoading(false) is handled by setPlan or setError
    }
  };

  const handleClearPlan = () => {
    resetPlannerState();
    setTempDrawerProjectRootInput(projectRootDirectoryStore.get() || '');
    setLocalScanPaths(
      (plannerStore.get().scanPathsInput)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    setSelectedFile(null); // Clear selected file on plan clear
    navigate('/planner-generator');
  };

  const handleSavePlanMetadata = useCallback(
    (updatedData: {
      title: string;
      summary?: string;
      thoughtProcess?: string;
      documentation?: string;
      gitInstructions?: string[];
    }) => {
      updateCurrentPlanMetadata(updatedData);
    },
    [],
  );

  const handleEditFileChangeRequest = useCallback(
    (index: number, change: IFileChange) => {
      setIsFileChangeEditorOpen(true);
      setEditingFileChange(change);
      setEditingFileChangeIndex(index);
    },
    [],
  );

  const handleSaveEditedFileChange = useCallback(
    (updatedChange: IFileChange) => {
      if (plan && editingFileChangeIndex !== null) {
        updateFileChange(plan.id, editingFileChangeIndex, updatedChange);
      }
      setIsFileChangeEditorOpen(false);
      setEditingFileChange(null);
      setEditingFileChangeIndex(null);
    },
    [plan, editingFileChangeIndex],
  );

  const directoryPickerDrawerActions: GlobalAction[] = [
    {
      label: 'Cancel',
      color: 'inherit',
      variant: 'outlined',
      action: () => setIsProjectRootPickerDialogOpen(false),
      icon: <CloseIcon />,
    },
    {
      label: 'Select',
      color: 'primary',
      variant: 'contained',
      action: () => {
        handleLoadProject(tempDrawerProjectRootInput);
        setIsProjectRootPickerDialogOpen(false);
      },
      icon: <CheckIcon />,
      disabled: !tempDrawerProjectRootInput.trim(),
    },
  ];

  const scanPathsDrawerActions: GlobalAction[] = [
    {
      label: 'Cancel',
      color: 'inherit',
      variant: 'outlined',
      action: () => setIsScanPathsDialogOpen(false),
      icon: <CloseIcon />,
    },
    {
      label: 'Confirm',
      color: 'primary',
      variant: 'contained',
      action: () => {
        updateScanPaths(localScanPaths);
        setIsScanPathsDialogOpen(false);
      },
      icon: <CheckIcon />,
      disabled: false,
    },
  ];

  const plannerListDrawerActions: GlobalAction[] = [
    {
      label: 'Close',
      action: () => setIsPlannerListDrawerOpen(false),
      icon: <CloseIcon />,
      color: 'inherit',
      variant: 'outlined',
    },
  ];

  // Actions for the Error Details Drawer
  const errorDrawerActions: GlobalAction[] = [
    {
      label: 'Close',
      action: () => setIsErrorDetailsDrawerOpen(false),
      icon: <CloseIcon />,
      color: 'inherit',
      variant: 'outlined',
    },
  ];

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
    // Do NOT clear the error from the store here. The error state in plannerStore
    // should persist until a new generation or an explicit clear action.
  };

  return (
    <Box className="flex flex-col h-full overflow-hidden p-4 sm:p-6 lg:p-8">
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="text-primary-light font-bold mb-6"
      >
        AI Plan Generator
      </Typography>

      <Card sx={styles.card} className="mb-6 flex-shrink-0">
        <CardContent sx={styles.formSection}>
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6" gutterBottom className="text-text-primary mb-0">
              Generate a New Plan
            </Typography>
            {error && (
              <Tooltip title="View Error Details">
                <IconButton
                  color="error"
                  onClick={() => setIsErrorDetailsDrawerOpen(true)}
                  aria-label="view error details"
                >
                  <BugReportIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <TextField
            label="Enter your prompt for the AI"
            multiline
            rows={6}
            fullWidth
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            variant="outlined"
            disabled={isLoading}
            sx={{ mb: 2 }}
          />

          <Box className="flex justify-between items-center mt-2 flex-wrap gap-2">
            <Box className="flex flex-wrap gap-2">
              <Tooltip title="Select Project Root Directory">
                <IconButton
                  color="primary"
                  onClick={() => {
                    setTempDrawerProjectRootInput(projectRoot);
                    setIsProjectRootPickerDialogOpen(true);
                  }}
                  aria-label="select project root directory"
                  disabled={isLoading}
                >
                  <FolderOpenIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Manage AI Scan Paths">
                <IconButton
                  color="primary"
                  onClick={() => setIsScanPathsDialogOpen(true)}
                  aria-label="manage ai scan paths"
                  disabled={isLoading}
                >
                  <AddRoadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="View All Saved Plans">
                <IconButton
                  color="primary"
                  onClick={() => setIsPlannerListDrawerOpen(true)}
                  aria-label="view all saved plans"
                  disabled={isLoading}
                >
                  <ListAltIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Upload Image or File for AI Context">
                <IconButton
                  color="primary"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="upload file"
                  disabled={isLoading}
                >
                  <UploadFileIcon />
                </IconButton>
              </Tooltip>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isLoading}
              />
            </Box>

            <Box className="flex flex-wrap gap-2">
              <Tooltip title="Edit AI Instructions (System Prompt)">
                <IconButton
                  color="primary"
                  onClick={() => setIsAiInstructionDrawerOpen(true)}
                  aria-label="edit ai instructions"
                  disabled={isLoading}
                >
                  <DescriptionIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Expected Output Format (JSON Schema)">
                <IconButton
                  color="primary"
                  onClick={() => setIsExpectedOutputDrawerOpen(true)}
                  aria-label="edit expected output format"
                  disabled={isLoading}
                >
                  <SchemaIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {selectedFile && (
            <Box className="flex items-center gap-2 mt-4">
              <Chip
                label={`File: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`}
                color="info"
                variant="outlined"
                onDelete={handleClearFile}
                sx={{ color: theme.palette.text.primary, borderColor: theme.palette.info.main }}
              />
            </Box>
          )}

          <Box className="flex justify-end gap-2 mt-4">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClearPlan}
              disabled={isLoading && !plan}
            >
              Clear Plan
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGeneratePlan}
              disabled={isLoading || !userPrompt.trim() || !projectRoot.trim()}
              startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
              sx={styles.generateButton}
            >
              {isLoading ? 'Generating Plan...' : 'Generate Plan'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {isLoading ? (
        <Box className="flex-grow flex items-center justify-center">
          <Loading type="circular" message="Generating Plan..." />
        </Box>
      ) : plan ? (
        <Box className="flex-grow overflow-y-auto pt-4">
          <PlanDisplay
            plan={plan}
            onEditPlanMetadata={() => setIsPlanMetadataEditorOpen(true)}
            onEditFileChange={handleEditFileChangeRequest}
          />
        </Box>
      ) : (
        <Box className="flex-grow flex items-center justify-center pt-4">
          <Typography variant="h6" color="text.secondary">
            Enter a prompt and click "Generate Plan" to begin.
          </Typography>
        </Box>
      )}

      <CustomDrawer
        open={isProjectRootPickerDialogOpen}
        onClose={() => setIsProjectRootPickerDialogOpen(false)}
        position="right"
        size="normal"
        title="Select Project Root Folder"
        hasBackdrop={true}
        footerActionButton={directoryPickerDrawerActions}
      >
        <DirectoryPickerDrawer
          onSelect={() => {
            /* This onSelect is now primarily handled by the footer actions. */
          }}
          onClose={() => setIsProjectRootPickerDialogOpen(false)}
          initialPath={tempDrawerProjectRootInput || '/'}
          allowExternalPaths
          onPathUpdate={setTempDrawerProjectRootInput}
        />
      </CustomDrawer>

      <CustomDrawer
        open={isScanPathsDialogOpen}
        onClose={() => setIsScanPathsDialogOpen(false)}
        position="right"
        size="normal"
        title="Manage AI Scan Paths"
        hasBackdrop={true}
        footerActionButton={scanPathsDrawerActions}
      >
        <ScanPathsDrawer
          currentScanPaths={localScanPaths}
          availablePaths={scanPathAutocompleteOptions}
          allowExternalPaths
          onLocalPathsChange={setLocalScanPaths}
        />
      </CustomDrawer>

      <InstructionEditorDrawer
        open={isAiInstructionDrawerOpen}
        onClose={() => setIsAiInstructionDrawerOpen(false)}
        type="ai"
      />

      <InstructionEditorDrawer
        open={isExpectedOutputDrawerOpen}
        onClose={() => setIsExpectedOutputDrawerOpen(false)}
        type="expected"
      />

      {plan && (
        <PlanMetadataEditorDrawer
          open={isPlanMetadataEditorOpen}
          onClose={() => setIsPlanMetadataEditorOpen(false)}
          initialTitle={plan.title}
          initialSummary={plan.summary}
          initialThoughtProcess={plan.thoughtProcess}
          initialDocumentation={plan.documentation}
          initialGitInstructions={plan.gitInstructions}
          onSave={handleSavePlanMetadata}
        />
      )}

      {editingFileChange && (
        <FileChangeEditorDrawer
          open={isFileChangeEditorOpen}
          onClose={() => setIsFileChangeEditorOpen(false)}
          initialFileChange={editingFileChange}
          onSave={handleSaveEditedFileChange}
        />
      )}

      <CustomDrawer
        open={isPlannerListDrawerOpen}
        onClose={() => setIsPlannerListDrawerOpen(false)}
        position="right"
        size="medium"
        title="All AI Plans"
        hasBackdrop={true}
        footerActionButton={plannerListDrawerActions}
      >
        <PlannerList />
      </CustomDrawer>

      {/* New: Error Details Drawer */}
      <CustomDrawer
        open={isErrorDetailsDrawerOpen}
        onClose={() => setIsErrorDetailsDrawerOpen(false)}
        position="right"
        size="medium"
        title="Error Details"
        hasBackdrop={true}
        footerActionButton={errorDrawerActions}
      >
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Detailed information about the last error encountered during plan generation.
          </Typography>
          <TextField
            label="Error Message"
            multiline
            rows={15}
            value={error || 'No error details available.'}
            fullWidth
            size="small"
            variant="outlined"
            InputProps={{ style: { fontFamily: 'monospace', color: theme.palette.error.main } }}
            sx={drawerErrorContentSx}
          />
        </Box>
      </CustomDrawer>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlanGenerator;
