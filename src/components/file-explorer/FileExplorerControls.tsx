// src/components/file-explorer/FileExplorerControls.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Tooltip,
  Stack,
  useTheme,
  SxProps,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import * as path from 'path-browserify';

/**
 * Props for the FileExplorerControls component.
 */
interface FileExplorerControlsProps {
  currentPath: string;
  isLoading: boolean;
  onNavigate: (newPath: string) => void;
  onRefresh: () => void;
  onGoUp: () => void;
  // Optional: action when user wants to use this path for planning/context
  onUsePath?: (path: string) => void; 
}

// ================================================
// SX Prop Definitions
// ================================================

const controlsContainerSx: SxProps = {
  p: 2,
  borderBottom: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
};

const FileExplorerControls: React.FC<FileExplorerControlsProps> = ({
  currentPath,
  isLoading,
  onNavigate,
  onRefresh,
  onGoUp,
  onUsePath,
}) => {
  const theme = useTheme();
  const [inputPath, setInputPath] = useState(currentPath);

  // Sync internal state when external path changes
  useEffect(() => {
    setInputPath(currentPath);
  }, [currentPath]);

  const handleGoToPath = useCallback(() => {
    const trimmedPath = inputPath.trim();
    if (trimmedPath) {
      const normalizedPath = path.normalize(trimmedPath.replace(/\\/g, '/'));
      onNavigate(normalizedPath);
    }
  }, [inputPath, onNavigate]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGoToPath();
    }
  };

  const isRoot = useMemo(() => {
    const normalizedPath = currentPath.replace(/\\/g, '/');
    const rootPatterns = ['/', /^[a-zA-Z]:[\\/]{0,1}$/];
    return rootPatterns.some((pattern) =>
      typeof pattern === 'string'
        ? normalizedPath === pattern
        : pattern.test(normalizedPath),
    );
  }, [currentPath]);

  return (
    <Box sx={controlsContainerSx}>
      <Stack direction="row" spacing={1} alignItems="center">
 
        <TextField
          fullWidth
          size="small"
          placeholder="Enter path or click a folder..."
          value={inputPath}
          onChange={(e) => setInputPath(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FolderOpenIcon color="action" />
              </InputAdornment>
            ),
            sx: {
              bgcolor: theme.palette.background.default,
            },
          }}
        />

        {/* Action Buttons */}
        <Tooltip title="Go to entered path">
          <Button
            variant="contained"
            onClick={handleGoToPath}
            disabled={isLoading || !inputPath.trim() || inputPath === currentPath}
            size="small"
          >
            Go
          </Button>
        </Tooltip>

        <Tooltip title="Go up one level">
          <span>
            <IconButton
              onClick={onGoUp}
              disabled={isLoading || isRoot}
              size="medium"
              color="secondary"
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Refresh contents">
          <IconButton
            onClick={onRefresh}
            disabled={isLoading}
            size="medium"
            color="secondary"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        {onUsePath && (
            <Tooltip title="Use this directory for AI planning">
            <IconButton
                onClick={() => onUsePath(currentPath)}
                disabled={isLoading}
                size="medium"
                color="primary"
            >
                <SendIcon fontSize="small" />
            </IconButton>
            </Tooltip>
        )}

      </Stack>
    </Box>
  );
};

export default FileExplorerControls;