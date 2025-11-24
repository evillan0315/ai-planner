import React from 'react';
import { Box, Paper, useTheme, SxProps } from '@mui/material';
import { useStore } from '@nanostores/react';
import { loadingStore } from './stores/loadingStore';
import Loading from './Loading'; // Import the standard Loading component

// ---------------------------
// 1. Interfaces & Types
// ---------------------------

// No specific props needed as state is derived from the store

// ---------------------------
// 2. SX Prop Definitions
// ---------------------------

const OVERLAY_Z_INDEX = 9000; // High Z-index to cover everything except dialogs/snackbars

const overlaySx: SxProps = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: OVERLAY_Z_INDEX,
};

const loadingContentSx = (theme: ReturnType<typeof useTheme>): SxProps => ({
    padding: 4,
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[10],
    // Ensure the loading content box itself is small, centered, and does not take 100% height/width
    maxWidth: '80vw',
    maxHeight: '80vh',
    minWidth: 200,
});


/**
 * Global component to display a blocking or non-blocking loading overlay
 * based on the state of the loadingStore.
 */
const GlobalLoadingOverlay: React.FC = () => {
  const { isGlobalLoading, message } = useStore(loadingStore);
  const theme = useTheme();

  if (!isGlobalLoading) {
    return null;
  }

  return (
    <Box sx={{...overlaySx, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
      <Paper sx={loadingContentSx(theme)} elevation={24}>
        <Loading 
            type="circular" // Use a prominent, blocking type
            message={message}
            size={40}
        />
      </Paper>
    </Box>
  );
};

export default GlobalLoadingOverlay;
