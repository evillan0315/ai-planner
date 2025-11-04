import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Typography, Box } from '@mui/material';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import type { GlobalAction } from '@/types/action';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';

interface PlanMetadataEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  initialTitle: string;
  initialSummary?: string;
  initialThoughtProcess?: string;
  initialDocumentation?: string;
  initialGitInstructions?: string[];
  onSave: (data: {
    title: string;
    summary?: string;
    thoughtProcess?: string;
    documentation?: string;
    gitInstructions?: string[];
  }) => void;
}

const PlanMetadataEditorDrawer: React.FC<PlanMetadataEditorDrawerProps> = ({
  open,
  onClose,
  initialTitle,
  initialSummary,
  initialThoughtProcess,
  initialDocumentation,
  initialGitInstructions,
  onSave,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary || '');
  const [thoughtProcess, setThoughtProcess] = useState(initialThoughtProcess || '');
  const [documentation, setDocumentation] = useState(initialDocumentation || '');
  const [gitInstructions, setGitInstructions] = useState(
    initialGitInstructions ? initialGitInstructions.join('\n') : '',
  );

  // Sync local state with initial props when drawer opens or initial props change
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setSummary(initialSummary || '');
      setThoughtProcess(initialThoughtProcess || '');
      setDocumentation(initialDocumentation || '');
      setGitInstructions(initialGitInstructions ? initialGitInstructions.join('\n') : '');
    }
  }, [
    open,
    initialTitle,
    initialSummary,
    initialThoughtProcess,
    initialDocumentation,
    initialGitInstructions,
  ]);

  const handleSave = useCallback(() => {
    onSave({
      title: title.trim(),
      summary: summary.trim() || undefined,
      thoughtProcess: thoughtProcess.trim() || undefined,
      documentation: documentation.trim() || undefined,
      gitInstructions: gitInstructions.trim()
        ? gitInstructions
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        : undefined,
    });
    onClose();
  }, [title, summary, thoughtProcess, documentation, gitInstructions, onSave, onClose]);

  const handleCancel = useCallback(() => {
    // Revert local changes if canceled by re-syncing with initial props
    setTitle(initialTitle);
    setSummary(initialSummary || '');
    setThoughtProcess(initialThoughtProcess || '');
    setDocumentation(initialDocumentation || '');
    setGitInstructions(initialGitInstructions ? initialGitInstructions.join('\n') : '');
    onClose();
  }, [
    initialTitle,
    initialSummary,
    initialThoughtProcess,
    initialDocumentation,
    initialGitInstructions,
    onClose,
  ]);

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
      disabled: !title.trim(), // Title is required
    },
  ];

  return (
    <CustomDrawer
      open={open}
      onClose={handleCancel}
      position="right"
      size="medium"
      title="Edit Plan Metadata"
      hasBackdrop={true}
      footerActionButton={drawerActions}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Edit the core details of your generated plan. Ensure the title is descriptive.
        </Typography>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          size="small"
          required
          autoFocus
          variant="outlined"
        />
        <TextField
          label="Summary"
          multiline
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
        />
        <TextField
          label="Thought Process (Markdown)"
          multiline
          rows={5}
          value={thoughtProcess}
          onChange={(e) => setThoughtProcess(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
          InputProps={{ style: { fontFamily: 'monospace' } }}
        />
        <TextField
          label="Documentation (Markdown)"
          multiline
          rows={5}
          value={documentation}
          onChange={(e) => setDocumentation(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
          InputProps={{ style: { fontFamily: 'monospace' } }}
        />
        <TextField
          label="Git Instructions (one command per line)"
          multiline
          rows={3}
          value={gitInstructions}
          onChange={(e) => setGitInstructions(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
          InputProps={{ style: { fontFamily: 'monospace' } }}
        />
      </Box>
    </CustomDrawer>
  );
};

export default PlanMetadataEditorDrawer;
