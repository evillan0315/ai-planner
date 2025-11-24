import React from 'react';
import { Box, LinearProgress, useTheme, SxProps } from '@mui/material';
import { useStore } from '@nanostores/react';
import { loadingStore } from './stores/loadingStore';

// ---------------------------
// 1. Interfaces & Types
// ---------------------------

// No specific props needed as state is derived from the store

// ---------------------------
// 2. SX Prop Definitions
// ---------------------------

const NAVBAR_HEIGHT = 50; // Must match NavBar height defined in AppLayout
const LOADER_Z_INDEX = 1200; // Above main content, below dialogs/snackbars

const linearLoaderSx: SxProps = {
  position: 'fixed',
  top: NAVBAR_HEIGHT,
  left: 0,
  width: '100%',
  zIndex: LOADER_Z_INDEX,
};

/**
 * Global component to display a linear loading indicator below the main navigation bar.
 * It is triggered by `isGlobalLoading` state in `loadingStore`.
 */
const GlobalLinearLoader: React.FC = () => {
  const { isGlobalLoading } = useStore(loadingStore);
  const theme = useTheme();

  if (!isGlobalLoading) {
    return null;
  }

  return (
    <Box sx={linearLoaderSx} role="progressbar" aria-busy="true">
      {/* 
        LinearProgress is indeterminate by default, perfect for global loading.
        Use color="primary" by default.
      */}
      <LinearProgress color="primary" />
    </Box>
  );
};

export default GlobalLinearLoader;
