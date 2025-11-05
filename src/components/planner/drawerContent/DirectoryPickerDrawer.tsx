import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';

import {
  Box,
  Alert,
  IconButton,
  Typography,
  TextField as MuiTextField,
  InputAdornment,
  useTheme,
  Tooltip,
  Button,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import FolderIcon from '@mui/icons-material/Folder'; // New icon for subdirectories
import * as path from 'path-browserify';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { plannerService } from '../api/plannerService';
import type { IDirectoryListing } from '../types';

interface DirectoryPickerDrawerProps {
  initialPath?: string;
  allowExternalPaths?: boolean;
  onPathUpdate?: (path: string) => void; // New prop for external path updates
}

const DirectoryPickerDrawer: React.FC<DirectoryPickerDrawerProps> = ({
  initialPath = import.meta.env.VITE_BASE_DIR, // Default initial path from environment variable
  allowExternalPaths = false,
  onPathUpdate, // Destructure new prop
}) => {
  const theme = useTheme();
  const [currentBrowsingPath, setCurrentBrowsingPath] = useState<string>('');
  const [tempPathInput, setTempPathInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null); // Re-purposed for path validation errors
  const [directoryContents, setDirectoryContents] = useState<IDirectoryListing | null>(null);
  const [loadingContents, setLoadingContents] = useState(false);
  const [fetchContentsError, setFetchContentsError] = useState<string | null>(null);

  const projectRoot = useStore(projectRootDirectoryStore);

  // Internal handler to update path states and notify parent
  const handlePathUpdateInternal = useCallback(
    (newPath: string) => {
      const normalizedPath = path.normalize(newPath.replace(/\\/g, '/'));
      setCurrentBrowsingPath(normalizedPath);
      setTempPathInput(normalizedPath);
      if (onPathUpdate) {
        onPathUpdate(normalizedPath);
      }
      setError(null); // Clear any path errors on update
      setFetchContentsError(null); // Clear any content fetch errors on path update
    },
    [onPathUpdate],
  );

  useEffect(() => {
    // Initialize with effective initial path from props, or store, or default
    const effectiveInitialPath = initialPath || projectRoot || '/';
    handlePathUpdateInternal(effectiveInitialPath);
  }, [initialPath, projectRoot, handlePathUpdateInternal]);

  // Effect to fetch directory contents whenever currentBrowsingPath changes
  useEffect(() => {
    const fetchContents = async () => {
      if (!currentBrowsingPath) return;
      setLoadingContents(true);
      setFetchContentsError(null);
      try {
        const contents = await plannerService.fetchDirectoryContents(currentBrowsingPath);
        setDirectoryContents(contents);
      } catch (err: unknown) {
        setFetchContentsError(
          (err as Error).message || `Failed to load contents for ${currentBrowsingPath}`,
        );
        setDirectoryContents(null); // Clear contents on error
      } finally {
        setLoadingContents(false);
      }
    };
    fetchContents();
  }, [currentBrowsingPath]);

  const handleGoUp = useCallback(() => {
    // Ensure projectRoot is a string before calling replace
    const normalizedProjectRoot = (projectRoot ?? '').replace(/\\/g, '/');
    const parentPath = path.dirname(currentBrowsingPath);
    const normalizedCurrentPath = currentBrowsingPath.replace(/\\/g, '/');
    const normalizedParentPath = parentPath.replace(/\\/g, '/');

    const rootPatterns = ['/', /^[a-zA-Z]:(\/|\\)$/];
    const isRoot = rootPatterns.some((pattern) =>
      typeof pattern === 'string'
        ? normalizedCurrentPath === pattern
        : pattern.test(normalizedCurrentPath),
    );

    if (normalizedParentPath && normalizedParentPath !== normalizedCurrentPath && !isRoot) {
      // Check if going above project root is allowed
      if (allowExternalPaths || normalizedParentPath.startsWith(normalizedProjectRoot)) {
        handlePathUpdateInternal(normalizedParentPath);
      } else if (normalizedParentPath === normalizedProjectRoot) {
        // Allow going to project root but not above if external paths are not allowed
        handlePathUpdateInternal(normalizedParentPath);
      }
    }
  }, [currentBrowsingPath, projectRoot, allowExternalPaths, handlePathUpdateInternal]);

  const handleGoToPath = useCallback(() => {
    const trimmedPath = tempPathInput.trim();
    if (!trimmedPath) {
      setError('Path cannot be empty.');
      return;
    }

    const normalizedPath = path.normalize(trimmedPath.replace(/\\/g, '/'));
    // If external paths are not allowed, ensure the path starts with the project root
    if (!allowExternalPaths && projectRoot && !normalizedPath.startsWith(projectRoot.replace(/\\/g, '/'))) {
      setError('Cannot navigate outside the defined project root.');
      return;
    }

    handlePathUpdateInternal(normalizedPath);
  }, [tempPathInput, allowExternalPaths, projectRoot, handlePathUpdateInternal]);

  const handleTempPathInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.target.value;
    setTempPathInput(newPath);
    if (onPathUpdate) {
      onPathUpdate(newPath); // Notify parent of manual input change
    }
    setError(null); // Clear path error as user types
  };

  const handleSelectDirectory = useCallback(
    (directoryName: string) => {
      const newPath = path.join(currentBrowsingPath, directoryName);
      handlePathUpdateInternal(newPath);
    },
    [currentBrowsingPath, handlePathUpdateInternal],
  );

  const canGoUp = useMemo(() => {
    const normalizedPath = currentBrowsingPath.replace(/\\/g, '/');
    // Ensure projectRoot is a string before calling replace
    const normalizedProjectRoot = (projectRoot ?? '').replace(/\\/g, '/');
    const rootPatterns = ['/', /^[a-zA-Z]:(\/|\\)$/];

    const isCurrentPathRoot = rootPatterns.some((pattern) =>
      typeof pattern === 'string' ? normalizedPath === pattern : pattern.test(normalizedPath),
    );

    if (isCurrentPathRoot) return false; // Cannot go up from a root

    if (allowExternalPaths) return true; // Can always go up unless it's a root itself

    // If not allowing external paths, can only go up within projectRoot
    return normalizedPath.startsWith(normalizedProjectRoot);
  }, [currentBrowsingPath, allowExternalPaths, projectRoot]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 2,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <MuiTextField
          fullWidth
          variant="outlined"
          placeholder="Enter path..."
          value={tempPathInput}
          onChange={handleTempPathInputChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FolderOpenIcon color="action" />
              </InputAdornment>
            ),
            sx: {
              color: theme.palette.text.primary,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
          size="small"
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleGoToPath();
          }}
        />
        <Tooltip title="Go to path">
          <Button
            variant="contained"
            onClick={handleGoToPath}
            disabled={!tempPathInput.trim() || loadingContents}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Go
          </Button>
        </Tooltip>
        <Tooltip title="Go up one level">
          <span>
            <IconButton
              onClick={handleGoUp}
              disabled={!canGoUp || loadingContents}
              size="small"
              sx={{ color: theme.palette.text.secondary }}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Current:{' '}
        <Typography component="span" fontWeight="bold">
          {currentBrowsingPath}
        </Typography>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {fetchContentsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {fetchContentsError}
        </Alert>
      )}

      {loadingContents ? (
        <Box className="flex justify-center items-center flex-grow">
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading directory contents...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {directoryContents && directoryContents.directories.length > 0 ? (
            <List dense>
              {directoryContents.directories.map((dir) => (
                <ListItemButton
                  key={dir}
                  onClick={() => handleSelectDirectory(dir)}
                  sx={{ py: 0.5, px: 1, '&:hover': { bgcolor: theme.palette.action.hover } }}
                >
                  <FolderIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                  <ListItemText primary={dir} />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No subdirectories found in this path.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DirectoryPickerDrawer;
