import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TextField,
  List,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Chip,
  InputAdornment,
  useTheme,
  Tooltip,
  Button,
  CircularProgress,
  Alert,
  ListItemButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FolderOpenIcon from '@mui/icons-material/FolderOpen'; // Icon for directory
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; // Icon for file
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'; // Icon for "Go Up"
import CheckIcon from '@mui/icons-material/Check'; // New icon for selected files

import * as path from 'path-browserify'; // For path manipulation
import { plannerService } from '../api/plannerService'; // For fetching directory contents
import type { IDirectoryListing, IFileSystemEntry } from '../types'; // For file system types

/**
 * List of file and folder names to exclude from browsing and scanning.
 */
const EXCLUDED_NAMES = ['node_modules', 'dist', 'logs', '.git', '.github', '.vscode', '.idea'];

/**
 * Truncates a file path for display purposes.
 * @param filePath The full file path.
 * @param maxLength The maximum length before truncation (default: 30).
 * @returns The truncated path with '...' if necessary.
 */
const truncate = (filePath: string, maxLength = 30): string => {
  if (!filePath) return '';
  const parts = filePath.split(/[\\/]/); // Split by / or \\ // Double quotes escaped
  const fileName = parts[parts.length - 1];

  if (fileName.length > maxLength - 3) {
    return `...${fileName.substring(fileName.length - (maxLength - 3))}`;
  }
} else if (filePath.length > maxLength) {
    const availableLength = maxLength - fileName.length - 3;
    if (availableLength > 0) {
      return `${filePath.substring(0, availableLength)}...${fileName}`;
    }
    return `...${fileName}`;
  }
  return filePath;
};

interface ScanPathsDrawerProps {
  initialBrowsingPath: string; // New prop: The starting path for the file browser within the drawer
  currentScanPaths: string[]; // Initial paths from parent (store)
  suggestedPaths?: string[]; // Renamed from availablePaths for clarity
  allowExternalPaths?: boolean;
  onLocalPathsChange: (paths: string[]) => void; // Callback to notify parent of internal changes
}

