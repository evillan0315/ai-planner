import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { useNavigate } from 'react-router-dom';
import type { GlobalAction } from '@/components/ui/GlobalActionButton';
import type { IFileChange, IPlan } from './types';
import type { ReviseRequestDto } from '@/components/prompt/api';
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
  setApplyStatus,
  setPlannerProjectRoot,
  setRevisionTone,
} from './stores/plannerStore';
import { projectRootDirectoryStore, setProjectRoot as setGlobalProjectRoot } from '@/components/file-explorer/stores/fileTreeStore';
import { loadingStore, startGlobalLoading, stopGlobalLoading } from '@/components/ui/loader/stores/loadingStore';
import { plannerService } from './api/plannerService';
import { promptService } from '@/components/prompt/api';
import { fileExplorerService } from '@/components/file-explorer/api/fileExplorerService';
import { ScanConfig } from '@/components/file-explorer/types';
import { INSTRUCTION, INSTRUCTION_SCHEMA_OUTPUT } from './constants/instructions';
import { buildLLMPrompt, extractJsonFromMarkdown } from './utils';
import { getMonacoLanguage } from '@/utils/editorUtils';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { truncateTitle as defaultTruncateTitle } from './utils/truncate'; // if not available, will fallback below

// Fallback truncate implementation if not exported elsewhere
const truncateTitle = (title: string, maxLength = 40): string => {
  if (!title || title.length <= maxLength) return title;
  return `${title.substring(0, maxLength - 3)}...`;
};

