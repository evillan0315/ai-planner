import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Chip,
  useTheme,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import DescriptionIcon from '@mui/icons-material/Description';
import SchemaIcon from '@mui/icons-material/Schema';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BugReportIcon from '@mui/icons-material/BugReport';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import ExpandMoreIcon
import SettingsIcon from '@mui/icons-material/Settings'; 
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'; 
import NoteAddIcon from '@mui/icons-material/NoteAdd'; 

import type { IPlan } from './types'; // Import necessary types
import FloatingIconTextField from '@/components/ui/FloatingIconTextField'; 
import { GlobalAction } from '@/components/ui/GlobalActionButton'; // Import GlobalAction type
import { GlobalActionGroup } from '@/components/ui/GlobalActioButtonGroup'; // NEW: Import GlobalActionGroup

interface PlanInputFormProps {
  userPrompt: string;
  setUserPrompt: (prompt: string) => void;
  projectRoot: string;
  scanPathsInput: string;
  additionalInstructions: string;
  expectedOutputFormat: string;
  fileData: string | null;
  fileMimeType: string | null;
  selectedFile: File | null;
  isLoading: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleClearFile: () => void;
  handleGeneratePlan: () => Promise<void>;
  handleClearPlan: () => void;
  openProjectRootPicker: () => void;
  openScanPathsDrawer: () => void;
  openPlannerListDrawer: () => void;
  openAiInstructionDrawer: () => void;
  openExpectedOutputDrawer: () => void;
  openErrorDetailsDrawer: () => void;
  plan: IPlan | null;
}

const cardSx = {
  marginBottom: 4,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
};

const formSectionSx = {
  padding: 3,
};


