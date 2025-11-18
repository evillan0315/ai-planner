

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  SxProps,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import * as path from 'path-browserify';
import { useNavigate } from 'react-router-dom';
import {
  projectRootDirectoryStore,
  setProjectRoot,
  openFileTreeContextMenu as openContextMenu,
  refreshTriggerAtom,
  fileTreeSelectionStore,
  setSelectedPath,
  clearSelections,
} from '@/components/file-explorer/stores/fileTreeStore';

import { fileExplorerService } from '@/components/file-explorer/api/fileExplorerService';
import type { IFileSystemEntry } from '@/components/file-explorer/types';
import FileExplorerControls from '@/components/file-explorer/FileExplorerControls';
import FileExplorerContextMenu from '@/components/file-explorer/FileExplorerContextMenu';
import { openFileInEditor } from '@/components/editor/stores/editorStore';
import { dialogService } from '@/services/dialogService'; // ADD IMPORT

// New Imports
import { useFileTreeState } from './hooks/useFileTreeState';
import FileTreeRenderer from './FileTreeRenderer';
import  {
  CODE_MIME_TYPES,
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  AUDIO_MIME_TYPES,
  MARKDOWN_EXTENSIONS,
  HTML_EXTENSIONS,
} from '@/constants';

interface FileExplorerProps {
  initialPath?: string;
  onPathSelectedForUse?: (selectedPath: string) => void;
}

const explorerContainerSx: SxProps = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
  backgroundColor: 'background.default',

};

const contentAreaSx: SxProps = {
  flexGrow: 1,
  overflowY: 'auto',
  p: 0,
   position: 'relative'
};

// Fixed: correctly escape backslash in regex so string is terminated properly and replacement works
const normalizeForBrowser = (p: string) => path.normalize(p.replace(/\\/g, '/'));

