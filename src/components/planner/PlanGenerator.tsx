import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  useTheme,
  IconButton,
  Tooltip,
  Alert,
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
import type { GlobalAction } from '@/types/action';
import type { ILlmInput, IFileChange } from './types';
import { useNavigate } from 'react-router-dom';

import BugReportIcon from '@mui/icons-material/BugReport';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

import CustomDrawer from '@/components/Drawer/CustomDrawer';
import DirectoryPickerDrawer from '@/components/planner/drawerContent/DirectoryPickerDrawer';
import ScanPathsDrawer from '@/components/planner/drawerContent/ScanPathsDrawer';
import InstructionEditorDrawer from '@/components/planner/drawerContent/InstructionEditorDrawer';
import PlanMetadataEditorDrawer from '@/components/planner/drawerContent/PlanMetadataEditorDrawer';
import FileChangeEditorDrawer from '@/components/planner/drawerContent/FileChangeEditorDrawer';
import PlannerList from '@/components/planner/PlannerList';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';

// New components
import { PlanInputForm } from './PlanInputForm';
import { PlanGenerationStatus } from './PlanGenerationStatus';

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
  const navigate = useNavigate();
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
  const [isErrorDetailsDrawerOpen, setIsErrorDetailsDrawerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Local state for the project root input field within the DirectoryPickerDrawer
  const [tempDrawerProjectRootInput, setTempDrawerProjectRootInput] = useState(projectRoot || '');
  // Local state for scan paths within the drawer before confirming (now used for `ScanPathsDrawer`'s `onLocalPathsChange`)
  const [localScanPaths, setLocalScanPaths] = useState<string[]>([]);

  // Effect to ensure plannerStore's projectRoot is in sync with globalProjectRoot
  // and also to update tempDrawerProjectRootInput when plannerStore.projectRoot changes
  useEffect(() => {
    // Only update if globalProjectRoot is valid and different from current plannerStore.projectRoot
    if (globalProjectRoot && projectRoot !== globalProjectRoot) {
      setProjectRoot(globalProjectRoot);
    }
    // Always update tempDrawerProjectRootInput to reflect the current projectRoot from store
    setTempDrawerProjectRootInput(projectRoot || '');
  }, [globalProjectRoot, projectRoot]);

  // Sync localScanPaths with plannerStore's scanPathsInput when the drawer is opened
  // This ensures that `localScanPaths` starts with the current global state, but can then
  // be modified independently within the drawer until saved on close.
  useEffect(() => {
    if (isScanPathsDialogOpen) {
      const currentPaths = scanPathsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      setLocalScanPaths(currentPaths);
    }
  }, [scanPathsInput, isScanPathsDialogOpen]);

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
    // These are general suggestions, not fetched from FS. Can be extended.
    return Array.from(new Set(['src', 'public', 'package.json', 'README.md', '.env', '.gitignore'])).sort();
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
    [],
  );

  const handleGeneratePlan = async () => {
    setIsLoading(true);
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
    } catch (err: unknown) {
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
    setSelectedFile(null);
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
      label: 'Close',
      color: 'inherit',
      variant: 'outlined',
      action: () => {
        setIsScanPathsDialogOpen(false);
        // Commit the locally managed scan paths to the global store's scanPathsInput
        setScanPathsInput(localScanPaths.join(', '));
      },
      icon: <CloseIcon />,
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

      <PlanInputForm
        userPrompt={userPrompt}
        setUserPrompt={setUserPrompt}
        projectRoot={projectRoot}
        scanPathsInput={scanPathsInput}
        additionalInstructions={additionalInstructions}
        expectedOutputFormat={expectedOutputFormat}
        fileData={fileData}
        fileMimeType={fileMimeType}
        selectedFile={selectedFile}
        isLoading={isLoading}
        error={error}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
        handleClearFile={handleClearFile}
        handleGeneratePlan={handleGeneratePlan}
        handleClearPlan={handleClearPlan}
        openProjectRootPicker={() => {
          setTempDrawerProjectRootInput(projectRoot);
          setIsProjectRootPickerDialogOpen(true);
        }}
        openScanPathsDrawer={() => setIsScanPathsDialogOpen(true)}
        openPlannerListDrawer={() => setIsPlannerListDrawerOpen(true)}
        openAiInstructionDrawer={() => setIsAiInstructionDrawerOpen(true)}
        openExpectedOutputDrawer={() => setIsExpectedOutputDrawerOpen(true)}
        openErrorDetailsDrawer={() => setIsErrorDetailsDrawerOpen(true)}
        plan={plan}
      />

      <PlanGenerationStatus
        isLoading={isLoading}
        plan={plan}
        onEditPlanMetadata={() => setIsPlanMetadataEditorOpen(true)}
        onEditFileChange={handleEditFileChangeRequest}
      />

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
          initialPath={tempDrawerProjectRootInput || '/'}
          allowExternalPaths
          onPathUpdate={setTempDrawerProjectRootInput}
        />
      </CustomDrawer>

      <CustomDrawer
        open={isScanPathsDialogOpen}
        onClose={() => {
          setIsScanPathsDialogOpen(false);
          // Commit the locally managed scan paths to the global store's scanPathsInput
          setScanPathsInput(localScanPaths.join(', '));
        }}
        position="right"
        size="medium" // Increased size for more browsing space
        title="Manage AI Scan Paths"
        hasBackdrop={true}
        footerActionButton={scanPathsDrawerActions}
      >
        <ScanPathsDrawer
          initialBrowsingPath={projectRoot} // Pass the current projectRoot as the starting point for browsing
          currentScanPaths={localScanPaths}
          suggestedPaths={scanPathAutocompleteOptions}
          allowExternalPaths={true} // Allow browsing outside projectRoot for scan paths for flexibility
          onLocalPathsChange={setLocalScanPaths} // This updates the localScanPaths in PlanGenerator
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
          <Alert severity="error" sx={{ my: 2 }}>
            {error || 'No error details available.'}
          </Alert>
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
