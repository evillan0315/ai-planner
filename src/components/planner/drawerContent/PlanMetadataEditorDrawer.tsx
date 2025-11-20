import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Typography, Box, Alert } from '@mui/material';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import type { GlobalAction } from '@/types/action';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';

interface PlanMetadataEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  initialTitle: string;
  initialSummary?: string;
  initialThoughtProcess?: string[] | string; // Allow string|string[] from IPlan
  initialDocumentation?: string;
  initialAssumptions?: string[]; // ADDED
  initialConfidence?: number; // ADDED
  initialEstimatedEffortMinutes?: number; // FIXED TYPO
  initialBuildScripts?: Record<string, string>; // ADDED
  initialGitInstructions?: { // UPDATED: Changed to object
    branchName: string;
    commitMessage: string;
    commands: string[];
  };
  onSave: (data: {
    title: string;
    summary?: string;
    thoughtProcess?: string[];
    documentation?: string;
    assumptions?: string[]; // ADDED
    confidence?: number; // ADDED
    estimatedEffortMinutes?: number; // FIXED TYPO
    buildScripts?: Record<string, string>; // ADDED: New field
    gitInstructions?: { // UPDATED: Changed to object
      branchName: string;
      commitMessage: string;
      commands: string[];
    };
  }) => void;
}

