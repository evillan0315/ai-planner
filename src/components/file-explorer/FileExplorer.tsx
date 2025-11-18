import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  SxProps,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import * as path from 'path-browserify';

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
import { 
  IMAGE_MIME_TYPES, 
  VIDEO_MIME_TYPES, 
  AUDIO_MIME_TYPES 
} from '@/constants'; // NEW: Import constants for media check

// New Imports
import { useFileTreeState } from './hooks/useFileTreeState';
import FileTreeRenderer from './FileTreeRenderer';


interface FileExplorerProps {
  initialPath?: string;
  // NEW: Function to execute when the 'Use Path' button is clicked.
  // If provided, it overrides the default action (setting project root and alerting).
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
  const navigate = useNavigate(); // NEW: Initialize navigation hook
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
// ... (handleSelectionClick)


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
// ...