import { atom } from 'nanostores';
import type { AlertColor } from '@mui/material';

// ---------------------------
// 1. Interfaces & Types
// ---------------------------

export interface SnackbarState {
  isOpen: boolean;
  message: string;
  severity: AlertColor;
  autoHideDuration: number | null;
}

const INITIAL_STATE: SnackbarState = {
  isOpen: false,
  message: '',
  severity: 'info',
  autoHideDuration: 6000,
};

export const snackbarStore = atom<SnackbarState>(INITIAL_STATE);

/**
 * Action to close the snackbar and reset its state.
 */
export const closeSnackbar = () => {
  snackbarStore.set(INITIAL_STATE);
};

/**
 * Action to show the snackbar with custom parameters.
 */
export const showSnackbar = (
  message: string,
  severity: AlertColor = 'info',
  autoHideDuration: number | null = 6000,
) => {
  // Setting isOpen: true immediately clears previous state implicitly
  snackbarStore.set({
    isOpen: true,
    message,
    severity,
    autoHideDuration,
  });
};
