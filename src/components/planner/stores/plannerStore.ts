import { atom } from 'nanostores';
import type { IPlan, IFileChange } from '../types';
import {
  INSTRUCTION as PLANNER_AI_INSTRUCTION,
  INSTRUCTION_SCHEMA_OUTPUT as PLANNER_EXPECTED_OUTPUT_FORMAT
} from '@/components/planner/constants/instructions';

import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { plannerService } from '../api/plannerService'; // Import plannerService

// Define a reasonable default project root path if none is set
// This path is specific to the user's environment, based on the project structure.
const DEFAULT_PROJECT_ROOT_FROM_ENV = import.meta.env.VITE_BASE_DIR; // Get default from environment

// Initialize projectRootDirectoryStore with a default if it's empty or null
const initialProjectRoot = projectRootDirectoryStore.get();
if (initialProjectRoot === null || initialProjectRoot === '') {
  projectRootDirectoryStore.set(DEFAULT_PROJECT_ROOT_FROM_ENV);
}

interface PlannerState {
  userPrompt: string;
  currentPlanId: string | null; // Moved here and managed directly
  plan: IPlan | null;
  isLoading: boolean;
  error: string | null;
  applyStatus: 'idle' | 'applying' | 'success' | 'failure';
  applyError: string | null;
  projectRoot: string;
  scanPathsInput: string;
  additionalInstructions: string;
  expectedOutputFormat: string;
  fileData: string | null; // New: Base64 encoded file content for multimodal input
  fileMimeType: string | null; // New: MIME type of the uploaded file
}

export const plannerStore = atom<PlannerState>({
  userPrompt: '',
  currentPlanId: null,
    // Ensure projectRoot is always a valid string on initialization
  plan: null,
  isLoading: false,
  error: null,
  applyStatus: 'idle',
  applyError: null,
  projectRoot: projectRootDirectoryStore.get() || DEFAULT_PROJECT_ROOT_FROM_ENV, // Fallback to env default
  scanPathsInput: 'src, public, package.json, README.md, .env', // Provide sensible defaults for scan paths
  additionalInstructions: PLANNER_AI_INSTRUCTION, // Default from constants
  expectedOutputFormat: PLANNER_EXPECTED_OUTPUT_FORMAT, // Default from constants
  fileData: null,
  fileMimeType: null,
});

// Action to set the current plan ID
export const setCurrentPlanId = (planId: string | null) => {
  plannerStore.set({ ...plannerStore.get(), currentPlanId: planId });
};

export const setUserPrompt = (prompt: string) => {
  plannerStore.set({ ...plannerStore.get(), userPrompt: prompt });
};

export const setPlan = (planId: string | null, plan: IPlan | null) => {
  plannerStore.set({
    ...plannerStore.get(),
    currentPlanId: planId,
    plan: plan,
    isLoading: false,
    error: null, // Clear error on successful plan load/generation
  });
};

export const setIsLoading = (loading: boolean) => {
  plannerStore.set({ ...plannerStore.get(), isLoading: loading, error: null });
};

export const setError = (error: string | null) => {
  plannerStore.set({ ...plannerStore.get(), error: error, isLoading: false });
};

export const setApplyStatus = (
  status: PlannerState['applyStatus'],
  error: string | null = null,
) => {
  plannerStore.set({ ...plannerStore.get(), applyStatus: status, applyError: error });
};

export const setProjectRoot = (root: string) => {
  plannerStore.set({ ...plannerStore.get(), projectRoot: root });
};

export const setScanPathsInput = (paths: string) => {
  plannerStore.set({ ...plannerStore.get(), scanPathsInput: paths });
};

export const setAdditionalInstructions = (instructions: string) => {
  plannerStore.set({ ...plannerStore.get(), additionalInstructions: instructions });
};

export const setExpectedOutputFormat = (format: string) => {
  plannerStore.set({ ...plannerStore.get(), expectedOutputFormat: format });
};

// New action to set file data and MIME type for multimodal input
export const setFileDataAndMimeType = (data: string | null, mimeType: string | null) => {
  plannerStore.set({ ...plannerStore.get(), fileData: data, fileMimeType: mimeType });
};

/**
 * Fetches a plan by its ID from the backend and updates the store.
 * @param planId The ID of the plan to load.
 */
export const loadPlanById = async (planId: string) => {
  setIsLoading(true);
  setError(null);
  try {
    const response = await plannerService.getPlan(planId);
    // The getPlan service returns { plan: IPlan }, so extract the plan object.
    setPlan(planId, response.plan);
  } catch (err: unknown) { // Changed 'any' to 'unknown'
    setError((err as Error).message || `Failed to load plan ${planId}.`);
    setPlan(null, null); // Clear plan on error
  } finally {
    // setIsLoading(false) is handled by setPlan or setError
  }
};

/**
 * Updates specific metadata fields of the currently active plan.
 * @param updatedMetadata An object containing the fields to update.
 */
export const updateCurrentPlanMetadata = (updatedMetadata: {
  title?: string;
  summary?: string;
  thoughtProcess?: string;
  documentation?: string;
  gitInstructions?: string[];
}) => {
  const current = plannerStore.get();
  if (current.plan && current.currentPlanId === current.plan.id) {
    plannerStore.set({
      ...current,
      plan: {
        ...current.plan,
        ...updatedMetadata,
        updatedAt: new Date(), // Mark as updated
      },
    });
  } else {
    console.warn('Attempted to update plan metadata but no current plan or planId mismatch.');
  }
};

/**
 * Updates a specific file change within the currently active plan.
 * @param planId The ID of the plan to update.
 * @param changeIndex The index of the file change within the plan's changes array.
 * @param updatedChange The new IFileChange object to replace the existing one.
 */
export const updateFileChange = (planId: string, changeIndex: number, updatedChange: IFileChange) => {
  const current = plannerStore.get();
  if (current.plan && current.plan.id === planId && current.plan.changes[changeIndex]) {
    const newChanges = [...current.plan.changes];
    newChanges[changeIndex] = updatedChange;
    plannerStore.set({
      ...current,
      plan: {
        ...current.plan,
        changes: newChanges,
        updatedAt: new Date(), // Mark the plan as updated
      },
    });
  } else {
    console.warn(
      `Attempted to update file change at index ${changeIndex} for plan ${planId}, but plan or index not found.`, 
    );
  }
};

export const resetPlannerState = () => {
  plannerStore.set({
    userPrompt: '',
    currentPlanId: null,
    plan: null,
    isLoading: false,
    error: null, // Ensure error is cleared when resetting state
    applyStatus: 'idle',
    applyError: null,
    projectRoot: projectRootDirectoryStore.get() ?? DEFAULT_PROJECT_ROOT_FROM_ENV,
    scanPathsInput: 'src, public, package.json, README.md, .env', // Reset to default scan paths as well
    additionalInstructions: PLANNER_AI_INSTRUCTION,
    expectedOutputFormat: PLANNER_EXPECTED_OUTPUT_FORMAT,
    fileData: null, // New: Clear file data
    fileMimeType: null, // New: Clear file MIME type
  });
};