export const PlanInputForm: React.FC<PlanInputFormProps> = ({
  userPrompt,
  setUserPrompt,
  projectRoot,
  scanPathsInput,
  additionalInstructions,
  expectedOutputFormat,
  fileData,
  fileMimeType,
  selectedFile,
  isLoading,
  error,
  fileInputRef,
  handleFileChange,
  handleClearFile,
  handleGeneratePlan,
  handleClearPlan,
  openProjectRootPicker,
  openScanPathsDrawer,
  openPlannerListDrawer,
  openAiInstructionDrawer,
  openExpectedOutputDrawer,
  openErrorDetailsDrawer,
  plan
}) => {
  const theme = useTheme();

  // Split actions into logical groups and map them to corners
  const floatingActionGroupsByCorner: Partial<Record<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', GlobalActionGroup[]>> = useMemo(() => {
      
    // 1. Primary Actions (Bottom Right)
    const primaryActions: GlobalAction[] = [
        {
          label: "Generate Plan",
          action: handleGeneratePlan,
          icon: isLoading ? <CircularProgress size={16} color="inherit" /> : <RocketLaunchIcon fontSize="small" />,
          color: 'primary',
          disabled: isLoading || !userPrompt.trim() || !projectRoot.trim(),
        },
        {
          label: "New Plan (Clear existing content)",
          action: handleClearPlan,
          icon: <NoteAddIcon fontSize="small" />,
          color: 'secondary',
          disabled: isLoading && !plan,
        },
    ];
    
    // 2. Model Settings Actions (Top Right)
    const modelSettingsActions: GlobalAction[] = [
        {
          label: "AI Instructions (System Prompt)",
          action: openAiInstructionDrawer,
          icon: <SettingsIcon fontSize="small" />,
          color: additionalInstructions.length > 50 ? 'primary' : 'secondary', // Highlight if custom instructions exist
          disabled: isLoading,
        },
        {
          label: `Expected Output Format (Schema)`,
          action: openExpectedOutputDrawer,
          icon: <SchemaIcon fontSize="small" />,
          color: expectedOutputFormat.length > 50 ? 'primary' : 'secondary', // Highlight if custom schema exists
          disabled: isLoading,
        },
    ];

    // 3. Context Actions (Bottom Left)
    const contextActions: GlobalAction[] = [
        {
          label: `Select Project Root Directory: ${projectRoot}`,
          action: openProjectRootPicker,
          icon: <FolderOpenIcon fontSize="small" />,
          color: 'secondary',
          disabled: isLoading,
        },
        {
          label: `Manage AI Scan Paths: ${scanPathsInput}`,
          action: openScanPathsDrawer,
          icon: <AddRoadIcon fontSize="small" />,
          color: 'secondary',
          disabled: isLoading,
        },
        {
          label: "Upload Context File (Image/Text)",
          action: () => fileInputRef.current?.click(),
          icon: <UploadFileIcon fontSize="small" />,
          color: 'secondary',
          disabled: isLoading || !!selectedFile,
        },
    ];
    
    // Combine into corner groups
    const cornerGroups: Partial<Record<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', GlobalActionGroup[]>> = {};

    if (modelSettingsActions.length > 0) {
        cornerGroups['top-right'] = [{ actionGroup: modelSettingsActions, key: 'model-settings' }];
    }
    
    if (primaryActions.length > 0) {
        cornerGroups['bottom-right'] = [{ actionGroup: primaryActions, key: 'primary' }];
    }
    
    if (contextActions.length > 0) {
        // Grouping Context Actions together
        cornerGroups['bottom-left'] = [{ actionGroup: contextActions, key: 'context' }]; 
    }
    
    return cornerGroups;


  }, [
    projectRoot, 
    scanPathsInput, 
    isLoading, 
    selectedFile, 
    openProjectRootPicker, 
    openScanPathsDrawer, 
    fileInputRef,
    handleClearPlan,
    handleGeneratePlan,
    openAiInstructionDrawer,
    openExpectedOutputDrawer,
    userPrompt,
    plan,
    additionalInstructions, // Added dependency
    expectedOutputFormat, // Added dependency
  ]);

  return (
    <Card sx={cardSx} className="mb-6 flex-shrink-0">
      <CardContent sx={formSectionSx} className="flex flex-col">
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" gutterBottom className="text-text-primary mb-0">
            Generate a New Plan
          </Typography>
          {error && (
            <Tooltip title="View Error Details">
              <IconButton
                color="error"
                onClick={openErrorDetailsDrawer}
                aria-label="view error details"
              >
                <BugReportIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Accordion defaultExpanded className="rounded-lg shadow-sm border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md mb-4">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="user-prompt-content" id="user-prompt-header">
            <Typography variant="subtitle1" className="font-semibold">User Prompt</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Hidden input for file upload, controls are floating in the text field */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isLoading}
            />
            <FloatingIconTextField
              label="Enter your prompt"
              multiline
              rows={1} // Increased rows for better usability with floating icons
              fullWidth
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              //variant="contained"
              disabled={isLoading}
              floatingActionGroupsByCorner={floatingActionGroupsByCorner} 
              sx={{backgroundColor:'background.paper'}}
            />
            {/* Display file status below the prompt field, if a file is attached */}
            {selectedFile && (
                <Stack direction="row" spacing={1} alignItems="center" className="mt-2  max-w-sm">
                    <Chip
                        label={`${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`}
                        onDelete={handleClearFile}
                        color="info"
                        size="small"
                        sx={{ color: theme.palette.text.contrastText, borderColor: theme.palette.info.main }}
                        className="truncate"
                    />
                </Stack>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Project Context Section */}
        <Accordion className="rounded-lg shadow-sm border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md mb-4">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="project-context-content" id="project-context-header">
            <Typography variant="subtitle1" className="font-semibold">Project Context</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Context fields are now displayed here without redundant buttons */}
            <Stack direction="column" spacing={1} className="mb-2">
              <TextField label="Project Root" value={projectRoot} disabled fullWidth size="small" helperText="Set project root via the folder icon in the prompt actions (bottom left)." />
              <TextField
                label="Scan Paths (comma-separated)"
                value={scanPathsInput}
                disabled
                fullWidth
                size="small"
                placeholder="e.g., src, public, package.json"
                helperText="Manage scan paths via the road icon in the prompt actions (bottom left)."
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* AI Configuration Section */}
        <Accordion className="rounded-lg shadow-sm border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md mb-4">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="ai-config-content" id="ai-config-header">
            <Typography variant="subtitle1" className="font-semibold">AI Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="column" spacing={1} className="mb-2">
                <Typography variant="body2" color="text.secondary">
                    AI Instructions Status: <span className={`font-mono font-bold ${additionalInstructions.length > 50 ? 'text-primary-main' : 'text-text-secondary'}`}>{additionalInstructions.length > 50 ? 'Custom/Detailed' : 'Default'}</span>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Output Format Status: <span className={`font-mono font-bold ${expectedOutputFormat.length > 50 ? 'text-primary-main' : 'text-text-secondary'}`}>{expectedOutputFormat.length > 50 ? 'Schema Defined' : 'Default'}</span>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Use the Settings (<SettingsIcon fontSize="inherit" />) icon in the prompt input field (top right corner) to edit configuration.
                </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Actions Section */}
        <Box className="flex justify-between gap-2 mt-4">
          <Tooltip title="View All Saved Plans">
            <IconButton
              color="primary"
              onClick={openPlannerListDrawer}
              aria-label="view all saved plans"
              disabled={isLoading}
            >
              <ListAltIcon />
            </IconButton>
          </Tooltip>
          {/* Removed dedicated Clear Plan and Generate Plan buttons, now handled by floating icons */}
        </Box>
      </CardContent>
    </Card>
  );
};