const FileExplorer: React.FC<FileExplorerProps> = ({ initialPath, onPathSelectedForUse }) => {
  const navigate = useNavigate(); 
  const globalProjectRoot = useStore(projectRootDirectoryStore) as string | undefined;
  const refreshTrigger = useStore(refreshTriggerAtom); // Listen for explicit refresh signals

  // Determine effective initial path (fallback to '/' if nothing available)
  const effectiveInitialPath = useMemo(() => {
    const base = initialPath ?? globalProjectRoot ?? '/';
    return normalizeForBrowser(base);
  }, [initialPath, globalProjectRoot]);

  // --- 1. Tree State & Data Logic (from hook) ---
  const {
    treeState,
    currentDirectoryContents,
    loadingRoot,
    rootError,
    currentPath,
    handleToggleExpand,
    handleRefresh,
    handleNavigate,
    handleGoUp,
  } = useFileTreeState(effectiveInitialPath, refreshTrigger);

  // --- 2. Interaction State (local to orchestrate selection/editing) ---
  const selectionState = useStore(fileTreeSelectionStore);
  const selectedPaths = selectionState?.selectedPaths || new Set<string>();
  const lastSelectedPath = selectionState?.lastSelectedPath || null;
  const [activeFile, setActiveFile] = useState<IFileSystemEntry | null>(null);

  // --- 3. D&D State (local for transient feedback) ---
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dropTargetEntry, setDropTargetEntry] = useState<IFileSystemEntry | null>(null);

  // --- 4. Visibility Tracking (Crucial for range selection) ---
  // Reference for dynamically mapping visible paths to indices during render
  const visiblePathsRef = useRef<string[]>([]);

  // Helper to collect visible paths during recursion (passed to renderer)
  const registerVisiblePath = useCallback((p: string) => {
    visiblePathsRef.current.push(p);
  }, []);

  // Effect to clear paths reference array before each render cycle starts
  useEffect(() => {
    visiblePathsRef.current = [];
  }, [treeState.expandedPaths, currentDirectoryContents, treeState.cachedContents]);

  // Memoized map for quick lookup, re-calculated when content/expansion changes
  const visiblePathsMap = useMemo(() => {
    const map = new Map<string, number>();
    visiblePathsRef.current.forEach((p, index) => map.set(p, index));
    return map;
  }, [treeState.expandedPaths, currentDirectoryContents, treeState.cachedContents]);

  // --- 5. Selection Logic ---

  const handleSelectionClick = useCallback((entry: IFileSystemEntry, isToggle: boolean, isRange: boolean) => {

    const entryPath = entry.path;
    const paths = visiblePathsRef.current; // Use the collected visible paths

    if (isRange && lastSelectedPath) {
      const startIndex = visiblePathsMap.get(lastSelectedPath);
      const endIndex = visiblePathsMap.get(entryPath);

      if (startIndex === undefined || endIndex === undefined) {
        // Fallback if indices are missing
        setSelectedPath(entryPath, 'single');
        return;
      }

      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);

      const pathsInRange = paths.slice(start, end + 1);

      fileTreeSelectionStore.set(state => {
        const newSelectedPaths = new Set(state.selectedPaths);

        // If Ctrl/Cmd is NOT held, clear current selections first, then apply range.
        if (!isToggle) newSelectedPaths.clear();

        pathsInRange.forEach(p => newSelectedPaths.add(p));

        return {
          selectedPaths: newSelectedPaths,
          // Preserve existing anchor (lastSelectedPath) for range operation 
          lastSelectedPath: state.lastSelectedPath,
        };
      });

    } else if (isToggle) {
      // --- Toggle Selection (Ctrl/Cmd/Meta) ---
      setSelectedPath(entryPath, 'toggle');
    } else {
      // --- Single Selection (Click) ---
      setSelectedPath(entryPath, 'single');
    }

  }, [visiblePathsMap, lastSelectedPath]);


  // --- 6. Combined File Action (Click/Double Click) ---

  // This handles both selection logic and opening files/folders
  const handleFileAction = useCallback((entry: IFileSystemEntry, e: React.MouseEvent) => {

    // 1. Handle Selection Logic (including Shift/Ctrl/Cmd)
    const isToggle = e.metaKey || e.ctrlKey;
    const isRange = e.shiftKey;

    handleSelectionClick(entry, isToggle, isRange);

    // 2. Handle Content Opening
    // Only open editor/viewer if it was a simple single click (no modifiers) and it's a file
    if (!entry.isDirectory && !isToggle && !isRange) {
      
      const mimeType = entry.mimeType || '';
      const isMedia = IMAGE_MIME_TYPES.has(mimeType) || 
                      VIDEO_MIME_TYPES.has(mimeType) ||
                      AUDIO_MIME_TYPES.has(mimeType);

      setActiveFile(entry); // Keep track of the file opened in editor
      
      if (isMedia) {
        openFileInEditor(entry); // Handles opening floating window for media
      } else {
        // Navigate for code/text files
        const encodedPath = encodeURIComponent(entry.path);
        navigate(`/codejector/editor?path=${encodedPath}`);
      }
    }
  }, [handleSelectionClick, setActiveFile, navigate]);
  
  
  // Default handler if no custom handler is provided via props
  const defaultUsePathHandler = useCallback(async (selectedPath: string) => {
    setProjectRoot(selectedPath);
    await dialogService.alert({
        title: 'Project Root Set',
        content: <Typography>Project Root set to: <code className="font-mono">{selectedPath}</code>. You can now return to the AI Planner.</Typography>,
        maxWidth: 'sm'
    });
  }, []);

  const effectiveUsePathHandler = onPathSelectedForUse ?? defaultUsePathHandler;

  // --- 7. Drag and Drop Logic (Replicated from old FileExplorer) ---

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', entry.path); // Store the source path
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPath(entry.path);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => {
    e.preventDefault();
    if (entry.isDirectory && entry.path !== draggedPath) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  }, [draggedPath]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => {
    e.preventDefault();
    e.stopPropagation();
    if (entry.isDirectory && entry.path !== draggedPath) {
      setDropTargetEntry(entry);
    }
  }, [draggedPath]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropTargetEntry?.path === entry.path) {
      setDropTargetEntry(null);
    }
  }, [dropTargetEntry]);

  const handleDragEnd = useCallback(() => {
    setDraggedPath(null);
    setDropTargetEntry(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, destinationEntry: IFileSystemEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetEntry(null);
    setDraggedPath(null);

    if (!destinationEntry.isDirectory) return;

    const sourcePath = e.dataTransfer.getData('text/plain');
    const destinationPath = destinationEntry.path;

    if (!sourcePath || sourcePath === destinationPath) return;

    const fileName = path.basename(sourcePath);
    const newPath = path.join(destinationPath, fileName);

    if (destinationEntry.isDirectory && sourcePath.startsWith(destinationPath) && sourcePath !== destinationPath) {
      await dialogService.alert({
        title: 'Move Error',
        content: `Cannot move a directory into its subdirectory: ${sourcePath}`,
        maxWidth: 'sm'
      });
      return;
    }

    try {
      await fileExplorerService.moveFileOrFolder(sourcePath, newPath);
      console.log(`Moved ${sourcePath} to ${newPath}`);
      handleRefresh(); // Trigger refresh via hook
    } catch (err: unknown) {
      const message = (err as Error).message || 'Failed to move file/folder.';
      await dialogService.alert({
        title: 'Move Failed',
        content: `Move failed: ${message}`,
        maxWidth: 'sm'
      });
    }
  }, [handleRefresh]);

  // --- 8. Context Menu Handler ---
  const handleContextMenu = useCallback((e: React.MouseEvent, clickedEntry: IFileSystemEntry) => {
    e.preventDefault();

    const clickedPath = clickedEntry.path;
    let entriesToPass: IFileSystemEntry[] = [];

    // 1. If clicked item is part of the current selection, pass ALL selected items.
    if (selectedPaths.has(clickedPath) && selectedPaths.size >= 1) {

      const allVisibleEntries: Record<string, IFileSystemEntry> = {};

      // Populate all visible entries (root + expanded children) by traversing contents and cachedContents
      currentDirectoryContents?.forEach(e => allVisibleEntries[e.path] = e);
      Object.values(treeState.cachedContents).forEach(list =>
        list.forEach(e => allVisibleEntries[e.path] = e)
      );

      entriesToPass = Array.from(selectedPaths)
        .map(p => allVisibleEntries[p])
        .filter((e): e is IFileSystemEntry => !!e);

    } else {
      // 2. If not selected, select it as a single item and pass only that one.
      handleSelectionClick(clickedEntry, false, false);
      entriesToPass = [clickedEntry];
    }

    // 3. Open menu
    if (entriesToPass.length > 0) {
      openContextMenu(e, entriesToPass, clickedPath);
    }
  }, []);
  return (
    <Box sx={explorerContainerSx} className="w-full h-full">
      <FileExplorerControls
        currentPath={currentPath}
        isLoading={loadingRoot}
        onNavigate={handleNavigate}
        onRefresh={handleRefresh}
        onGoUp={handleGoUp}
        onUsePath={effectiveUsePathHandler}
      />

      {loadingRoot && (
        <Box className="flex justify-center items-center h-40">
          <CircularProgress size={30} />
          <Typography variant="body1" className="ml-2">Loading Root Directory...</Typography>
        </Box>
      )}

      {rootError && (
        <Alert severity="error" sx={{ m: 2 }}>
          {rootError}
        </Alert>
      )}

      {!loadingRoot && currentDirectoryContents && currentDirectoryContents.length > 0 && (
        <Box sx={contentAreaSx}>
          {/* Note: visiblePathsRef is populated during this render cycle */}
          <FileTreeRenderer 
            contents={currentDirectoryContents} 
            depth={0} 
            treeState={treeState}
            activeFile={activeFile}
            selectedPaths={selectedPaths}
            onNavigate={handleNavigate}
            onFileAction={handleFileAction}
            onContextMenu={handleContextMenu}
            onToggleExpand={handleToggleExpand}
            // D&D Handlers
            draggedPath={draggedPath}
            dropTargetEntry={dropTargetEntry}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
            // Visibility Tracker
            registerVisiblePath={registerVisiblePath}
          />
        </Box>
      )}

      {!loadingRoot && !rootError && currentDirectoryContents && currentDirectoryContents.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
          This directory is empty or contains only hidden files.
        </Typography>
      )}

      <FileExplorerContextMenu />
    </Box>
  );

 }
 
 export default FileExplorer;
