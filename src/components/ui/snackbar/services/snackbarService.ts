 import type { AlertColor } from '@mui/material';
import { showSnackbar, closeSnackbar } from '../stores/snackbarStore';

/**
 * Service layer for dispatching global, non-blocking notification messages
 * using the CustomSnackbar component.
 */
export const snackbarService = {
  /**
   * Shows a generic snackbar notification.
   */
  show: (
    message: string,
    severity: AlertColor = 'info',
    autoHideDuration: number | null = 6000,
  ) => {
    showSnackbar(message, severity, autoHideDuration);
  },

  /**
   * Shows a success notification.
   */
  showSuccess: (message: string, autoHideDuration: number | null = 6000) => {
    showSnackbar(message, 'success', autoHideDuration);
  },

  /**
   * Shows an error notification.
   */
  showError: (message: string, autoHideDuration: number | null = 8000) => {
    showSnackbar(message, 'error', autoHideDuration);
  },

  /**
   * Shows a warning notification.
   */
  showWarning: (message: string, autoHideDuration: number | null = 6000) => {
    showSnackbar(message, 'warning', autoHideDuration);
  },

  /**
   * Manually closes the currently displayed snackbar.
   */
  close: () => {
    closeSnackbar();
  },
};
