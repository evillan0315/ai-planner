import React, { useEffect, useRef } from 'react';
import { Box, Paper, SxProps, useTheme, Typography } from '@mui/material';
import FileEditorViewer from '@/components/editor/FileEditorViewer';
import { useStore } from '@nanostores/react';
import {
  editorStore,
  loadFileContentFromPath,
} from '@/components/editor/stores/editorStore';
import CodeIcon from '@mui/icons-material/Code';
import { useSearchParams } from 'react-router-dom'; // KEEP: Used for loading initial path via URL query parameter
// Import UI Store for Layout Control
import { isLeftSidebarVisible } from '@/stores/uiStore';

/**
 * Styles for the editor viewer wrapper (This will be the main content area provided by Layout)
 */
const editorViewerSx: SxProps = {
  flexGrow: 1,
  height: '100%', // Take up all available vertical space in main-outlet-content
  overflow: 'hidden',
  position: 'relative',
  p: 0, // Ensure no padding around the editor view
};

/**
 * The main Codejector workspace page featuring a persistent split view.
 * It relies on the main Layout component to render the FileExplorer in the
 * automatically resized left sidebar, and renders the editor in the main content area.
 */
const CodejectorPage: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  // Get state from the global editor store
  const { fileEntry } = useStore(editorStore);

  // Use a ref to save the *initial* state of the sidebar when mounting.
  const previousSidebarState = useRef(isLeftSidebarVisible.get());

  // --- Layout Control Effect ---
  useEffect(() => {
    const urlPath = searchParams.get('path');

    if (urlPath) {
      const n = loadFileContentFromPath(urlPath);
    }
    // 1. Force Left Sidebar (File Explorer) ON when entering Codejector workspace
    // We only force it on if it's currently off.
    if (!previousSidebarState.current) {
      isLeftSidebarVisible.set(true);
    }

    // 2. Cleanup function: Revert sidebar visibility state if it was off when we entered
    return () => {
      // If the sidebar was OFF when we started, ensure we hide it when navigating away.
      if (!previousSidebarState.current) {
        isLeftSidebarVisible.set(false);
      }
    };
  }, [searchParams]); // Empty dependency array means this runs only on mount/unmount

  // When used here, FileEditorViewer reads its context from the global editorStore.
  const handleEditorClose = () => {
    console.log(
      'Persistent editor close requested. Action ignored as this is a dedicated workspace.',
    );
  };

  return (
    <Box
      // The Layout component handles the full viewport height minus header/footer.
      // We just need to ensure we fill 100% of the space provided to {children}.
      className="flex w-full h-full p-0"
      sx={{ display: 'flex', overflow: 'hidden' }}
    >
      {/* Main Content: File Editor Viewer */}
      <Paper elevation={0} sx={editorViewerSx} className="bg-background-paper">
        {fileEntry ? (
          <FileEditorViewer
            onClose={handleEditorClose}
            contextEntru={fileEntry}
          />
        ) : (
          <Box className="flex flex-col justify-center items-center h-full">
            <CodeIcon sx={{ fontSize: 100, color: 'text.disabled', mb: 3 }} />
            <Typography variant="h6" color="text.secondary">
              Select a file from the explorer (left sidebar) to begin coding.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CodejectorPage;
