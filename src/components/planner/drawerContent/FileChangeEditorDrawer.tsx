import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TextField,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  Tooltip,
} from '@mui/material';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import type { GlobalAction } from '@/types/action';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import type { FileAction, IFileChange } from '@/components/planner/types';

interface FileChangeEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  initialFileChange: IFileChange;
  onSave: (updatedChange: IFileChange) => void;
}

const FileChangeEditorDrawer: React.FC<FileChangeEditorDrawerProps> = ({
  open,
  onClose,
  initialFileChange,
  onSave,
}) => {
  const theme = useTheme();
  const [filePath, setFilePath] = useState(initialFileChange.filePath);
  const [action, setAction] = useState<FileAction>(initialFileChange.action);
  const [newContent, setNewContent] = useState(initialFileChange.newContent || '');
  const [reason, setReason] = useState(initialFileChange.reason || '');

  // Sync local state with initial props when drawer opens or initial props change
  useEffect(() => {
    if (open) {
      setFilePath(initialFileChange.filePath);
      setAction(initialFileChange.action);
      setNewContent(initialFileChange.newContent || '');
      setReason(initialFileChange.reason || '');
    }
  }, [open, initialFileChange]);

  const handleSave = useCallback(() => {
    // Create a new IFileChange object with updated values
    const updatedChange: IFileChange = {
      filePath: filePath.trim(),
      action: action,
      reason: reason.trim() || undefined,
      // newContent is only included if action requires it
      ...(action === 'ADD' || action === 'MODIFY' || action === 'REPAIR'
        ? { newContent: newContent }
        : {}),
      // Diff is not editable directly by the user
      diff: initialFileChange.diff, // Preserve existing diff if any
    };
    onSave(updatedChange);
  }, [filePath, action, newContent, reason, initialFileChange.diff, onSave]);

  const handleCancel = useCallback(() => {
    // Revert local changes if canceled by re-syncing with initial props
    setFilePath(initialFileChange.filePath);
    setAction(initialFileChange.action);
    setNewContent(initialFileChange.newContent || '');
    setReason(initialFileChange.reason || '');
    onClose();
  }, [initialFileChange, onClose]);

  const drawerActions: GlobalAction[] = [
    {
      label: 'Cancel',
      action: handleCancel,
      icon: <ClearIcon />,
      color: 'inherit',
      variant: 'outlined',
    },
    {
      label: 'Save',
      action: handleSave,
      icon: <SaveIcon />,
      color: 'primary',
      variant: 'contained',
      disabled:
        !filePath.trim() ||
        ((action === 'ADD' || action === 'MODIFY' || action === 'REPAIR') && !newContent.trim()),
    },
  ];

  const requiresNewContent = useMemo(() => {
    return action === 'ADD' || action === 'MODIFY' || action === 'REPAIR';
  }, [action]);

  return (
    <CustomDrawer
      open={open}
      onClose={handleCancel}
      position="right"
      size="medium"
      title={`Edit File Change: ${truncate(initialFileChange.filePath, 40)}`}
      hasBackdrop={true}
      footerActionButton={drawerActions}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Modify the details of this file change. These edits are only applied to the current plan
          in the UI.
        </Typography>
        <Tooltip title="File path of the change. Not editable at the moment.">
          <TextField
            label="File Path"
            value={filePath}
            fullWidth
            size="small"
            required
            variant="outlined"
            disabled // Make file path read-only for now; direct renaming is more complex
            sx={{ bgcolor: theme.palette.action.disabledBackground }}
          />
        </Tooltip>
        <FormControl fullWidth size="small" required>
          <InputLabel>Action</InputLabel>
          <Select
            value={action}
            label="Action"
            onChange={(e) => setAction(e.target.value as FileAction)}
          >
            {['ADD', 'MODIFY', 'DELETE', 'REPAIR', 'ANALYZE', 'INSTALL', 'RUN'].map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Reason (Markdown)"
          multiline
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
          InputProps={{ style: { fontFamily: 'monospace' } }}
        />
        {requiresNewContent && (
          <TextField
            label="New Content (full file content, Markdown/Code)"
            multiline
            rows={10}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            fullWidth
            size="small"
            variant="outlined"
            required
            InputProps={{ style: { fontFamily: 'monospace' } }}
            sx={{ flexGrow: 1, '.MuiInputBase-root': { height: '100%', alignItems: 'flex-start' }, '.MuiInputBase-root .MuiInputBase-input': { height: '100% !important', alignItems: 'flex-start' } }}
          />
        )}
      </Box>
    </CustomDrawer>
  );
};

// Helper to truncate file paths for display, same as in ScanPathsDrawer
const truncate = (filePath: string, maxLength = 30): string => {
  if (!filePath) return '';
  const parts = filePath.split(/[\\/]/); // Split by / or \\ // Double quotes escaped
  const fileName = parts[parts.length - 1];

  if (fileName.length > maxLength - 3) {
    return `...${fileName.substring(fileName.length - (maxLength - 3))}`;
  } else if (filePath.length > maxLength) {
    const availableLength = maxLength - fileName.length - 3;
    if (availableLength > 0) {
      return `${filePath.substring(0, availableLength)}...${fileName}`;
    }
    return `...${fileName}`;
  }
  return filePath;
};

export default FileChangeEditorDrawer;
