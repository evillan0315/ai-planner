import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  SxProps,
  CircularProgress,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'; // Added for expanded state

import type { IFileSystemEntry } from './types';

/**
 * Props for the FileTreeItem component.
 */
interface FileTreeItemProps {
  entry: IFileSystemEntry;
  depth: number;
  onNavigate: (newPath: string) => void;
  // Handler now accepts the click event to check modifiers (Shift/Ctrl/Cmd)
  onFileAction?: (entry: IFileSystemEntry, e: React.MouseEvent) => void; // MODIFIED signature
  // Optional: Highlight if the file/folder is selected or currently active
  isActive?: boolean; 
  isSelected?: boolean; // NEW: Selection state
  // Context menu handler
  onContextMenu: (event: React.MouseEvent, entry: IFileSystemEntry) => void;
  // State for collapsible behavior
  isExpanded?: boolean;
  onToggleExpand?: (entry: IFileSystemEntry) => void; // Trigger for expanding/collapsing
  isLoadingChildren?: boolean; // Show loading spinner if children are being fetched
  
  // NEW: Drag and Drop Handlers
  onDragStart: (e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>, entry: IFileSystemEntry) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  /** Visual feedback if this item is a valid drop target (usually only directories). */
  isDragTarget?: boolean;
}

// ================================================
// SX Prop Definitions
// ================================================

const baseItemSx: (theme: ReturnType<typeof useTheme>, depth: number, isActive: boolean, isSelected: boolean, isDragTarget: boolean) => SxProps = (theme, depth, isActive, isSelected, isDragTarget) => ({
  display: 'flex',
  alignItems: 'center',
  paddingY: 0.75,
  paddingLeft: `${depth * 16}px`, // Indentation based on depth (16px per level)
  cursor: 'pointer',
  transition: 'background-color 0.15s ease-in-out, border 0.15s ease-in-out',
  minHeight: '36px',
  // Highlighting: Primary for active, secondary for drag target, action.selected for generic selection
  borderLeft: isActive
    ? `3px solid ${theme.palette.primary.main}`
    : isSelected
    ? `3px solid ${theme.palette.secondary.main}` // Use secondary color for selection
    : isDragTarget
    ? `3px solid ${theme.palette.action.hover}`
    : '3px solid transparent',
  backgroundColor: isActive 
    ? theme.palette.action.selected // Default selection background for active file
    : isSelected
    ? theme.palette.action.selected // General selection background
    : isDragTarget 
    ? theme.palette.action.hover 
    : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
});

const getIconColor = (entry: IFileSystemEntry) => {
  if (entry.isDirectory) {
    return 'info.main';
  }
  // Simple heuristic for file type color
  if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) return 'primary.main';
  if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) return 'warning.main';
  if (entry.name.endsWith('.css') || entry.name.endsWith('.scss')) return 'secondary.main';
  if (entry.name.endsWith('.json')) return 'error.main';
  return 'text.secondary';
};

const formatSize = (bytes?: number): string => {
    if (bytes === undefined || bytes === null || bytes < 0) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};


const FileTreeItem: React.FC<FileTreeItemProps> = ({
  entry,
  depth,
  onNavigate,
  onFileAction,
  isActive = false,
  isSelected = false, // Default to false
  onContextMenu,
  isExpanded,
  onToggleExpand,
  isLoadingChildren = false,
  // NEW D&D Props
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  onDragEnd,
  isDragTarget = false,
}) => {
  const theme = useTheme();
  
  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Always trigger file action first for selection logic (passing the event)
    if (onFileAction) {
        onFileAction(entry, e);
    }

    if (entry.isDirectory) {
      // If folder is clicked AND it's a simple single click (no modifier keys), we toggle expansion
      if (onToggleExpand && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        onToggleExpand(entry);
      }
    }
    // Note: File opening is handled in FileExplorer.tsx based on the click type.
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entry.isDirectory && onToggleExpand) {
        // Toggle expansion regardless of selection state when clicking the expand icon
        onToggleExpand(entry);
    }
  };

  // Handler for double clicking a directory, which explicitly navigates to that path (changes root view)
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entry.isDirectory) {
        onNavigate(entry.path);
    }
  }


  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    onContextMenu(e, entry);
  };

  const IconComponent = entry.isDirectory ? FolderIcon : InsertDriveFileIcon;
  const iconColor = getIconColor(entry);

  return (
 
      <Box 
        component="div"
        // D&D Attributes
        draggable={true} // Allow item to be dragged
        onDragStart={(e) => onDragStart(e, entry)}
        onDragOver={(e) => onDragOver(e, entry)}
        onDrop={(e) => onDrop(e, entry)}
        onDragEnter={(e) => onDragEnter(e, entry)}
        onDragLeave={(e) => onDragLeave(e, entry)}
        onDragEnd={onDragEnd}
        
        onClick={handleItemClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        sx={baseItemSx(theme, depth, isActive, isSelected, isDragTarget)}
        className="flex justify-between w-full"
      >
        <Box className="flex items-center flex-grow min-w-0 pr-4">

          {entry.isDirectory && onToggleExpand ? (
            <IconButton size="small" sx={{ p: 0, mr: 0.5 }} onClick={handleIconClick} disabled={isLoadingChildren}>
              {isLoadingChildren ? (
                <CircularProgress size={16} color="inherit" />
              ) : isExpanded ? (
                <KeyboardArrowDownIcon fontSize="small" color="action" />
              ) : (
                <KeyboardArrowRightIcon fontSize="small" color="action" />
              )}
            </IconButton>
          ) : (
            <Box sx={{ width: '24px', mr: 0.5 }} /> 
          )}

          <IconComponent sx={{ mr: 1, color: iconColor, fontSize: 18 }} />
          <Typography 
            variant="body2" 
            sx={{ 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                fontWeight: entry.isDirectory ? 500 : 400,
            }}
          >
            {entry.name}
          </Typography>
        </Box>
        
        <Box className="flex items-center space-x-2 text-right flex-shrink-0 pr-2">
            {!entry.isDirectory && entry.size !== undefined && (
                <Typography variant="caption" color="text.secondary">
                    {formatSize(entry.size)}
                </Typography>
            )}
        </Box>
      </Box>
 
  );
};

export default FileTreeItem;

