
// File: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/file-explorer/FileTreeRenderer.tsx
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  CircularProgress,
  Paper
} from '@mui/material';

import FileTreeItem from '@/components/file-explorer/FileTreeItem';
import type { IDirectoryListing, IFileSystemEntry } from '@/components/file-explorer/types';
import type { FileExplorerTreeState } from './hooks/useFileTreeState';


// --- Renderer Props ---

interface FileTreeRendererProps {
    /** The directory contents to render at the current depth */
    contents: IDirectoryListing;
    /** Current depth for indentation */
    depth: number;
    /** Full tree state from useFileTreeState */
    treeState: FileExplorerTreeState;
    /** Current active file (for highlighting) */
    activeFile: IFileSystemEntry | null;
    /** Currently selected paths (Set of strings) */
    selectedPaths: Set<string>;
    
    // --- Handlers ---
    onNavigate: (newPath: string) => void;
    onFileAction: (entry: IFileSystemEntry, e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent, clickedEntry: IFileSystemEntry) => void;
    onToggleExpand: (entry: IFileSystemEntry) => Promise<void>;
    
    // --- D&D Handlers ---
    draggedPath: string | null;
    dropTargetEntry: IFileSystemEntry | null;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, destinationEntry: IFileSystemEntry) => Promise<void>;
    onDragEnter: (e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    
    // --- Visibility Tracking ---
    /** Callback to register a path as visible (used for selection calculation) */
    registerVisiblePath: (p: string) => void;
}

/**
 * Recursively renders the file tree structure.
 * Note: This component needs to receive a large set of state and handlers from the orchestrating parent.
 */
const FileTreeRenderer: React.FC<FileTreeRendererProps> = React.memo(({
    contents, 
    depth, 
    treeState, 
    activeFile, 
    selectedPaths,
    onNavigate, 
    onFileAction, 
    onContextMenu, 
    onToggleExpand, 
    draggedPath, 
    dropTargetEntry,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnter,
    onDragLeave,
    onDragEnd,
    registerVisiblePath,
}) => {
    
    return (
    <Paper sx={{backgroundColor: 'background.default'}}>
      <List disablePadding dense>
        {contents.map((entry) => {
          const entryPath = entry.path;
          registerVisiblePath(entryPath); // Register path in the visible map
          
          const isExpanded = treeState.expandedPaths.has(entryPath);
          const childrenContents = treeState.cachedContents[entryPath];
          const isLoadingChildren = treeState.loadingPaths.has(entryPath);
          
          // Selection check
          const isSelected = selectedPaths?.has(entryPath) ?? false;
          
          // Check if this directory is the valid drop target
          const isDragTarget = entry.isDirectory && entry.path === dropTargetEntry?.path && entry.path !== draggedPath;

          return (
            <React.Fragment key={entryPath}>
              <FileTreeItem
                entry={entry}
                depth={depth}
                onNavigate={onNavigate}
                onFileAction={onFileAction}
                isActive={activeFile?.path === entryPath}
                isSelected={isSelected}
                onContextMenu={(e: React.MouseEvent) => {
                  // Centralized context menu logic in FileExplorer needs to be triggered here
                  onContextMenu(e, entry);
                }}
                isExpanded={isExpanded}
                onToggleExpand={entry.isDirectory ? onToggleExpand : undefined}
                isLoadingChildren={isLoadingChildren}
                // D&D Props
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragEnd={onDragEnd}
                isDragTarget={isDragTarget}
              />
              {entry.isDirectory && isExpanded && (
                <Box>
                  {childrenContents ? (
                    childrenContents.length > 0 ? (
                      // Recursive call
                      <FileTreeRenderer 
                        contents={childrenContents} 
                        depth={depth + 1} 
                        treeState={treeState}
                        activeFile={activeFile}
                        selectedPaths={selectedPaths}
                        onNavigate={onNavigate}
                        onFileAction={onFileAction}
                        onContextMenu={onContextMenu}
                        onToggleExpand={onToggleExpand}
                        draggedPath={draggedPath}
                        dropTargetEntry={dropTargetEntry}
                        onDragStart={onDragStart} // ADDED FOR RECURSION
                        onDragOver={onDragOver}   // ADDED FOR RECURSION
                        onDrop={onDrop}           // ADDED FOR RECURSION
                        onDragEnter={onDragEnter} // ADDED FOR RECURSION
                        onDragLeave={onDragLeave} // ADDED FOR RECURSION
                        onDragEnd={onDragEnd}     // ADDED FOR RECURSION
                        registerVisiblePath={registerVisiblePath} // ADDED FOR RECURSION
                      />
                    ) : (
                       <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 0.5, pl: `${(depth + 1) * 16}px` }}>
                         (Empty folder)
                       </Typography>
                    )
                  ) : isLoadingChildren ? (
                    <Box className="flex items-center py-1" sx={{ pl: `${(depth + 1) * 16}px` }}>
                      <CircularProgress size={12} sx={{ mr: 1 }} />
                      <Typography variant="caption">Loading...</Typography>
                    </Box>
                  ) : (
                    null
                  )}
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </List>
      </Paper>
    );
}, (prevProps, nextProps) => {
    // Custom memoization check to optimize tree rendering
    
    // Check if contents are identical (shallow check)
    if (prevProps.contents !== nextProps.contents) return false;
    
    // Check tree state, focus, selection, and D&D state
    if (prevProps.treeState !== nextProps.treeState || 
        prevProps.activeFile?.path !== nextProps.activeFile?.path ||
        prevProps.selectedPaths !== nextProps.selectedPaths ||
        prevProps.draggedPath !== nextProps.draggedPath ||
        prevProps.dropTargetEntry?.path !== nextProps.dropTargetEntry?.path) {
        return false;
    }
    
    // Only re-render if core data or high-level state has changed
    return true; 
});

export default FileTreeRenderer;

