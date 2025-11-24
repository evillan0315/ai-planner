import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert, 
  Chip,
  Tooltip,
  useTheme,
  Stack,
  TextField,
} from '@mui/material'; 
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import FileExplorer from '@/components/file-explorer/FileExplorer';
import { useStore } from '@nanostores/react';
import { projectRootDirectoryStore, setProjectRoot } from '@/components/file-explorer/stores/fileTreeStore';
import GlobalActionButton, { GlobalAction } from '@/components/ui/GlobalActionButton';


interface FileExplorerPlannerDrawerContentProps {
  /** 'root' for setting project root, 'scan' for managing scan paths. */
  mode: 'root' | 'scan';
  /** The current path being edited/viewed in the parent state (Project Root string). */
  currentPath: string;
  /** The current scan paths list being edited in the parent state (Scan Paths string[]). Only used if mode='scan'. */
  currentScanPaths: string[]; 
  /** Callback to update the parent's temporary path state (used for root or browsing start). */
  onPathChange: (path: string) => void;
  /** Callback to update the parent's temporary scan paths state. Only used if mode='scan'. */
  onScanPathsChange: (paths: string[]) => void;
}

// Truncates a file path for display purposes.
const truncate = (filePath: string): string => {
  if (!filePath) return '';
  // Increased max length slightly for better context in drawer
  if (filePath.length > 60) {
    const parts = filePath.split(/[/]/);
    const fileName = parts[parts.length - 1];
    const parent = parts.slice(0, -1).pop() || '';
    if (parent) return `.../${parent}/${fileName}`;
    return `.../${fileName}`;
  }
  return filePath;
};

const FileExplorerPlannerDrawerContent: React.FC<FileExplorerPlannerDrawerContentProps> = ({
  mode,
  currentPath,
  currentScanPaths,
  onPathChange,
  onScanPathsChange,
}) => {
  const theme = useTheme();
  const globalProjectRoot = useStore(projectRootDirectoryStore);
  
  // Local state for manual path input in 'scan' mode
  const [manualPathInput, setManualPathInput] = useState('');

  // --- Path Selection Handler (Fired when FileExplorerControls' "Use Path" button is clicked) ---

  const handlePathSelectedForUse = useCallback(
    (selectedPath: string) => {
      const normalizedPath = selectedPath.replace(/\\/g, '/');
      
      if (mode === 'root') {
        // Update the parent's path state (which also feeds back into FileExplorer's current view)
        onPathChange(normalizedPath);
        
        // FIX: Immediately set the project root globally in the fileTreeStore
        setProjectRoot(normalizedPath);
        
      } else if (mode === 'scan') {
        onScanPathsChange((prevPaths) => {
          const isAdded = prevPaths.includes(normalizedPath);
          const newPaths = isAdded
            ? prevPaths.filter((p) => p !== normalizedPath)
            : Array.from(new Set([...prevPaths, normalizedPath])).sort();
          return newPaths;
        });
      }
    },
    [mode, onPathChange, onScanPathsChange],
  );

  const handleAddManualPath = useCallback(() => {
    const trimmed = manualPathInput.trim().replace(/\\/g, '/');
    if (trimmed && mode === 'scan') {
      onScanPathsChange((prevPaths) => {
        if (prevPaths.includes(trimmed)) return prevPaths;
        const newPaths = Array.from(new Set([...prevPaths, trimmed])).sort();
        return newPaths;
      });
      setManualPathInput('');
    }
  }, [manualPathInput, mode, onScanPathsChange]);
  
  const handleRemoveScanPath = useCallback((pathToRemove: string) => {
    onScanPathsChange((prevPaths) => prevPaths.filter((p) => p !== pathToRemove));
  }, [onScanPathsChange]);
  
  // Define the action for adding a manual path
  const addManualPathActions: GlobalAction[] = useMemo(() => ([
    {
      label: 'Add Path',
      action: handleAddManualPath,
      icon: <AddIcon fontSize="small" />,
      color: 'primary',
      variant: 'contained', // Ensure it stands out
      disabled: !manualPathInput.trim(),
      iconOnly: false, // Ensure button displays text
      size: 'small',
    }
  ]), [handleAddManualPath, manualPathInput]);

  
  // Determine the current path to feed into FileExplorer
  const explorerInitialPath = useMemo(() => {
    // In root mode, we use `currentPath` (which is tempDrawerProjectRootInput in PlanGenerator).
    // In scan mode, we start browsing from the global project root (or env default).
    return mode === 'root' ? currentPath : globalProjectRoot || '/';
  }, [mode, currentPath, globalProjectRoot]);

  return (
    <Box className="h-full w-full flex flex-col">
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        
        {mode === 'root' ? (
            <Box>
                <Typography variant="subtitle2" className="font-semibold mb-1" color="primary.main">
                    Current Project Root Candidate:
                </Typography>
                 <Typography variant="body1" className="font-mono font-bold text-text-primary break-words">
                    {currentPath}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary" className="mt-1">
                    Use the explorer below to navigate. Click 'Use Path' in the address bar to select a new directory.
                </Typography>
            </Box>
        ) : (
             <Box>
                <Typography variant="subtitle2" className="font-semibold mb-1">
                    Scan Paths ({currentScanPaths.length} Selected):
                </Typography>
                <Box className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 border border-divider rounded-md bg-background-default">
                  {currentScanPaths.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Use the "Use Path" button in the explorer below to toggle file or folder inclusion.
                    </Typography>
                  ) : (
                    currentScanPaths.map((p) => (
                      <Tooltip title={p} key={p}>
                        <Chip
                          label={truncate(p)}
                          onDelete={() => handleRemoveScanPath(p)}
                          size="small"
                          color="primary"
                          deleteIcon={<CloseIcon fontSize="small" />}
                        />
                      </Tooltip>
                    ))
                  )}
                </Box>
                
                <Stack direction="row" spacing={1} alignItems="center" className="mt-2">
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add manual path/glob (e.g., src/**/*.ts, package.json)"
                      value={manualPathInput}
                      onChange={(e) => setManualPathInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddManualPath()}
                      sx={{ bgcolor: 'background.default' }}
                    />
                    <GlobalActionButton 
                        globalActions={addManualPathActions} 
                        iconOnly={false} 
                    />
                </Stack>
              </Box>
        )}
      </Box>

      <Box className="flex-grow min-h-0 p-2">
        <FileExplorer
          initialPath={explorerInitialPath}
          // The handler passed here overrides the default FileExplorerPage action.
          onPathSelectedForUse={handlePathSelectedForUse} 
        />
      </Box>
    </Box>
  );
};

export default FileExplorerPlannerDrawerContent;