export default function usePlanGeneratorLogic() {
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
    applyStatus,
    applyError,
    revisionTone,
  } = useStore(plannerStore);

  const globalProjectRoot = useStore(projectRootDirectoryStore);
  const { isGlobalLoading } = useStore(loadingStore);

  const navigate = useNavigate();

  // local UI state (drawers/snackbars)
  const [isProjectRootPickerDialogOpen, setIsProjectRootPickerDialogOpen] = useState(false);
  const [isScanPathsDialogOpen, setIsScanPathsDialogOpen] = useState(false);
  const [isAiInstructionDrawerOpen, setIsAiInstructionDrawerOpen] = useState(false);
  const [isExpectedOutputDrawerOpen, setIsExpectedOutputDrawerOpen] = useState(false);
  const [isPlanMetadataEditorOpen, setIsPlanMetadataEditorOpen] = useState(false);
  const [isFileChangeEditorOpen, setIsFileChangeEditorOpen] = useState(false);
  const [editingFileChange, setEditingFileChange] = useState<IFileChange | null>(null);
  const [editingFileChangeIndex, setEditingFileChangeIndex] = useState<number | null>(null);
  const [isPlannerListDrawerOpen, setIsPlannerListDrawerOpen] = useState(false);
  const [isSystemConfigDrawerOpen, setIsSystemConfigDrawerOpen] = useState(false);
  const [isErrorDetailsDrawerOpen, setIsErrorDetailsDrawerOpen] = useState(false);

  // snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // local drawer-managed inputs
  const [tempDrawerProjectRootInput, setTempDrawerProjectRootInput] = useState(projectRoot || '');
  const [localScanPaths, setLocalScanPaths] = useState<string[]>([]);

  // Sync planner project root with global project root
  useEffect(() => {
    if (globalProjectRoot && projectRoot !== globalProjectRoot) {
      setPlannerProjectRoot(globalProjectRoot);
    }
    setTempDrawerProjectRootInput(projectRoot || '');
  }, [globalProjectRoot, projectRoot]);

  // Populate fields when a plan is loaded
  useEffect(() => {
    if (plan && currentPlanId === plan.id) {
      setUserPrompt(plan.llmInput?.userPrompt || plan.title);
      setPlannerProjectRoot(plan.llmInput?.projectRoot || globalProjectRoot || projectRoot || '/');
      setScanPathsInput(plan.llmInput?.scanPaths?.join(', ') || 'package.json, README.md, .env');
      setAdditionalInstructions(plan.llmInput?.additionalInstructions || INSTRUCTION);
      setExpectedOutputFormat(plan.llmInput?.expectedOutputFormat || INSTRUCTION_SCHEMA_OUTPUT);
    }
  }, [plan, currentPlanId, globalProjectRoot, projectRoot]);

  // Error snackbar effect
  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [error]);

  // keep store userPrompt in sync
  useEffect(() => {
    if (userPrompt) {
      setUserPrompt(userPrompt);
    }
  }, [userPrompt]);

  // Global apply status snackbar
  useEffect(() => {
    if (applyStatus === 'success') {
      setSnackbarMessage('Plan applied successfully! Please check your project directory.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } else if (applyStatus === 'failure') {
      setSnackbarMessage(`Error applying plan: ${applyError}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } else if (applyStatus === 'idle' || applyStatus === 'applying') {
      setSnackbarOpen(false);
    }
  }, [applyStatus, applyError]);

  const currentScanPathsArray = useMemo(
    () =>
      (scanPathsInput || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [scanPathsInput],
  );

  const handlePromptGenerate = useCallback(async () => {
    const payload: ReviseRequestDto = { text: userPrompt, tone: revisionTone };
    const rawResponse = await promptService.reviseText(payload);
    setUserPrompt(rawResponse.revisedText);
  }, [userPrompt, revisionTone]);

  const handleRevisionTone = useCallback((tone: string) => {
    setRevisionTone(tone || '');
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleLoadProject = useCallback((selectedPath: string) => {
    if (!selectedPath.trim()) {
      setError('Please provide a project root path.');
      return;
    }
    setPlannerProjectRoot(selectedPath);
    setGlobalProjectRoot(selectedPath);
    setError('');
    setPlan(null, null);
  }, []);

  const handleScanDirectory = useCallback(async () => {
    try {
      const rFiles: ScanConfig = {
        projectRoot,
        scanPaths: currentScanPathsArray,
        verbose: false,
      };
      return await fileExplorerService.scanDirectory(rFiles);
    } catch (err: unknown) {
      console.error(err, 'File Scan Error');
      setError((err as Error).message || 'Failed to scan files.');
    }
  }, [projectRoot, currentScanPathsArray]);

  const handleProjectStructure = useCallback(async () => {
    try {
      return await plannerService.getProjectStructure(projectRoot);
    } catch (err: unknown) {
      console.error(err, 'Failed to get structure');
      setError((err as Error).message || 'Failed to get structure ');
    }
  }, [projectRoot]);

  const handleGeneratePlan = useCallback(async (): Promise<void> => {
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
      const relevantFiles = await handleScanDirectory();
      if (!relevantFiles || !Array.isArray(relevantFiles) || relevantFiles.length === 0) {
        throw new Error('No files returned from scanner. Adjust your scan paths or project root.');
      }

      const projectStructure = await handleProjectStructure();
      if (projectStructure !== undefined && typeof projectStructure !== 'string') {
        console.warn('Unexpected projectStructure type; proceeding with empty string fallback.', projectStructure);
      }

      const llmInput = {
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
      } as const;

      if (llmInput.fileData && llmInput.fileMimeType) {
        // @ts-ignore
        llmInput.requestType = llmInput.fileMimeType.startsWith('image/') ? 'TEXT_WITH_IMAGE' : 'TEXT_WITH_FILE';
      }

      const fullPrompt = await buildLLMPrompt(llmInput as any, relevantFiles, (projectStructure as string) ?? '');

      const rawResponse = await plannerService.generate(llmInput as any, fullPrompt);

      if (!rawResponse || (typeof rawResponse !== 'string' && typeof rawResponse !== 'object')) {
        throw new Error('Planner returned an unexpected response.');
      }

      const extracted = await extractJsonFromMarkdown(rawResponse);
      let parsedPlan: IPlan | null = null;
      const tryParse = (candidate: string) => {
        try {
          return JSON.parse(candidate) as IPlan;
        } catch (error) {
          const errorData = {
            message: (error as Error).message || 'Failed to parse llm response.',
            data: JSON.stringify(candidate),
          };
          setError(JSON.stringify(errorData));
          return null;
        }
      };

      if (extracted) {
        parsedPlan = tryParse(extracted);
      } else if (typeof rawResponse === 'string') {
        parsedPlan = tryParse(rawResponse);
      }

      if (!parsedPlan) throw new Error('Failed to parse plan from LLM response.');

      parsedPlan.title = parsedPlan.title?.trim() || truncateTitle(parsedPlan.summary || userPrompt.slice(0, 80));
      const revisedPlan = {
        ...parsedPlan,
        llmInput,
        projectRoot,
      };

      const createRes = await plannerService.createPlan(revisedPlan as any);

      if (!createRes) {
        throw new Error('Failed to create or normalize the plan returned by the service.');
      }

      setPlan(createRes);
      setCurrentPlanId(createRes.planId);
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
    handleScanDirectory,
    handleProjectStructure,
    fileData,
    fileMimeType,
  ]);

  const handleApplyPlan = useCallback(async () => {
    if (!plan || !plan.id) {
      setApplyStatus('failure', 'No plan available to apply or plan ID is missing.');
      return;
    }
    setApplyStatus('applying');
    try {
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

  const handleClearPlan = useCallback(() => {
    resetPlannerState();
    setTempDrawerProjectRootInput(projectRootDirectoryStore.get() || '');
    setLocalScanPaths(
      (plannerStore.get().scanPathsInput || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    setSelectedFile(null);
    navigate('/planner-generator');
  }, [navigate]);

  const handleSavePlanMetadata = useCallback((updatedData: Partial<IPlan>) => {
    updateCurrentPlanMetadata(updatedData as any);
    setIsPlanMetadataEditorOpen(false);
  }, []);

  const handleEditFileChangeRequest = useCallback((index: number, change: IFileChange) => {
    setIsFileChangeEditorOpen(true);
    setEditingFileChange(change);
    setEditingFileChangeIndex(index);
  }, []);

  const handleSaveEditedFileChange = useCallback((updatedChange: IFileChange) => {
    if (plan && editingFileChangeIndex !== null) {
      updateFileChange(plan.id, editingFileChangeIndex, updatedChange);
    }
    setIsFileChangeEditorOpen(false);
    setEditingFileChange(null);
    setEditingFileChangeIndex(null);
  }, [plan, editingFileChangeIndex]);

  // openers used by PlanInputForm
  const openScanPathsDrawer = useCallback(() => {
    const currentPaths = (scanPathsInput || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setLocalScanPaths(currentPaths);
    setIsScanPathsDialogOpen(true);
  }, [scanPathsInput]);

  const openProjectRootPicker = useCallback(() => {
    setTempDrawerProjectRootInput(projectRoot);
    setIsProjectRootPickerDialogOpen(true);
  }, [projectRoot]);

  // Drawer footer actions for directory picker and scan paths
  const directoryPickerDrawerActions: GlobalAction[] = useMemo(
    () => [
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
    ],
    [tempDrawerProjectRootInput],
  );

  const scanPathsDrawerActions: GlobalAction[] = useMemo(
    () => [
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
          setScanPathsInput(localScanPaths.join(', '));
          setIsScanPathsDialogOpen(false);
        },
        icon: <CheckIcon />,
        color: 'primary',
        variant: 'contained',
      },
    ],
    [localScanPaths],
  );

  const plannerListDrawerActions: GlobalAction[] = useMemo(
    () => [
      {
        label: 'Close',
        action: () => setIsPlannerListDrawerOpen(false),
        icon: <CloseIcon />,
        color: 'inherit',
        variant: 'outlined',
      },
    ],
    [],
  );

  const errorDrawerActions: GlobalAction[] = useMemo(
    () => [
      {
        label: 'Close',
        action: () => setIsErrorDetailsDrawerOpen(false),
        icon: <CloseIcon />,
        color: 'inherit',
        variant: 'outlined',
      },
    ],
    [],
  );

  const handleSnackbarClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  }, []);

  const planTitleHeader = useMemo(() => {
    if (!plan) {
      return (
        <div style={{ fontWeight: 700 }}>
          <AddRoadIcon /> Planner
        </div>
      );
    } else {
      return (
        <div title={plan.title} style={{ fontWeight: 700 }} className="truncate">
          {plan.title}
        </div>
      );
    }
  }, [plan]);

  const headerLeftActions: GlobalAction[] = useMemo(() => {
    if (!plan) return [];

    const isApplying = applyStatus === 'applying';
    const isSuccess = applyStatus === 'success';

    return [
      {
        label: 'Plan',
        iconOnly: true,
        icon: <AddRoadIcon fontSize="small" />,
        color: 'primary',
        disabled: isApplying || isSuccess,
      },
    ];
  }, [plan, applyStatus]);

  const headerRightActions: GlobalAction[] = useMemo(() => {
    const actions: GlobalAction[] = [];
    const isGenerating = isLoading;

   {/**actions.push({
      label: isGenerating ? 'Generating...' : 'Generate Plan',
      action: handleGeneratePlan,
      icon: isGenerating ? undefined : <RocketLaunchIcon />,
      color: 'success',
      disabled: isGenerating || !userPrompt?.trim(),
      iconOnly: true,
    });
    **/}

    if (plan) {
      const isApplying = applyStatus === 'applying';
      const isSuccess = applyStatus === 'success';

      actions.push({
        label: isApplying ? 'Applying...' : isSuccess ? 'Applied!' : 'Apply Plan',
        action: handleApplyPlan,
        icon: isApplying ? undefined : <RocketLaunchIcon />,
        color: isSuccess ? 'success' : 'primary',
        disabled: isApplying || isSuccess,
        iconOnly: true,
      });
    }

    return actions;
  }, [plan, applyStatus, handleApplyPlan, handleGeneratePlan, isLoading, userPrompt]);

  // Group drawer props to pass to a presentational drawers component
  const drawersProps = {
    // visibility flags + setters
    isProjectRootPickerDialogOpen,
    setIsProjectRootPickerDialogOpen,
    isScanPathsDialogOpen,
    setIsScanPathsDialogOpen,
    isAiInstructionDrawerOpen,
    setIsAiInstructionDrawerOpen,
    isExpectedOutputDrawerOpen,
    setIsExpectedOutputDrawerOpen,
    isPlanMetadataEditorOpen,
    setIsPlanMetadataEditorOpen,
    isFileChangeEditorOpen,
    setIsFileChangeEditorOpen,
    editingFileChange,
    setEditingFileChange,
    editingFileChangeIndex,
    setEditingFileChangeIndex,
    isPlannerListDrawerOpen,
    setIsPlannerListDrawerOpen,
    isSystemConfigDrawerOpen,
    setIsSystemConfigDrawerOpen,
    isErrorDetailsDrawerOpen,
    setIsErrorDetailsDrawerOpen,
    // local state and setters
    tempDrawerProjectRootInput,
    setTempDrawerProjectRootInput,
    localScanPaths,
    setLocalScanPaths,
    // actions
    directoryPickerDrawerActions,
    scanPathsDrawerActions,
    plannerListDrawerActions,
    errorDrawerActions,
    openProjectRootPicker,
    openScanPathsDrawer,
    openPlannerListDrawer: () => setIsPlannerListDrawerOpen(true),
    openAiInstructionDrawer: () => setIsAiInstructionDrawerOpen(true),
    openSystemConfig: () => setIsSystemConfigDrawerOpen(true),
    openExpectedOutputDrawer: () => setIsExpectedOutputDrawerOpen(true),
    openErrorDetailsDrawer: () => setIsErrorDetailsDrawerOpen(true),
    // small helpers to allow PlanInputForm to update store userPrompt
    setUserPrompt,
  };

  return {
    userPrompt,
    revisionTone,
    projectRoot,
    scanPathsInput,
    additionalInstructions,
    expectedOutputFormat,
    fileData,
    fileMimeType,
    selectedFile,
    isLoading,
    error,
    plan,
    applyStatus,
    snackbarOpen,
    snackbarSeverity,
    snackbarMessage,
    fileInputRef,
    handleFileChange,
    handleClearFile,
    handleGeneratePlan,
    handlePromptGenerate,
    handleClearPlan,
    openProjectRootPicker,
    openScanPathsDrawer,
    openPlannerListDrawer: () => setIsPlannerListDrawerOpen(true),
    openAiInstructionDrawer: () => setIsAiInstructionDrawerOpen(true),
    openSystemConfig: () => setIsSystemConfigDrawerOpen(true),
    openExpectedOutputDrawer: () => setIsExpectedOutputDrawerOpen(true),
    openErrorDetailsDrawer: () => setIsErrorDetailsDrawerOpen(true),
    handleRevisionTone,
    handleEditFileChangeRequest,
    handleSavePlanMetadata,
    handleSaveEditedFileChange,
    handleSnackbarClose,
    headerLeftActions,
    headerRightActions,
    planTitleHeader,
    drawersProps,
  };
}

