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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import type { GlobalAction } from '@/types/action';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { FileAction, IFileChange } from '@/components/planner/types';
import MonacoEditor from '@/components/editor/monaco/MonacoEditor'; // Import MonacoEditor
import * as path from 'path-browserify'; // Import path-browserify for file extension detection

import  { getMonacoLanguage } from '@/utils/editorUtils';

interface FileChangeEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  initialFileChange: IFileChange;
  onSave: (updatedChange: IFileChange) => void;
}

// Helper to truncate file paths for display purposes
const truncate = (filePath: string, maxLength = 30): string => {
  if (!filePath) return '';
  const parts = filePath.split(/[\/]/); // Split by / or \
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


// --- START FIX: Editor Height Configuration ---
const OLD_CONTENT_PREVIEW_HEIGHT = '200px';
const DIFF_PREVIEW_HEIGHT = '300px';
// Style for Monaco Editor to ensure it grows and fills vertical space
const monacoEditorSx = {
  flexGrow: 1,
  height: '100%', // Explicitly set height to 100% to ensure Monaco Editor can calculate its dimensions
  minHeight: '300px', // Ensure a minimum height if the content is short
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  overflow: 'hidden', // Ensure content inside editor doesn't overflow
};
const getMonacoPreviewSx = (fixedHeight: string, theme: Theme): SxProps => ({
    height: fixedHeight,
    minHeight: fixedHeight,
    maxHeight: fixedHeight,
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: theme.palette.action.hover, // Ensure container background is distinct for preview
});



const FileChangeEditorDrawer: React.FC<FileChangeEditorDrawerProps> = ({
  open,
  onClose,
  initialFileChange,
  onSave,
}) => {
  const theme = useTheme();
  
  // Editable states
  const [filePath, setFilePath] = useState(initialFileChange.filePath);
  const [action, setAction] = useState<FileAction>(initialFileChange.action);
  const [newContent, setNewContent] = useState(initialFileChange.newContent || '');
  const [reason, setReason] = useState(initialFileChange.reason || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(initialFileChange.estimatedMinutes ?? 0);
  const [testsAdded, setTestsAdded] = useState(
    initialFileChange.testsAdded?.join('\n') || '' // Store as newline-separated string
  );


  // Sync local state with initial props when drawer opens or initial props change
  useEffect(() => {
    if (open) {
      setFilePath(initialFileChange.filePath);
      setAction(initialFileChange.action);
      setNewContent(initialFileChange.newContent || '');
      setReason(initialFileChange.reason || '');
      setEstimatedMinutes(initialFileChange.estimatedMinutes ?? 0);
      setTestsAdded(initialFileChange.testsAdded?.join('\n') || '');
    }
  }, [open, initialFileChange]);

  const handleSave = useCallback(() => {
    // 1. Normalize testsAdded from string to string[]
    const normalizedTestsAdded = testsAdded.trim()
      ? testsAdded.split('\n').map((line) => line.trim()).filter(Boolean)
      : undefined;

    // 2. Create updated change object
    const updatedChange: IFileChange = {
      // Required fields from store/backend
      filePath: filePath.trim(),
      action: action,
      index: initialFileChange.index, // Preserve index
      
      // Editable optional fields
      reason: reason.trim() || undefined,
      estimatedMinutes: estimatedMinutes >= 0 ? estimatedMinutes : undefined,
      testsAdded: normalizedTestsAdded,

      // Content fields (controlled by action)
      ...(action === 'ADD' || action === 'MODIFY' || action === 'REPAIR'
        ? { newContent: newContent }
        : { newContent: undefined }),
      
      // Non-editable content fields (preserve originals)
      diff: initialFileChange.diff,
      oldContent: initialFileChange.oldContent,
    };
    
    // Clean up unnecessary null/undefined fields if not strictly required by the IFileChange interface or save logic
    if (!updatedChange.reason) delete updatedChange.reason;
    if (updatedChange.estimatedMinutes === 0 || updatedChange.estimatedMinutes === undefined) delete updatedChange.estimatedMinutes;
    if (!updatedChange.testsAdded || updatedChange.testsAdded.length === 0) delete updatedChange.testsAdded;

    onSave(updatedChange);
  }, [
    filePath, 
    action, 
    newContent, 
    reason, 
    estimatedMinutes, 
    testsAdded,
    initialFileChange.diff, 
    initialFileChange.oldContent,
    initialFileChange.index,
    onSave
  ]);

  const handleCancel = useCallback(() => {
    // Revert local changes if canceled by re-syncing with initial props
    setFilePath(initialFileChange.filePath);
    setAction(initialFileChange.action);
    setNewContent(initialFileChange.newContent || '');
    setReason(initialFileChange.reason || '');
    setEstimatedMinutes(initialFileChange.estimatedMinutes ?? 0);
    setTestsAdded(initialFileChange.testsAdded?.join('\n') || '');
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
      size: 'sm',
      disabled:
        !filePath.trim() ||
        ((action === 'ADD' || action === 'MODIFY' || action === 'REPAIR') && !newContent.trim()),
    },
  ];

  const requiresNewContent = useMemo(() => {
    return action === 'ADD' || action === 'MODIFY' || action === 'REPAIR';
  }, [action]);

  const requiresDiff = useMemo(() => {
    return (action === 'MODIFY' || action === 'REPAIR') && initialFileChange.diff;
  }, [action, initialFileChange.diff]);

  const requiresOldContent = useMemo(() => {
    // Only show old content if we are modifying or repairing OR analyzing AND old content sample exists
    return (action === 'MODIFY' || action === 'REPAIR' || action === 'ANALYZE') && initialFileChange.oldContent;
  }, [action, initialFileChange.oldContent]);


  return (
    <CustomDrawer
      open={open}
      onClose={handleCancel}
      position="left"
      size="medium"
      title={`Edit Change Index ${initialFileChange.index ?? initialFileChange.filePath} (${initialFileChange.action})`}
      hasBackdrop={true}
      footerActionButton={drawerActions}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        
        {/* Row 1: Read-only path and editable action type */}
        <Tooltip title="File path of the change.">
          <TextField
            label="File Path"
            value={filePath}
            fullWidth
            size="small"
            required
            variant="outlined"
            disabled // Keep file path read-only
            sx={{ bgcolor: theme.palette.action.disabledBackground }}
          />
        </Tooltip>
        
        

        {/* Row 2: Metadata (Reason, Time) */}
        <TextField
          label="Reason (Markdown)"
          multiline
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
          InputProps={{ style: { fontFamily: 'monospace' } }}
        />

        <Box className="grid grid-cols-2 gap-2">
            <TextField
                label="Estimated Effort (minutes)"
                type="number"
                inputProps={{ step: 1, min: 0 }}
                value={estimatedMinutes}
                onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setEstimatedMinutes(isNaN(val) ? 0 : Math.max(0, val));
                }}
            
                size="small"
                variant="outlined"
            />
          <FormControl  size="small" required>
          <InputLabel>Action</InputLabel>
          <Select
            value={action}
            label="Action"
            disabled
            onChange={(e) => setAction(e.target.value as FileAction)}
          >
            {['ADD', 'MODIFY', 'DELETE', 'REPAIR', 'ANALYZE', 'INSTALL', 'RUN'].map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </Box>

        
        {requiresNewContent && (
          <Box className="flex flex-col flex-grow min-h-[300px]">
            <Typography variant="subtitle2" component="div" className="mb-1 font-semibold">
              New Content / Replacement
            </Typography>
            <Box sx={monacoEditorSx}>
              <MonacoEditor
                value={newContent}
                onChange={(value) => setNewContent(value || '')}
                language={getMonacoLanguage(filePath)}
                options={{
                  readOnly: false,
                  minimap: { enabled: false },
                  wordWrap: 'on',
                }}
              />
            </Box>
          </Box>
        )}
        {requiresOldContent && (
          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2" color="text.secondary">
                Original Content Sample (Read Only)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={getMonacoPreviewSx(OLD_CONTENT_PREVIEW_HEIGHT, theme)}> {/* FIXED: Using fixed height and passing theme */}
                <MonacoEditor
                  value={initialFileChange.oldContent || ''}
                  onChange={() => {}}
                  language={getMonacoLanguage(filePath)}
                  options={{ readOnly: true, minimap: { enabled: false } }}
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {requiresDiff && initialFileChange.diff && (
          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2" color="primary.main">
                Unified Diff (Read Only)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, overflow: 'hidden' }}>
            {/* Removed redundant wrapping Box, replaced internal Box with fixed height SX */}
              <Box sx={getMonacoPreviewSx(DIFF_PREVIEW_HEIGHT, theme)}> {/* FIXED: Using fixed height and passing theme */}
                <MonacoEditor
                  value={initialFileChange.diff}
                  onChange={() => {}}
                  language="diff"
                  options={{ readOnly: true, minimap: { enabled: false } }}
                  height="100%"
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        )}


        <TextField
          label="Tests Added/Modified (one relative path per line)"
          multiline
          rows={3}
          value={testsAdded}
          onChange={(e) => setTestsAdded(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
          InputProps={{ style: { fontFamily: 'monospace' } }}
          helperText="List relative paths of test files relevant to this change."
        />
      </Box>
    </CustomDrawer>
  );
};

export default FileChangeEditorDrawer;
