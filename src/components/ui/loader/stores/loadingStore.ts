 import { atom } from 'nanostores';

// ---------------------------
// 1. Interfaces & Types
// ---------------------------

export interface LoadingState {
  isGlobalLoading: boolean;
  message: string;
}

const INITIAL_STATE: LoadingState = {
  isGlobalLoading: false,
  message: 'Processing request...',
};

export const loadingStore = atom<LoadingState>(INITIAL_STATE);

// ---------------------------
// 2. Actions
// ---------------------------

/**
 * Starts the global loading state with an optional message.
 */
export const startGlobalLoading = (message: string = 'Processing request...') => {
  loadingStore.set({
    isGlobalLoading: true,
    message: message,
  });
};

/**
 * Stops the global loading state.
 */
export const stopGlobalLoading = () => {
  loadingStore.set(INITIAL_STATE);
};
