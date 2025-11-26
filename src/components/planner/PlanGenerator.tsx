import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  // REMOVED Snackbar,
  useTheme,
  Paper,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import {
  plannerStore,
  setUserPrompt,
  setIsLoading,
  setError,
  setPlan,
  resetPlannerState,
  setScanPathsInput,
  updateCurrentPlanMetadata,
  updateFileChange,
  setCurrentPlanId,
  setAdditionalInstructions,
  setExpectedOutputFormat,
  setFileDataAndMimeType,
  setApplyStatus, // <-- ADDED
  setPlannerProjectRoot, // <-- ADDED
} from './stores/plannerStore';
import { plannerService } from './api/plannerService';
import { fileExplorerService } from '@/components/file-explorer/api/fileExplorerService';
import { ScanConfig } from '@/components/file-explorer/types'; 
import { buildLLMPrompt, extractJsonFromMarkdown } from './utils'; 
import { loadingStore, startGlobalLoading, stopGlobalLoading } from '@/components/ui/loader/stores/loadingStore';
import type { GlobalAction } from '@/components/ui/GlobalActionButton';
import type { ILlmInput, IFileChange, IGitInstructions, IPlan } from './types'; 
import { useNavigate } from 'react-router-dom';
import { getMonacoLanguage } from '@/utils/editorUtils';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'; 
import AddRoadIcon from '@mui/icons-material/AddRoad';

import CustomDrawer from '@/components/Drawer/CustomDrawer';
import FileExplorerPlannerDrawerContent from '@/components/planner/drawerContent/FileExplorerPlannerDrawerContent'; 
import InstructionEditorDrawer from '@/components/planner/drawerContent/InstructionEditorDrawer';
import PlanMetadataEditorDrawer from '@/components/planner/drawerContent/PlanMetadataEditorDrawer';
import FileChangeEditorDrawer from '@/components/planner/drawerContent/FileChangeEditorDrawer';
import PlannerList from '@/components/planner/PlannerList';
import ErrorDetailsDrawerContent from '@/components/planner/drawerContent/ErrorDetailsDrawerContent'; 
import { projectRootDirectoryStore, setProjectRoot as setGlobalProjectRoot } from '@/components/file-explorer/stores/fileTreeStore'; // ALIAS IMPORT FOR CLARITY

// New components
import { PlanInputForm } from './PlanInputForm';
import { PlanGenerationStatus } from './PlanGenerationStatus';
import { CustomSnackbar } from '@/components/ui/snackbar/CustomSnackbar'; 
import { ContentLayout } from '@/components/ui/layouts/ContentLayout'; // <-- ADDED

// Interface reflecting the normalized data structure passed from PlanMetadataEditorDrawer.
// Matches the input requirements of updateCurrentPlanMetadata.
interface IPlanMetadataUpdatePayload {
  title: string;
  summary?: string;
  thoughtProcess?: string[];
  documentation?: string;
  assumptions?: string[];
  confidence?: number;
  estimatedEffortMinutes?: number;
  buildScripts?: Record<string, string>;
  gitInstructions?: IGitInstructions;
}