const ScanPathsDrawer: React.FC<ScanPathsDrawerProps> = ({
  initialBrowsingPath,
  currentScanPaths,
  suggestedPaths = [], // Renamed prop
  allowExternalPaths = false,
  onLocalPathsChange,
}) => {
  const theme = useTheme();
  // Internal state for paths currently selected for scanning
  const [localSelectedPaths, setLocalSelectedPaths] = useState<string[]>([]);
  // Internal state for the path being browsed within the drawer's file explorer
  const [currentBrowsingPath, setCurrentBrowsingPath] = useState<string>(initialBrowsingPath);
  // Internal state for the text field where users can type a path for browsing
  const [tempPathInput, setTempPathInput] = useState<string>(initialBrowsingPath);
  // State for fetched directory contents
  const [fetchedContents, setFetchedContents] = useState<IDirectoryListing | null>(null);
  const [loadingContents, setLoadingContents] = useState(false);
  const [fetchContentsError, setFetchContentsError] = useState<string | null>(null);
  const [manualPathToAdd, setManualPathToAdd] = useState(''); // For the "Add custom path" input
  const [searchTerm, setSearchTerm] = useState(''); // New: for searching suggested paths

  // Sync internal localSelectedPaths with prop `currentScanPaths`
  useEffect(() => {
    setLocalSelectedPaths(currentScanPaths);
  }, [currentScanPaths]);

  // Sync internal browsing path with prop `initialBrowsingPath` and `tempPathInput`
  useEffect(() => {
    // Only update if the initialBrowsingPath has actually changed
    if (initialBrowsingPath !== currentBrowsingPath) {
      const normalizedPath = path.normalize(initialBrowsingPath.replace(/\\/g, '/'));
      setCurrentBrowsingPath(normalizedPath);
      setTempPathInput(normalizedPath);
    }
  }, [initialBrowsingPath, currentBrowsingPath]);

  // Effect to fetch directory contents whenever currentBrowsingPath changes
  useEffect(() => {
    const fetchContents = async () => {
      if (!currentBrowsingPath) return; // Don't fetch if path is empty
      setLoadingContents(true);
      setFetchContentsError(null);
      try {
        const contents = await plannerService.fetchDirectoryContents(currentBrowsingPath);

        // Filter out excluded files and folders
        const filteredContents = contents.filter(
          (entry) => !EXCLUDED_NAMES.includes(entry.name),
        );

        // Sort directories first, then files, both alphabetically
        const sortedContents = filteredContents.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
        setFetchedContents(sortedContents);
      } catch (err: unknown) {
        setFetchContentsError(
          (err as Error).message || `Failed to load contents for ${currentBrowsingPath}`,
        );
        setFetchedContents(null);
      } finally {
        setLoadingContents(false);
      }
    };
    fetchContents();
  }, [currentBrowsingPath]);

  // Filter suggested paths based on search term
  const filteredSuggestedPaths = useMemo(() => {
    if (!searchTerm) return suggestedPaths;
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return suggestedPaths.filter((p) => p.toLowerCase().includes(lowercasedSearchTerm));
  }, [suggestedPaths, searchTerm]);

  const addPath = useCallback(
    (pathToAdd: string) => {
      const normalizedPathToAdd = path.normalize(pathToAdd.replace(/\\/g, '/'));
      if (localSelectedPaths.includes(normalizedPathToAdd)) return; // Avoid duplicates
      setLocalSelectedPaths((prev) => {
        const newPaths = Array.from(new Set([...prev, normalizedPathToAdd])).sort();
        onLocalPathsChange(newPaths); // Notify parent
        return newPaths;
      });
    },
    [localSelectedPaths, onLocalPathsChange],
  );

  const handleRemovePath = useCallback(
    (pathToRemove: string) => {
      setLocalSelectedPaths((prev) => {
        const newPaths = prev.filter((p) => p !== pathToRemove);
        onLocalPathsChange(newPaths);
        return newPaths;
      });
    },
    [onLocalPathsChange],
  );

  const handleGoUp = useCallback(() => {
    const normalizedCurrentPath = currentBrowsingPath.replace(/\\/g, '/');
    const normalizedInitialPath = initialBrowsingPath.replace(/\\/g, '/');
    const parentPath = path.dirname(normalizedCurrentPath);
    const normalizedParentPath = parentPath.replace(/\\/g, '/');

    // Root check for various OS
    const isCurrentPathRoot =
      normalizedCurrentPath === '/' || /^[a-zA-Z]:[\\/]{0,1}$/.test(normalizedCurrentPath);
    if (isCurrentPathRoot) return; // Cannot go up from a root directory

    // If external paths are not allowed, ensure we don't go above the initialBrowsingPath
    if (!allowExternalPaths && !normalizedParentPath.startsWith(normalizedInitialPath)) {
      // If parent is not within initial path, but current is (meaning current is initial path or deeper),
      // and parent is not the initial path itself (to avoid infinite loop if initial is a root),
      // then navigate to initial path.
      if (
        normalizedCurrentPath.startsWith(normalizedInitialPath) &&
        normalizedParentPath !== normalizedInitialPath
      ) {
        setCurrentBrowsingPath(normalizedInitialPath);
        setTempPathInput(normalizedInitialPath);
      } else {
        // Otherwise, simply stop. Don't go above the allowed boundary.
        return;
      }
    } else {
      setCurrentBrowsingPath(normalizedParentPath);
      setTempPathInput(normalizedParentPath);
    }
  }, [currentBrowsingPath, initialBrowsingPath, allowExternalPaths]);

  const handleGoToPath = useCallback(() => {
    const trimmedPath = tempPathInput.trim();
    if (!trimmedPath) {
      setFetchContentsError('Path cannot be empty.');
      return;
    }

    const normalizedPath = path.normalize(trimmedPath.replace(/\\/g, '/'));
    const normalizedInitialPath = initialBrowsingPath.replace(/\\/g, '/');

    // If external paths are not allowed, ensure the path starts with the initial browsing path
    if (!allowExternalPaths && !normalizedPath.startsWith(normalizedInitialPath)) {
      setFetchContentsError(
        'Cannot browse outside the defined project root without allowing external paths.',
      );
      return;
    }

    setCurrentBrowsingPath(normalizedPath);
    setFetchContentsError(null); // Clear previous errors
  }, [tempPathInput, initialBrowsingPath, allowExternalPaths]);

  const handleTempPathInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempPathInput(e.target.value);
    setFetchContentsError(null); // Clear errors as user types
  };

  const handleSelectEntry = useCallback(
    (entry: IFileSystemEntry) => {
      if (entry.isDirectory) {
        setCurrentBrowsingPath(entry.path);
        setTempPathInput(entry.path);
      } else {
        // It's a file, add it to the selected scan paths
        addPath(entry.path);
      }
    },
    [addPath],
  );

  const handleAddManualPathInput = useCallback(() => {
    const trimmed = manualPathToAdd.trim();
    if (trimmed) {
      addPath(trimmed);
      setManualPathToAdd('');
    }
  }, [manualPathToAdd, addPath]);

  // Determine if 'Go Up' button should be disabled
  const canGoUp = useMemo(() => {
    const normalizedCurrentPath = currentBrowsingPath.replace(/\\/g, '/');
    const normalizedInitialPath = initialBrowsingPath.replace(/\\/g, '/');

    // Root path patterns for various OS
    const isCurrentPathRoot =
      normalizedCurrentPath === '/' || /^[a-zA-Z]:[\\/]{0,1}$/.test(normalizedCurrentPath);
    if (isCurrentPathRoot) return false;

    // If external paths are not allowed, ensure we are not at or below the initial path
    if (!allowExternalPaths) {
      return normalizedCurrentPath !== normalizedInitialPath; // Only allow going up if not at the initial root itself
    }

    return true; // Can always go up if external paths are allowed and not at a root
  }, [currentBrowsingPath, initialBrowsingPath, allowExternalPaths]);

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
      {/* Current Path and Navigation */}
      <Box className="mb-4">
        <Typography variant="body2" color="text.secondary" className="mb-2">
          <span className="font-semibold text-text-primary">Current Browsing:</span>{' '}
          {currentBrowsingPath}
        </Typography>
        <Box className="flex items-center gap-2">
          <TextField
            fullWidth
            size="small"
            placeholder="Enter path to browse..."
            value={tempPathInput}
            onChange={handleTempPathInputChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FolderOpenIcon color="action" />
                </InputAdornment>
              ),
            }}
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
              className="whitespace-nowrap"
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
                color="inherit" // Inherit color for icon, will be secondary from theme.
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {fetchContentsError && (
        <Alert severity="error" className="mb-4">
          {fetchContentsError}
        </Alert>
      )}

      {/* Directory Contents */}
      <Box className="flex-grow overflow-y-auto border border-divider rounded-md p-2 mb-4">
        {loadingContents ? (
          <Box className="flex justify-center items-center h-full">
            <CircularProgress size={30} />
            <Typography variant="body2" className="ml-2">
              Loading contents...
            </Typography>
          </Box>
        ) : fetchedContents && fetchedContents.length > 0 ? (
          <List dense disablePadding>
            {fetchedContents.map((entry) => (
              <ListItemButton
                key={entry.path}
                onClick={() => handleSelectEntry(entry)}
                className="py-1 px-2 hover:bg-action-hover"
                sx={{ borderRadius: 1 }}
              >
                {entry.isDirectory ? (
                  <FolderOpenIcon sx={{ mr: 1, color: 'info.main' }} />
                ) : (
                  <InsertDriveFileIcon sx={{ mr: 1, color: 'success.main' }} />
                )}
                <ListItemText
                  primary={entry.name}
                  primaryTypographyProps={{
                    sx: localSelectedPaths.includes(entry.path)
                      ? { fontWeight: 'bold', color: 'primary.main' } // Highlight selected files
                      : {},
                  }}
                />
                {!entry.isDirectory && localSelectedPaths.includes(entry.path) && (
                  <Tooltip title="Already selected">
                    <CheckIcon color="success" fontSize="small" className="ml-2" />
                  </Tooltip>
                )}
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" className="text-center pt-4 w-full">
            No items found in this directory.
          </Typography>
        )}
      </Box>

      {/* Manual path input */}
      <Typography variant="subtitle2" className="font-semibold mb-1">
        Add Custom Path:
      </Typography>
      <Box className="flex gap-2 mb-4">
        <TextField
          fullWidth
          size="small"
          placeholder="Enter a path to add (e.g., 'src/my-file.ts' or 'src/components')"
          value={manualPathToAdd}
          onChange={(e) => setManualPathToAdd(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddManualPathInput()}
          sx={{
            bgcolor: 'background.default',
          }}
        />
        <Tooltip title="Add Path">
          <span>
            <IconButton
              onClick={handleAddManualPathInput}
              disabled={!manualPathToAdd.trim()}
              color="primary"
            >
              <AddIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Suggested Paths */}
      {suggestedPaths.length > 0 && (
        <Box className="mb-4">
          <Typography variant="subtitle2" className="font-semibold mb-1">
            Suggested Paths:
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search suggested paths..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            className="mb-2"
          />
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              p: 1,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              maxHeight: '100px',
              overflowY: 'auto',
              bgcolor: 'background.default',
            }}
          >
            {filteredSuggestedPaths.length > 0 ? (
              filteredSuggestedPaths.map((pathItem) => (
                <Chip
                  key={`suggested-${pathItem}`}
                  label={truncate(pathItem)}
                  onClick={() => addPath(pathItem)}
                  color={localSelectedPaths.includes(pathItem) ? 'secondary' : 'default'}
                  variant={localSelectedPaths.includes(pathItem) ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" className="text-center w-full">
                No matching suggestions.
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Selected Paths */}
      <Typography variant="subtitle2" className="font-semibold mb-1">
        Currently Selected for Scan:
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          maxHeight: '150px',
          overflowY: 'auto',
          p: 1,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          flexShrink: 0,
          bgcolor: 'background.default',
        }}
      >
        {localSelectedPaths.length === 0 ? (
          <Typography variant="body2" color="text.secondary" className="text-center w-full">
            No paths selected. Add from suggestions or by browsing.
          </Typography>
        ) : (
          localSelectedPaths.map((pathItem) => (
            <Tooltip title={pathItem} key={pathItem}>
              <Chip
                label={truncate(pathItem)}
                onDelete={() => handleRemovePath(pathItem)}
                size="small"
                color="primary"
                deleteIcon={<CloseIcon fontSize="small" />}
              />
            </Tooltip>
          ))
        )}
      </Box>
    </Box>
  );
};

export default ScanPathsDrawer;
