import React, { useMemo } from 'react';
import { Box, Paper, SxProps, useTheme, Typography } from '@mui/material';
import FileExplorer from '@/components/file-explorer/FileExplorer';
import FileEditorViewer from '@/components/editor/FileEditorViewer';
import { useStore } from '@nanostores/react';
import { editorStore } from '@/components/editor/stores/editorStore';
import CodeIcon from '@mui/icons-material/Code';

/**
 * The main Codejector workspace page featuring a persistent split view:
 * Left: File Explorer (max width 300px)
 * Right: File Editor Viewer (main editing area)
 */
const CodejectorPage: React.FC = () => {
  const theme = useTheme();
  const { fileEntry } = useStore(editorStore);

  // Styles for the file explorer wrapper
  const fileExplorerSx: SxProps = useMemo(() => ({
    width: '300px', // Fixed width for the explorer
    maxWidth: '300px', 
    minWidth: '200px', // Ensure it doesn't shrink too much
    height: '100%',
    flexShrink: 0,
    borderRight: `1px solid ${theme.palette.divider}`,
    overflow: 'hidden',
  }), [theme]);

  // Styles for the editor viewer wrapper
  const editorViewerSx: SxProps = {
    flexGrow: 1,
    height: '100%',
    overflow: 'hidden',
    position: 'relative', // Context for internal positioning
  };

  // When used here, FileEditorViewer reads its context from the global editorStore.
  // It expects the editorStore to contain the file selected in the FileExplorer.
  const handleEditorClose = () => {
    // In the persistent editor context, 'closing' means clearing the content,
    // but we currently rely on file selection/navigation to manage editorStore state.
    console.log("Persistent editor close requested. This action is currently managed by file selection in the explorer.");
  };

  // Determine the effective height based on the Layout.tsx padding (p: 3) and AppBar height (~64px)
  const layoutOffset = theme.spacing(3); 
  const toolbarHeight = 64; 

  return (
    <Box 
        className="flex w-full"
        // Calculate height: 100vh - AppBar height - 2 * padding
        sx={{ 
            height: `calc(100vh - ${toolbarHeight}px - 2 * ${layoutOffset})`,
            display: 'flex',
            overflow: 'hidden', // Contain scrolling within the flex children
        }}
    >
      {/* Left Sidebar: File Explorer */}
      <Paper 
        elevation={2} 
        sx={fileExplorerSx} 
        className="bg-background-paper"
      >
        <FileExplorer />
      </Paper>

      {/* Right Content: File Editor Viewer */}
      <Paper 
        elevation={0} // No shadow needed here, border separates it
        sx={editorViewerSx}
        className="bg-background-paper"
      >
        {fileEntry ? (
            <FileEditorViewer onClose={handleEditorClose} />
        ) : (
            <Box className="flex flex-col justify-center items-center h-full">
                 <CodeIcon sx={{ fontSize: 100, color: 'text.disabled', mb: 3 }} />
                 <Typography variant="h6" color="text.secondary">
                    Select a file from the explorer to begin coding.
                 </Typography>
            </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CodejectorPage;