// Helper function for truncation
const truncateTitle = (title: string, maxLength = 40): string => {
    if (!title || title.length <= maxLength) return title;
    return `${title.substring(0, maxLength - 3)}...`;
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
    applyStatus, // <-- ADDED
    applyError, // <-- ADDED
  } = useStore(plannerStore);
  const globalProjectRoot = useStore(projectRootDirectoryStore);
  const navigate = useNavigate();
  const theme = useTheme();
  const { isGlobalLoading } = useStore(loadingStore);
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
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info'); // <-- ADDED
  const [snackbarMessage, setSnackbarMessage] = useState(''); // <-- ADDED
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
      setPlannerProjectRoot(globalProjectRoot); // <-- FIXED: Use dedicated planner store setter
    }
    // Always update tempDrawerProjectRootInput to reflect the current projectRoot from store
    setTempDrawerProjectRootInput(projectRoot || '');
  }, [globalProjectRoot, projectRoot]);

  // Sync local scanPaths initialization only needed before drawer opens
  // Old sync logic removed.

  // Effect to populate generator fields when a plan is loaded
  useEffect(() => {
    if (plan && currentPlanId === plan.id) {
      setUserPrompt(plan.llmInput?.userPrompt || '');
      // Prioritize plan's projectRoot, then global, then current store value
      setPlannerProjectRoot(plan.llmInput?.projectRoot || globalProjectRoot || projectRoot || '');
      setScanPathsInput(plan.llmInput?.scanPaths?.join(', ') || 'src, public, package.json, README.md, .env');
      setAdditionalInstructions(plan.llmInput?.additionalInstructions || '');
      setExpectedOutputFormat(plan.llmInput?.expectedOutputFormat || '');
      // No direct setting of fileData/MimeType from plan as it's an ephemeral input for new generation.
    }
  }, [plan, currentPlanId, globalProjectRoot, projectRoot]);

  // Effect to handle generation error snackbar (Original logic)
  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [error]);
  
  // Effect to handle GLOBAL Apply Status snackbar (MOVED FROM PlanDisplay)
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
    // Reset snackbar visibility when status changes to something pending/idle
    else if (applyStatus === 'idle' || applyStatus === 'applying') {
      setSnackbarOpen(false);
    }
  }, [applyStatus, applyError]);

  const currentScanPathsArray = useMemo(
    () =>
      scanPathsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [scanPathsInput],
  );

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
      // 1. Update the planner store state immediately
      setPlannerProjectRoot(selectedPath); 
      // 2. Update the persistent global store
      setGlobalProjectRoot(selectedPath);
      setError('');
      setPlan(null, null); // Clear existing plan on new project root selection
    },
    [],
  );
  const handleScanDirectory = async () => {
    try {
    const rFiles: ScanConfig = {
      projectRoot,
      scanPaths: currentScanPathsArray,
      verbose: false
    }
    return await fileExplorerService.scanDirectory(rFiles);
   } catch (err: unknown) {
      console.error(err, 'File Scan Errpr  ');
      setError((err as Error).message || 'Failed to scan files.');
    } 
  }
  const handleProjectStructure = async () => {
    try {
    return await plannerService.getProjectStructure(projectRoot);
   } catch (err: unknown) {
      console.error(err, 'Failed to get structure   ');
      setError((err as Error).message || 'Failed to get structure ');
    } 
  }
  const handleGeneratePlan = useCallback(async (): Promise<void> => {
  // FIlePath: src/components/planner/PlanGenerator.tsx
  // Title: handleGeneratePlan - robust plan generation flow
  // Reason: Improve error handling, parsing resilience, store updates, and loading state management

  // Guard: require a non-empty prompt and a project root
  if (!userPrompt || !userPrompt.trim()) {
    setError('Please provide a prompt before generating a plan.');
    return;
  }
  if (!projectRoot || !projectRoot.trim()) {
    setError('Please select a project root before generating a plan.');
    return;
  }

  setError('');
  setIsLoading(true);
  startGlobalLoading('Generating Plan...');

  try {
    // 1) Scan files
    const relevantFiles = await handleScanDirectory();
    if (!relevantFiles || !Array.isArray(relevantFiles) || relevantFiles.length === 0) {
      throw new Error('No files returned from scanner. Adjust your scan paths or project root.');
    }

    // 2) Get project structure (string). Allow empty string but validate type.
    const projectStructure = await handleProjectStructure();
    if (projectStructure !== undefined && typeof projectStructure !== 'string') {
      console.warn('Unexpected projectStructure type; proceeding with empty string fallback.', projectStructure);
    }

    // 3) Compose LLM input
    const llmInput: ILlmInput = {
      userPrompt,
      projectRoot,
      relevantFiles,
      additionalInstructions,
      expectedOutputFormat,
      scanPaths: currentScanPathsArray,
      requestType: 'LLM_GENERATION',
      output: 'JSON',
      fileData: fileData || undefined,
      fileMimeType: fileMimeType || undefined,
    };

    if (llmInput.fileData && llmInput.fileMimeType) {
      llmInput.requestType = llmInput.fileMimeType.startsWith('image/') ? 'TEXT_WITH_IMAGE' : 'TEXT_WITH_FILE';
    }

    // 4) Build prompt
    const fullPrompt = await buildLLMPrompt(llmInput, relevantFiles, (projectStructure as string) ?? '');

    // 5) Call the planner service to generate raw LLM output
    const rawResponse = await plannerService.generate(llmInput, fullPrompt);
    
    if (!rawResponse || (typeof rawResponse !== 'string' && typeof rawResponse !== 'object')) {
      throw new Error('Planner returned an unexpected response.');
    }
    
    const extracted = await extractJsonFromMarkdown(rawResponse);
    console.log(extracted, 'extracted');
    // 6) Extract JSON from markdown (resilient)
    let parsedPlan: IPlan = JSON.parse(extracted);

    
    // Attempt 3: if we still don't have a plan, throw
    if (!parsedPlan) {
      throw new Error('Failed to parse plan from LLM response.');
    }

    parsedPlan.title = parsedPlan.title?.trim() || truncateTitle(parsedPlan.summary || userPrompt.slice(0, 80));

    // 7) Persist plan via plannerService.createPlan and normalize response
    const createRes = await plannerService.createPlan(parsedPlan);
    console.log(createRes, 'createRes');
    // Normalize created plan (accept multiple response shapes)
    // Final sanity check
    if (!createRes) {
      throw new Error('Failed to create or normalize the plan returned by the service.');
    }
    setPlan(createRes);
    setCurrentPlanId(createRes.planId);
    // Optionally navigate to a plan detail view (uncomment if desired)
    navigate(`/planner-generator/${createRes.planId}`);

  } catch (err: unknown) {
    const message = (err as Error)?.message ?? String(err);
   
    setError(message || 'Failed to generate plan.');
  } finally {
    setIsLoading(false);
    stopGlobalLoading();
  }
}, [
  userPrompt,
  projectRoot,
  additionalInstructions,
  expectedOutputFormat,
  currentScanPathsArray,
  fileData,
  fileMimeType,
  handleScanDirectory,
  handleProjectStructure,
  buildLLMPrompt,
  plannerService,
  extractJsonFromMarkdown,
  setError,
  setIsLoading,
  setPlan,
  setCurrentPlanId,
  startGlobalLoading,
  stopGlobalLoading,
  truncateTitle,
  navigate,
]);
 

  const handleApplyPlan = useCallback(async () => { // <-- MOVED FROM PlanDisplay.tsx
    if (!plan || !plan.id) {
      setApplyStatus('failure', 'No plan available to apply or plan ID is missing.');
      return;
    }
    setApplyStatus('applying');
    try {
      // NOTE: PlanDisplay is now responsible for initializing/updating individual change statuses 
      // if it detects a global success.
      const result = await plannerService.applyPlan(plan, projectRoot);
      if (result.ok) {
        setApplyStatus('success');
      } else {
        setApplyStatus('failure', result.error || 'Failed to apply plan.');
      }
    } catch (err: unknown) {
      setApplyStatus('failure', (err as Error).message || 'An unexpected error occurred during application.');
    }
  }, [plan, projectRoot]);

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
    (updatedData: IPlanMetadataUpdatePayload) => {
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

  const openScanPathsDrawer = () => {
    // Initialize local scan paths based on current store state just before opening
    const currentPaths = scanPathsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setLocalScanPaths(currentPaths);
    setIsScanPathsDialogOpen(true);
  };
  
  const openProjectRootPicker = () => {
    // Initialize local root path input based on current store state just before opening
    setTempDrawerProjectRootInput(projectRoot);
    setIsProjectRootPickerDialogOpen(true);
  }

  const directoryPickerDrawerActions: GlobalAction[] = [
    {
      label: 'Cancel',
      color: 'inherit',
      variant: 'outlined',
      action: () => setIsProjectRootPickerDialogOpen(false),
      icon: <CloseIcon />,
    },
    {
      label: 'Select Root',
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
      action: () => setIsScanPathsDialogOpen(false),
      icon: <CloseIcon />,
      color: 'inherit',
      variant: 'outlined',
    },
    {
      label: 'Save Scan Paths',
      action: () => {
        // Commit the locally managed scan paths to the global store's scanPathsInput
        setScanPathsInput(localScanPaths.join(', '));
        setIsScanPathsDialogOpen(false);
      },
      icon: <CheckIcon />,
      color: 'primary',
      variant: 'contained',
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

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

// --- New Header Configuration Memoization ---

const headerRightActions: GlobalAction[] = useMemo(() => {
    const actions: GlobalAction[] = [];
    const isGenerating = isLoading;
    
    // 1. Generate Plan Button (Icon only, visible always unless currently loading)
    actions.push({
        label: isGenerating ? 'Generating...' : 'Generate Plan',
        action: handleGeneratePlan,
        icon: isGenerating ? <CircularProgress size={16} color="inherit" /> : <RocketLaunchIcon />,
        color: 'success', 
        disabled: isGenerating || !userPrompt.trim(),
        //iconOnly: true,
    });


    // 2. Apply Plan Button (Only available if a plan exists)
    if (plan) {
        const isApplying = applyStatus === 'applying';
        const isSuccess = applyStatus === 'success';

        actions.push({
            label: isApplying ? 'Applying...' : isSuccess ? 'Applied!' : 'Apply Plan',
            action: handleApplyPlan,
            icon: isApplying ? <CircularProgress size={16} color="inherit" /> : <RocketLaunchIcon />,
            color: isSuccess ? 'success' : 'primary',
            disabled: isApplying || isSuccess,
            iconOnly: true,
        });
    }

    return actions;
}, [plan, applyStatus, handleApplyPlan, handleGeneratePlan, isLoading, userPrompt]);
const headerLeftActions: GlobalAction[] = useMemo(() => {
    if (!plan) return [];

    const isApplying = applyStatus === 'applying';
    const isSuccess = applyStatus === 'success';

    return [{
        label: "Plan",
          //action: handleApplyPlan,
          iconOnly: true,
          icon: <AddRoadIcon fontSize="small" />,
          color: 'primary',
          disabled: isApplying || isSuccess,
    }];
}, [plan, applyStatus, handleApplyPlan]);
const planTitleHeader = useMemo(() => {
    if (!plan) {
      return (
          <Typography variant="subtitle1" fontWeight="bold" ><AddRoadIcon /> Planner</Typography>
      );
    } else {
      return (
          <Typography 
              variant="subtitle1" 
              fontWeight="bold" 
              className="truncate"
              title={plan.title}
          >
              {plan.title}
          </Typography>
      );
    }
}, [plan]);


  return (
    <Box className="flex flex-col h-full w-full overflow-hidden">
     
      {/* 1. Scrollable Plan Status/Display area */}
      <Box className="flex-grow min-h-0 h-full">
        <ContentLayout 
            headerContent={planTitleHeader}
            headerRightActions={headerRightActions}
            headerLeftActions={headerLeftActions}
            headerHeight={48} 
            footerHeight={0}
            contentWrapperSx={{ 
                p: 0, 
            }}
        >
            
            <PlanGenerationStatus
                isLoading={isLoading}
                plan={plan}
                onEditPlanMetadata={() => setIsPlanMetadataEditorOpen(true)}
                onEditFileChange={handleEditFileChangeRequest}
            />
           
        </ContentLayout>
      </Box>







      {/* 2. Fixed Input Form (Sticky Bottom area) */}
      {/* ADDED WRAPPER with p-2 and theme styling for visual anchor */}
      <Box 
        className="flex-shrink-0 p-2 mt-2"
        sx={{
            backgroundColor: theme.palette.background.paper,
            borderTop: `2px solid ${theme.palette.divider}`
        }}
      >
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
          openProjectRootPicker={openProjectRootPicker} // Use local helper
          openScanPathsDrawer={openScanPathsDrawer}     // Use local helper
          openPlannerListDrawer={() => setIsPlannerListDrawerOpen(true)}
          openAiInstructionDrawer={() => setIsAiInstructionDrawerOpen(true)}
          openExpectedOutputDrawer={() => setIsExpectedOutputDrawerOpen(true)}
          openErrorDetailsDrawer={() => setIsErrorDetailsDrawerOpen(true)}
          plan={plan}
        />
      </Box>


      <CustomDrawer
        open={isProjectRootPickerDialogOpen}
        onClose={() => setIsProjectRootPickerDialogOpen(false)}
        position="left"
        size="small" // Increased size for better file viewing
        title="Select Project Root Folder"
        hasBackdrop={true}
        footerActionButton={directoryPickerDrawerActions}
      >
        <FileExplorerPlannerDrawerContent
          mode="root"
          // Pass the local state which is updated by the inner FileExplorerControls' onUsePath handler
          currentPath={tempDrawerProjectRootInput || '/'}
          currentScanPaths={[]} // Not used in root mode
          onPathChange={setTempDrawerProjectRootInput} // Updates local state
          onScanPathsChange={() => {}} // N/A, not used in root mode
        />
      </CustomDrawer>

 
      <CustomDrawer
        open={isScanPathsDialogOpen}
        onClose={() => setIsScanPathsDialogOpen(false)}
        position="left"
        size="normal"
        title="Manage AI Scan Paths"
        hasBackdrop={true}
        footerActionButton={scanPathsDrawerActions}
      >
        <FileExplorerPlannerDrawerContent
          mode="scan"
          currentPath={projectRoot} // Browsing starts at project root
          currentScanPaths={localScanPaths}
          onPathChange={() => {}} // N/A, path navigation is handled internally by FileExplorer
          onScanPathsChange={setLocalScanPaths} // Update local state
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
          initialAssumptions={plan.assumptions}
          initialConfidence={plan.confidence}
          initialEstimatedEffortMinutes={plan.estimatedEffortMinutes} // Corrected prop name
          initialBuildScripts={plan.buildScripts}
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
        position="left"
        size="normal"
        title="All AI Plans"
        hasBackdrop={true}
        footerActionButton={plannerListDrawerActions}
      >
        <PlannerList />
      </CustomDrawer>

      <CustomDrawer
        open={isErrorDetailsDrawerOpen}
        onClose={() => setIsErrorDetailsDrawerOpen(false)}
        position="left"
        size="normal"
        title="Error Details"
        hasBackdrop={true}
        footerActionButton={errorDrawerActions}
      >
        <ErrorDetailsDrawerContent 
            plan={plan} 
            error={error} 
        />
      </CustomDrawer>

      {/* Snackbar for General Errors (generation failure) OR Apply Status */}
      <CustomSnackbar
        open={snackbarOpen}
        autoHideDuration={6000} // Added autoHideDuration for consistency
        onClose={handleSnackbarClose}
        severity={snackbarSeverity}
        message={snackbarMessage || 'An unknown error occurred.'} // Use message state, fallback to generation error
      />
    </Box>
  );
};

export default PlanGenerator;
