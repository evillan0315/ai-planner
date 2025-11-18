// src/pages/FileExplorerPage.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import FileExplorer from '@/components/file-explorer/FileExplorer';

/**
 * Page wrapper for the main File Explorer component.
 */
const FileExplorerPage: React.FC = () => {
  return (
    <Box className="h-full w-full p-4 sm:p-6 lg:p-8 flex flex-col">
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="text-secondary-main font-bold mb-6 flex-shrink-0"
      >
        Project File Explorer
      </Typography>
      <Box className="flex-grow min-h-0">
        <FileExplorer />
      </Box>
    </Box>
  );
};

export default FileExplorerPage;