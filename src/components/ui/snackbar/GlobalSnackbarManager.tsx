import React, { useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { snackbarStore, closeSnackbar } from './stores/snackbarStore';
import { CustomSnackbar } from './CustomSnackbar';
import type { SnackbarProps } from '@mui/material/Snackbar';

/**
 * Manages the rendering and lifecycle of global snackbar notifications.
 * Listens to the snackbarStore.
 */
const GlobalSnackbarManager: React.FC = () => {
  const state = useStore(snackbarStore);

  const handleClose = useCallback(
    (_event: React.SyntheticEvent | Event, reason: string) => {
      // Allow programmatic closure (e.g., from autoHideDuration) or explicit user click.
      // We only care about closing the store state here.
      closeSnackbar();
    },
    [],
  );

  if (!state.isOpen) {
    return null;
  }

  // Define anchorOrigin (matching the CustomSnackbar default but potentially customizable later)
  const anchorOrigin: SnackbarProps['anchorOrigin'] = { 
      vertical: 'bottom', 
      horizontal: 'center' 
  };

  return (
    <CustomSnackbar
      open={state.isOpen}
      message={state.message}
      severity={state.severity}
      onClose={handleClose}
      autoHideDuration={state.autoHideDuration}
      anchorOrigin={anchorOrigin}
    />
  );
};

export default GlobalSnackbarManager;
