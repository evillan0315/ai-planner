import React, { useCallback, useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box, // Added
  Typography,
  MenuItem,
  ListItemIcon,
  ListItemText, // Added
  Divider,
  useTheme,
  List, // Added
  Paper
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import SendIcon from '@mui/icons-material/Send';
import CodeIcon from '@mui/icons-material/Code';
import AddIcon from '@mui/icons-material/Add'; // NEW
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'; // NEW
import FolderSharedIcon from '@mui/icons-material/FolderShared'; // NEW - Using this icon for "Add to Scan Path"
import InfoIcon from '@mui/icons-material/Info'; // NEW
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // NEW
import * as path from 'path-browserify';
import { showSnackbar } from '@/stores/snackbarStore';

import { useStore } from '@nanostores/react';


import type { IFileSystemEntry } from './types';
import { projectRootDirectoryStore, setProjectRoot, closeFileTreeContextMenu, fileTreeContextMenuStore, triggerFileExplorerRefresh } from '@/components/file-explorer/stores/fileTreeStore';
import { openFileInEditor } from '@/components/editor/stores/editorStore';
import { dialogService } from '@/services/dialogService'; 
// NEW IMPORT
import { setScanPathsInput, plannerStore } from '@/components/planner/stores/plannerStore';
import { fileExplorerService } from './api/fileExplorerService';
import { VIDEO_MIME_TYPES, AUDIO_MIME_TYPES } from '@/constants'; // NEW


/**
 * Helper function to handle clipboard copy action.
 */
const copyToClipboard = async (text: string) => {
  try {
    // navigator.clipboard is available in modern browsers, but needs a secure context (HTTPS/localhost)
    await navigator.clipboard.writeText(text);
    console.log(`Copied path(s) to clipboard: ${text}`);
    // In a full application, you'd show a success toast here.
  } catch (err) {
    console.error('Failed to copy text:', err);
    // Show error toast
  }
};

/**
 * Helper function to format file size into a human-readable string.
 */
const formatSize = (bytes?: number): string => {
    if (bytes === undefined || bytes === null || bytes < 0) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getTargetDirectory = (entry: IFileSystemEntry | null): string | null => {
    if (!entry) return null;
    return entry.isDirectory ? entry.path : path.dirname(entry.path);
};

/**
 * Context menu component displayed on right-click in the file explorer.
 */
const FileExplorerContextMenu: React.FC = () => {
  // Use entries (all selected) and anchorPath (the one right-clicked)
  const { isOpen, position, entries, anchorPath } = useStore(fileTreeContextMenuStore);
  const menuRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  // Determine the entry that was specifically clicked (the context anchor)
  const clickedEntry = useMemo(() => entries.find(e => e.path === anchorPath) || entries[0] || null, [entries, anchorPath]);
  const isMultiSelection = entries.length > 1;

  // --- NEW LOGIC: Type detection for conditional rendering ---
  const isMedia = useMemo(() => {
    if (!clickedEntry || clickedEntry.isDirectory) return false;
    const mime = clickedEntry.mimeType;
    return !!mime && (VIDEO_MIME_TYPES.has(mime) || AUDIO_MIME_TYPES.has(mime));
  }, [clickedEntry]);

  const itemToView = isMedia ? 'Play Media' : 'View Content';
  const viewIcon = isMedia ? <PlayArrowIcon fontSize="small" /> : <CodeIcon fontSize="small" />;

  // Extract positional data safely
  const x = position?.x ?? 0;
  const y = position?.y ?? 0;
  
  const [adjustedTop, setAdjustedTop] = useState(y);
  const [adjustedLeft, setAdjustedLeft] = useState(x);

  // --- Positioning Logic ---
  useLayoutEffect(() => {
    // We only perform adjustment if the menu is supposed to be open (or was just closed)
    if (isOpen && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let newTop = y;
      let newLeft = x;

      // Adjust if menu goes off screen vertically
      if (y + menuRect.height > viewportHeight) {
        newTop = viewportHeight - menuRect.height - 10; // 10px buffer
      }
      // Adjust if menu goes off screen horizontally
      if (x + menuRect.width > viewportWidth) {
        newLeft = viewportWidth - menuRect.width - 10; // 10px buffer
      }

      newTop = Math.max(0, newTop);
      newLeft = Math.max(0, newLeft);

      // Only update state if position changes
      if (newTop !== adjustedTop || newLeft !== adjustedLeft) {
        setAdjustedTop(newTop);
        setAdjustedLeft(newLeft);
      }
    } else if (!isOpen) {
      // Reset positions when not visible to avoid stale values influencing next open
      // Use the last stored coordinates as a starting point for the animation
      setAdjustedTop(y);
      setAdjustedLeft(x);
    }
  }, [isOpen, x, y, adjustedTop, adjustedLeft]);


  // --- Close Handler and Side Effects ---

  // Close handler used after any action
  const handleClose = useCallback(() => {
    closeFileTreeContextMenu();
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click occurred outside the menu element
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, handleClose]);


  // 1. Copy Path (Multi-select: join paths)
  const handleCopyPath = useCallback(() => {
    if (!clickedEntry) return;
    const pathsToCopy = isMultiSelection ? entries.map(e => e.path) : [clickedEntry.path];
    copyToClipboard(pathsToCopy.join('\n'));
    handleClose();
  }, [entries, isMultiSelection, clickedEntry, handleClose]);

  // 2. Set Project Root (Only allowed if ONE entry is selected and it is a directory)
  const handleSetProjectRoot = useCallback(async () => {
      if (!clickedEntry || isMultiSelection || !clickedEntry.isDirectory) return;

      const rootPath = clickedEntry.path; 
      
      // Use the imported setter from the planner store
      setProjectRoot(rootPath); 
      // projectRootDirectoryStore.set(rootPath); // setProjectRoot already does this

      await dialogService.alert({
          title: 'Project Root Updated',
          content: `Project Root has been successfully set to: ${rootPath}`,
      });

      handleClose();
  }, [isMultiSelection, clickedEntry, handleClose]);

  // 3. View Content / Play Media (Only allowed if ONE entry is selected and it is a file)
  const handleViewContent = useCallback(() => {
    if (!clickedEntry || isMultiSelection || clickedEntry.isDirectory) return;
    openFileInEditor(clickedEntry); // This delegates media handling to floating window
    handleClose();
  }, [isMultiSelection, clickedEntry, handleClose]);

  // 4. Delete (Applies to all selected entries)
  const handleDelete = useCallback(async () => {
    handleClose();
    if (entries.length === 0) return;

    const pathsToDelete = entries.map(e => e.path);
    const confirmationMsg = isMultiSelection 
        ? `Are you sure you want to delete ${entries.length} items? This action cannot be undone.`
        : `Are you sure you want to delete '${clickedEntry!.name}'? This action cannot be undone.`;

    const confirmed = await dialogService.confirm({
        title: 'Confirm Deletion',
        content: confirmationMsg,
        maxWidth: 'xs'
    });

    if (!confirmed) {
        return;
    }
    
    // Execute deletion loop
    try {
        // Use Promise.all to handle multiple deletions concurrently
        await Promise.all(pathsToDelete.map(path => fileExplorerService.deleteFileOrFolder(path)));
        console.log(`Successfully deleted ${pathsToDelete.length} items.`);
        triggerFileExplorerRefresh();
    } catch (e: unknown) {
        const message = (e as Error).message || 'Failed to delete file(s)/folder(s).';
        await dialogService.alert({
            title: 'Deletion Failed',
            content: `Deletion failed: ${message}`,
            maxWidth: 'sm'
        });
    }
  }, [entries, isMultiSelection, clickedEntry, handleClose]);

  // 5. Rename (Only allowed if ONE entry is selected)
  const handleRename = useCallback(async () => {
    if (!clickedEntry || isMultiSelection) return;
    handleClose();
    const currentName = path.basename(clickedEntry.path);
    
    const newName = await dialogService.prompt({
        title: `Rename: ${clickedEntry.name}`,
        content: 'Enter the new name for this file or folder:',
        initialValue: currentName,
    });
    
    if (!newName || newName === currentName || !newName.trim()) return; // Canceled or no change

    try {
        const dir = path.dirname(clickedEntry.path);
        const newPath = path.join(dir, newName.trim());
        
        await fileExplorerService.renameFileOrFolder(clickedEntry.path, newPath);
        console.log(`Successfully renamed ${clickedEntry.path} to ${newPath}`);
        triggerFileExplorerRefresh();
    } catch (e: unknown) {
        const message = (e as Error).message || 'Failed to rename file/folder.';
        await dialogService.alert({
            title: 'Rename Failed',
            content: `Rename failed: ${message}`,
            maxWidth: 'sm'
        });
    }
  }, [isMultiSelection, clickedEntry, handleClose]);

  // 6. Copy (Only allowed if ONE entry is selected)
  const handleCopy = useCallback(async () => {
    if (!clickedEntry || isMultiSelection) return;
    handleClose();
    const extension = clickedEntry.isDirectory ? '' : path.parse(clickedEntry.name).ext;
    const baseName = clickedEntry.isDirectory ? clickedEntry.name : path.parse(clickedEntry.name).name;

    // Suggest a default copy path next to the original
    const defaultCopyPath = path.join(path.dirname(clickedEntry.path), `${baseName}-copy${extension}`);

    const destinationPath = await dialogService.prompt({
        title: `Copy: ${clickedEntry.name}`,
        content: 'Enter the full destination path (must be a full, new path):',
        initialValue: defaultCopyPath,
        maxWidth: 'md'
    });

    if (!destinationPath || !destinationPath.trim()) return;
    
    try {
        await fileExplorerService.copyFileOrFolder(clickedEntry.path, destinationPath.trim());
        console.log(`Successfully copied ${clickedEntry.path} to ${destinationPath}`);
        triggerFileExplorerRefresh();
    } catch (e: unknown) {
        const message = (e as Error).message || 'Failed to copy file/folder.';
        await dialogService.alert({
            title: 'Copy Failed',
            content: `Copy failed: ${message}`,
            maxWidth: 'sm'
        });
    }
  }, [isMultiSelection, clickedEntry, handleClose]);
  
  // 7. Create File/Folder common logic (NEW)
  const handleCreateItem = useCallback(async (isDirectory: boolean) => {
    handleClose();
    if (!clickedEntry) return;

    const targetDir = getTargetDirectory(clickedEntry);
    if (!targetDir) {
        await dialogService.alert({
            title: 'Creation Failed',
            content: 'Cannot determine target directory for creation.',
            maxWidth: 'sm'
        });
        return;
    }

    const itemType = isDirectory ? 'Folder' : 'File';
    const extension = isDirectory ? '' : '.txt';
    const defaultName = `new-${itemType.toLowerCase()}${extension}`;

    const itemName = await dialogService.prompt({
        title: `Create New ${itemType} in: ${path.basename(targetDir)}`,
        content: `Enter the name for the new ${itemType}:`,
        initialValue: defaultName,
        maxWidth: 'xs'
    });

    if (!itemName || !itemName.trim()) return;

    const finalPath = path.join(targetDir, itemName.trim());

    try {
        await fileExplorerService.createFileOrFolder({
            filePath: finalPath,
            isDirectory: isDirectory,
            content: isDirectory ? undefined : '', // Empty content for new files
        });
        console.log(`Successfully created ${itemType}: ${finalPath}`);
        // Optionally, if the created item is in an expanded directory, the manual refresh should pick it up.
        triggerFileExplorerRefresh();
    } catch (e: unknown) {
        const message = (e as Error).message || `Failed to create ${itemType}.`;
        await dialogService.alert({
            title: `${itemType} Creation Failed`,
            content: message,
            maxWidth: 'sm'
        });
    }
}, [clickedEntry, handleClose]);

const handleCreateFile = useCallback(() => handleCreateItem(false), [handleCreateItem]);
const handleCreateFolder = useCallback(() => handleCreateItem(true), [handleCreateItem]);

// 8. Add to Scan Path logic (NEW)
const handleAddToScanPath = useCallback(async () => {
    handleClose();
    if (entries.length === 0) return;

    const currentPlannerState = plannerStore.get();
    const currentScanPathsInput = currentPlannerState.scanPathsInput;
    
    // Convert current comma-separated string to Set of paths
    const existingPaths = new Set(
        currentScanPathsInput.split(',').map(p => p.trim()).filter(Boolean)
    );
    
    let pathsAddedCount = 0;
    
    entries.forEach(entry => {
        // Use browser path separator consistently
        const normalizedPath = entry.path.replace(/\\/g, '/'); 
        if (!existingPaths.has(normalizedPath)) {
            existingPaths.add(normalizedPath);
            pathsAddedCount++;
        }
    });

    if (pathsAddedCount === 0) {
        showSnackbar('All selected paths were already present in the AI scan configuration.', 'info');
        return;
    }

    // Convert Set back to comma-separated string and update store
    const newScanPathsInput = Array.from(existingPaths).join(', ');
    setScanPathsInput(newScanPathsInput);

    showSnackbar(
        pathsAddedCount === 1 
            ? `1 path added to AI scan configuration.`
            : `${pathsAddedCount} paths added to AI scan configuration.`, 
        'success'
    );
    
}, [entries, handleClose]);

// 9. Info/Metadata (Applies to the clicked entry) - NEW Handler
const handleInfo = useCallback(async () => {
    handleClose();
    if (!clickedEntry || entries.length > 1) return;

    const metadataContent = (
        <Box>
            <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>File Information</Typography>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', bgcolor: theme.palette.action.hover, p: 1, borderRadius: 1 }}>
                {`Path: ${clickedEntry.path}\n`}
                {`Type: ${clickedEntry.isDirectory ? 'Directory' : 'File'}\n`}
                {clickedEntry.size !== undefined ? `Size: ${formatSize(clickedEntry.size)}\n` : ''}
                {clickedEntry.mimeType ? `MIME Type: ${clickedEntry.mimeType}\n` : ''}
                {clickedEntry.createdAt ? `Created: ${new Date(clickedEntry.createdAt).toLocaleString()}\n` : ''}
                {clickedEntry.updatedAt ? `Updated: ${new Date(clickedEntry.updatedAt).toLocaleString()}` : ''}
            </Typography>
        </Box>
    );
    
    await dialogService.alert({
        title: `Info: ${clickedEntry.name}`,
        content: metadataContent,
        maxWidth: 'sm'
    });


}, [clickedEntry, handleClose, entries.length, theme]);


  if (!isOpen || !clickedEntry) return null;

  const IconComponent = clickedEntry.isDirectory ? FolderOpenIcon : InsertDriveFileIcon;


  // --- Render with Framer Motion ---
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed z-[1000] shadow-lg border rounded-md text-sm"
          style={{
            top: adjustedTop-2,
            left: adjustedLeft,
            minWidth: '240px',
            maxWidth: '280px',
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on menu itself
        >
        <Paper
            elevation={1}
            sx={{
                    bgcolor: theme.palette.background.default,
                }}
            >
            <Box
                sx={{
                    p: 1.5,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.background.paper,
                }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{ color: theme.palette.text.secondary, mb: 0.5 }}
                >
                    {isMultiSelection ? 'Multiple Selection' : (clickedEntry.isDirectory ? 'Folder' : 'File')}:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ListItemIcon sx={{ minWidth: 24, color: theme.palette.text.primary }}>
                        <IconComponent fontSize="small" />
                    </ListItemIcon>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 'bold',
                            color: theme.palette.text.primary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {isMultiSelection ? `${entries.length} items selected` : clickedEntry.name}
                    </Typography>
                </Box>
            </Box>

            {/* Menu Items */}
            <List component="nav" disablePadding dense>
                
                <MenuItem onClick={handleSetProjectRoot} disabled={isMultiSelection || !clickedEntry.isDirectory}>
                    <ListItemIcon>
                        <SendIcon fontSize="medium" />
                    </ListItemIcon>
                    <ListItemText primary={
                            <Typography variant="body2" color='info'  sx={{ p: 1 }}>
                                Set as Project Root {isMultiSelection && `(${entries.length} items)`}
                            </Typography>
                        } />
                </MenuItem>
                
                <Divider sx={{ borderColor: theme.palette.divider }} />
                
                <MenuItem onClick={handleCreateFile} disabled={isMultiSelection}>
                    <ListItemIcon>
                        <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Create File" />
                </MenuItem>
                
                <MenuItem onClick={handleCreateFolder} disabled={isMultiSelection}>
                    <ListItemIcon>
                        <CreateNewFolderIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Create Folder" />
                </MenuItem>
                
                <Divider sx={{ borderColor: theme.palette.divider }} />

                {!clickedEntry.isDirectory && !isMultiSelection && (
                    <MenuItem onClick={handleViewContent}>
                        <ListItemIcon>
                            {viewIcon}
                        </ListItemIcon>
                        <ListItemText primary={itemToView} />
                    </MenuItem>
                )}
                <MenuItem onClick={handleRename} disabled={isMultiSelection}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Rename" />
                </MenuItem>
                
                <MenuItem onClick={handleCopy} disabled={isMultiSelection}>
                    <ListItemIcon>
                        <ContentCopyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Copy" />
                </MenuItem>
                
                <Divider sx={{ borderColor: theme.palette.divider }} />
                
                {/* AI Planner Actions */}
                
                <MenuItem onClick={handleAddToScanPath} disabled={entries.length === 0}>
                    <ListItemIcon>
                        <FolderSharedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={`Add to Scan Path${isMultiSelection ? ` (${entries.length})` : ''}`} />
                </MenuItem>
                
                
                <MenuItem onClick={handleCopyPath}>
                    <ListItemIcon>
                        <DriveFileMoveIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={`Copy Full Path${isMultiSelection ? 's' : ''}`} />
                </MenuItem>
                
                <Divider sx={{ borderColor: theme.palette.divider }} />
                
                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color='error' />
                    </ListItemIcon>
                    <ListItemText 
                        primary={
                            <Typography variant="body2" color='error'  sx={{ p: 1 }}>
                                Delete {isMultiSelection && `(${entries.length} items)`}
                            </Typography>
                        } 
                    />
                </MenuItem>
                
                {/* Info Action (New) */}
                <Divider sx={{ borderColor: theme.palette.divider }} />
                
                <MenuItem onClick={handleInfo} disabled={entries.length > 1}>
                    <ListItemIcon>
                        <InfoIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Info" />
                </MenuItem>


            </List>
            </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FileExplorerContextMenu;
