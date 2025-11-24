import React from 'react';
import { Snackbar, Alert, IconButton, AlertColor, SnackbarProps, AlertProps, SxProps } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ---------------------------
// 1. Interfaces & Types
// ---------------------------

interface CustomSnackbarProps {
  open: boolean;
  message: string;
  severity: AlertColor;
  /** Callback fired when the component requests to be closed. Use reason to distinguish close source. */
  onClose: (event: React.SyntheticEvent | Event, reason: string) => void;
  autoHideDuration?: number | null;
  anchorOrigin?: SnackbarProps['anchorOrigin'];
  /** Optional custom SX passed to the inner Alert component. */
  alertSx?: AlertProps['sx'];
}

// ---------------------------
// 2. Component Implementation
// ---------------------------

/**
 * A reusable, opinionated Snackbar component that displays a Material UI Alert with a configurable severity,
 * message, and close button, typically used for transient notifications (errors, success).
 */
export const CustomSnackbar: React.FC<CustomSnackbarProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
  alertSx,
}) => {
  // Use a custom handler for the explicit Alert close button click to ensure `reason` is meaningful
  const handleAlertCloseClick = (event: React.SyntheticEvent | Event) => {
    onClose(event, 'closeButtonClick');
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      // Ensure the key prop is not needed here as this is globally mounted, not mapped.
    >
      <Alert
        severity={severity}
        sx={{ width: '100%', ...alertSx }}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleAlertCloseClick}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};