const PlanMetadataEditorDrawer: React.FC<PlanMetadataEditorDrawerProps> = ({
  open,
  onClose,
  initialTitle,
  initialSummary,
  initialThoughtProcess,
  initialDocumentation,
  initialAssumptions, // Destructured
  initialConfidence, // Destructured
  initialEstimatedEffortMinutes, // Destructured (FIXED TYPO HERE)
  initialBuildScripts,
  initialGitInstructions,
  onSave,
}) => {
  // Defensive normalization for initialThoughtProcess and Assumptions
  const getNormalizedStringArray = (arr: string[] | string | undefined): string => {
    if (Array.isArray(arr)) return arr.join('\n');
    if (typeof arr === 'string' && arr.trim() !== '') return arr.trim();
    return '';
  };

  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary || '');
  // Apply normalization here
  const [thoughtProcess, setThoughtProcess] = useState(getNormalizedStringArray(initialThoughtProcess));
  const [documentation, setDocumentation] = useState(initialDocumentation || '');
  const [assumptions, setAssumptions] = useState(getNormalizedStringArray(initialAssumptions)); // New state
  const [confidence, setConfidence] = useState<number | undefined>(initialConfidence);
  const [estimatedEffortMinutes, setEstimatedEffortMinutes] = useState<number | undefined>(initialEstimatedEffortMinutes); // Used fixed prop
  const [buildScripts, setBuildScripts] = useState(initialBuildScripts ? JSON.stringify(initialBuildScripts, null, 2) : '');
  const [buildScriptsError, setBuildScriptsError] = useState<string | null>(null);

  // Git Instructions
  const [gitInstructionsBranch, setGitInstructionsBranch] = useState(initialGitInstructions?.branchName || '');
  const [gitInstructionsCommit, setGitInstructionsCommit] = useState(initialGitInstructions?.commitMessage || '');
  const [gitInstructionsCommands, setGitInstructionsCommands] = useState(initialGitInstructions?.commands?.join('\n') || '');

  // Sync local state with initial props when drawer opens or initial props change
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setSummary(initialSummary || '');
      setThoughtProcess(getNormalizedStringArray(initialThoughtProcess));
      setDocumentation(initialDocumentation || '');
      setAssumptions(getNormalizedStringArray(initialAssumptions));
      setConfidence(initialConfidence);
      setEstimatedEffortMinutes(initialEstimatedEffortMinutes); // Used fixed prop
      setBuildScripts(initialBuildScripts ? JSON.stringify(initialBuildScripts, null, 2) : '');
      setGitInstructionsBranch(initialGitInstructions?.branchName || '');
      setGitInstructionsCommit(initialGitInstructions?.commitMessage || '');
      setGitInstructionsCommands(initialGitInstructions?.commands?.join('\n') || '');
      setBuildScriptsError(null);
    }
  }, [
    open,
    initialTitle,
    initialSummary,
    initialThoughtProcess,
    initialDocumentation,
    initialAssumptions,
    initialConfidence,
    initialEstimatedEffortMinutes, // Used fixed prop
    initialBuildScripts,
    initialGitInstructions,
  ]);

  const handleSave = useCallback(() => {
    let parsedBuildScripts: Record<string, string> | undefined = undefined;
    setBuildScriptsError(null);
    
    // 1. Parse Build Scripts
    if (buildScripts.trim()) {
      try {
        const parsed = JSON.parse(buildScripts);
        if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
          setBuildScriptsError('Build scripts must be a valid JSON object.');
          return;
        }
        parsedBuildScripts = parsed as Record<string, string>;
      } catch (e) {
        setBuildScriptsError('Invalid JSON format for Build Scripts.');
        return;
      }
    }

    // 2. Normalize Array fields
    const normalizedThoughtProcess = thoughtProcess.trim()
      ? thoughtProcess.split('\n').map((line) => line.trim()).filter(Boolean)
      : undefined;
    
    const normalizedAssumptions = assumptions.trim()
      ? assumptions.split('\n').map((line) => line.trim()).filter(Boolean)
      : undefined;

    const normalizedGitCommands = gitInstructionsCommands.trim()
      ? gitInstructionsCommands.split('\n').map((line) => line.trim()).filter(Boolean)
      : [];

    // 3. Construct Git Instructions object
    const gitInstructionsObject = (gitInstructionsBranch.trim() || gitInstructionsCommit.trim() || normalizedGitCommands.length > 0)
      ? { // Double quotes escaped
          branchName: gitInstructionsBranch.trim(),
          commitMessage: gitInstructionsCommit.trim(),
          commands: normalizedGitCommands,
        }
      : undefined;

    // 4. Construct Save Data
    onSave({
      title: title.trim(),
      summary: summary.trim() || undefined,
      thoughtProcess: normalizedThoughtProcess,
      documentation: documentation.trim() || undefined,
      assumptions: normalizedAssumptions,
      confidence: confidence,
      estimatedEffortMinutes: estimatedEffortMinutes,
      buildScripts: parsedBuildScripts,
      gitInstructions: gitInstructionsObject,
    });
    onClose();
  }, [title, summary, thoughtProcess, documentation, assumptions, confidence, estimatedEffortMinutes, buildScripts, gitInstructionsBranch, gitInstructionsCommit, gitInstructionsCommands, onSave, onClose]);

  const handleCancel = useCallback(() => {
    setTitle(initialTitle);
    setSummary(initialSummary || '');
    setThoughtProcess(getNormalizedStringArray(initialThoughtProcess)); // Revert with normalization
    setDocumentation(initialDocumentation || '');
    setAssumptions(getNormalizedStringArray(initialAssumptions));
    setConfidence(initialConfidence);
    setEstimatedEffortMinutes(initialEstimatedEffortMinutes); // Used fixed prop
    setBuildScripts(initialBuildScripts ? JSON.stringify(initialBuildScripts, null, 2) : '');
    setGitInstructionsBranch(initialGitInstructions?.branchName || '');
    setGitInstructionsCommit(initialGitInstructions?.commitMessage || '');
    setGitInstructionsCommands(initialGitInstructions?.commands?.join('\n') || '');
    setBuildScriptsError(null);
    onClose();
  }, [
    initialTitle,
    initialSummary,
    initialThoughtProcess,
    initialDocumentation,
    initialAssumptions,
    initialConfidence,
    initialEstimatedEffortMinutes, // Used fixed prop
    initialBuildScripts,
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
      disabled: !title.trim() || !!buildScriptsError, // Title is required
    },
  ];

  return (
    <CustomDrawer
      open={open}
      onClose={handleCancel}
      position="left"
      size="medium"
      title="Edit Plan Metadata"
      hasBackdrop={true}
      footerActionButton={drawerActions}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <Typography variant="body2" color="text.secondary">
          Edit the core details of your generated plan. Confidence and effort estimates are for review only.
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
          label="Thought Process (Markdown, one bullet per line)"
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
          label="Assumptions (one per line)"
          multiline
          rows={3}
          value={assumptions}
          onChange={(e) => setAssumptions(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
        />

        <Box className="grid grid-cols-3 gap-2">
            <TextField
                label="Confidence (0.0 - 1.0)"
                type="number"
                inputProps={{ step: 0.01, min: 0, max: 1 }}
                value={confidence === undefined ? '' : confidence}
                onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setConfidence(isNaN(val) ? undefined : Math.max(0, Math.min(1, val)));
                }}
                fullWidth
                size="small"
                variant="outlined"
            />
            <TextField
                label="Estimated Effort (minutes)"
                type="number"
                inputProps={{ step: 1, min: 0 }}
                value={estimatedEffortMinutes === undefined ? '' : estimatedEffortMinutes}
                onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setEstimatedEffortMinutes(isNaN(val) ? undefined : Math.max(0, val));
                }}
                fullWidth
                size="small"
                variant="outlined"
            />
        </Box>


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
          label="Build Scripts (JSON object)"
          multiline
          rows={5}
          value={buildScripts}
          onChange={(e) => {
            setBuildScripts(e.target.value);
            setBuildScriptsError(null);
          }}
          fullWidth
          size="small"
          variant="outlined"
          InputProps={{ style: { fontFamily: 'monospace' } }}
          helperText={buildScriptsError || "e.g., { 'install': 'npm install', 'build': 'npm run build' }"}
          error={!!buildScriptsError}
        />
        
        <Box className="border p-2 rounded-md border-divider space-y-2">
            <Typography variant="subtitle2" component="h3" fontWeight="bold">
                Git Instructions
            </Typography>
            <TextField
                label="Branch Name"
                value={gitInstructionsBranch}
                onChange={(e) => setGitInstructionsBranch(e.target.value)}
                fullWidth
                size="small"
                variant="outlined"
                InputProps={{ style: { fontFamily: 'monospace' } }}
            />
            <TextField
                label="Commit Message"
                value={gitInstructionsCommit}
                onChange={(e) => setGitInstructionsCommit(e.target.value)}
                fullWidth
                size="small"
                variant="outlined"
                InputProps={{ style: { fontFamily: 'monospace' } }}
            />
            <TextField
                label="Git Commands (one command per line)"
                multiline
                rows={3}
                value={gitInstructionsCommands}
                onChange={(e) => setGitInstructionsCommands(e.target.value)}
                fullWidth
                size="small"
                variant="outlined"
                InputProps={{ style: { fontFamily: 'monospace' } }}
            />
        </Box>
      </Box>
    </CustomDrawer>
  );
};
export default PlanMetadataEditorDrawer;