import React, { useMemo, useState, useCallback } from 'react';
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
  Paper,
  Menu,
  MenuItem
} from '@mui/material';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import DescriptionIcon from '@mui/icons-material/Description'; // Icon for documentation/help
import SchemaIcon from '@mui/icons-material/Schema';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BugReportIcon from '@mui/icons-material/BugReport';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SettingsIcon from '@mui/icons-material/Settings'; 
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'; 
import NoteAddIcon from '@mui/icons-material/NoteAdd'; 
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; 
import StyleIcon from '@mui/icons-material/Style'; 

import type { IPlan } from './types'; 
import  { PROJECT_ROOT_TOOLTIP_DOCS } from './constants/documentation'; 
import FloatingIconTextField from '@/components/ui/FloatingIconTextField'; 
import type { GlobalAction } from '@/components/ui/GlobalActionButton'; 
import type { GlobalActionGroup } from '@/components/ui/GlobalActioButtonGroup'; 
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';
import { REVISION_TONES } from './constants/tones';

import { truncatePathDisplay } from './utils/index';
import { useStore } from '@nanostores/react';




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
  handlePromptGenerate: () => Promise<void>;
  handleClearPlan: () => void;
  handleRevisionTone: (tone: string) => void;
  openProjectRootPicker: () => void;
  openScanPathsDrawer: () => void;
  openPlannerListDrawer: () => void;
  openAiInstructionDrawer: () => void;
  openExpectedOutputDrawer: () => void;
  openErrorDetailsDrawer: () => void;
  plan: IPlan | null;
  revisionTone: string | '';
}



const formSectionSx = {
  
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
  handlePromptGenerate,
  handleClearPlan,
  handleRevisionTone,
  openProjectRootPicker,
  openScanPathsDrawer,
  openPlannerListDrawer,
  openAiInstructionDrawer,
  openExpectedOutputDrawer,
  openErrorDetailsDrawer,
  plan,
  revisionTone
}) => {
  const theme = useTheme();
  const cardSx = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`
  }

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (tone: { value: string, label: string, icon: JSX.Element }) => {
    handleRevisionTone(tone.value); // Call handler with selected tone value
    handleClose();
  };

  // Split actions into logical groups and map them to corners
  const floatingActionGroupsByCorner: Partial<Record<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', GlobalActionGroup[]>> = useMemo(() => {
      
    // Action 0: Error Details (BugReportIcon) - conditionally added to Primary Actions
    const errorDetailsAction: GlobalAction[] = [{
        label: "View Error Details",
        action: openErrorDetailsDrawer,
        icon: <BugReportIcon fontSize="small" />,
        color: 'error',
        disabled: isLoading,
        iconOnly: true,
    }]; // Only show if plan exists AND error exists
      
    // 1. Primary Actions (Bottom Right)
    const primaryActions: GlobalAction[] = [
        
        // ADDED: Error details icon moved here
        ...errorDetailsAction,
        
        {
          label: "New Plan (Clear existing content)",
          action: handleClearPlan,
          icon: <NoteAddIcon fontSize="small" color="inherit" />,
          color: 'secondary',
          disabled: isLoading && !plan,
          iconOnly: true,
        },
        {
          label: "Generate Plan",
          action: handleGeneratePlan,
          icon: isLoading ? <CircularProgress size={16} color="inherit" /> : <RocketLaunchIcon fontSize="small" />,
          color: 'success',
          disabled: isLoading || !userPrompt.trim() || !projectRoot.trim(),
          iconOnly: true,
        },
    ];
    
    // 2. Model Settings Actions (Top Right)
    const modelSettingsActions: GlobalAction[] = [
        {
           label: "Tone Selector",
          action: handleClick,
          icon: <StyleIcon fontSize="small" />,
          color: additionalInstructions.length > 50 ? 'primary' : 'secondary', 
          disabled: isLoading,
          iconOnly: true,
        },
        {
          label: "Prompt Generator (Revise Prompt)",
          action: handlePromptGenerate,
          icon: <AutoAwesomeIcon fontSize="small" />,
          color: additionalInstructions.length > 50 ? 'primary' : 'secondary', 
          disabled: isLoading || !userPrompt.trim(),
          iconOnly: true,
        },
        {
          label: "Edit AI Instructions / System Prompt",
          action: openAiInstructionDrawer,
          icon: <SettingsIcon fontSize="small" />,
          color: additionalInstructions.length > 50 ? 'primary' : 'secondary', 
          disabled: isLoading,
          iconOnly: true,
        },
        {
          label: `Edit Expected Output Format / JSON Schema`,
          action: openExpectedOutputDrawer,
          icon: <SchemaIcon fontSize="small" />,
          color: expectedOutputFormat.length > 50 ? 'primary' : 'secondary', 
          disabled: isLoading,
          iconOnly: true,
        },
    ];

    // 3. Context Actions (Bottom Left)
    const contextActions: GlobalAction[] = [
        // ADDED: View All Saved Plans (ListAltIcon) moved here
        {
          label: "View All Saved Plans",
          action: openPlannerListDrawer,
          icon: <ListAltIcon fontSize="small" />,
          color: 'primary',
          disabled: isLoading,
          iconOnly: true,
        },
        {
          label: `Set Project Root Directory (${truncatePathDisplay(projectRoot)})`,
          action: openProjectRootPicker,
          icon: <FolderOpenIcon fontSize="small" />,
          color: 'secondary',
          disabled: isLoading,
          iconOnly: true,
        },
        {
          label: `Manage AI Scan Paths (${scanPathsInput.split(',').filter(Boolean).length} included)`,
          action: openScanPathsDrawer,
          icon: <AddRoadIcon fontSize="small" />,
          color: 'secondary',
          disabled: isLoading,
          iconOnly: true,
        },
        {
          label: "Upload Context File (Image/Text)",
          action: () => fileInputRef.current?.click(),
          icon: <UploadFileIcon fontSize="small" />,
          color: 'secondary',
          disabled: isLoading || !!selectedFile,
          iconOnly: true,
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
        cornerGroups['bottom-left'] = [{ actionGroup: contextActions, key: 'context' }]; 
    }
    
    return cornerGroups;


  }, [
    isLoading,
    error,
    plan,
    userPrompt,
    projectRoot,
    scanPathsInput,
    additionalInstructions,
    expectedOutputFormat,
    selectedFile,
    openErrorDetailsDrawer,
    handleClearPlan,
    handleGeneratePlan,
    handleClick,
    handlePromptGenerate,
    openAiInstructionDrawer,
    openExpectedOutputDrawer,
    openPlannerListDrawer,
    openProjectRootPicker,
    openScanPathsDrawer,
    fileInputRef,
    
    // Note: truncatePathDisplay and other utilities/constants are assumed stable.
  ]);

  return (
    <Card sx={cardSx} className="flex-shrink-0 py-1 rounded-xl shadow-lg border border-solid border-gray-700/20  backdrop-blur-md">
      <CardContent sx={formSectionSx} className="flex flex-col">

        

        <Box>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isLoading}
            />
            <Box className="flex items-center gap-1 flex-shrink-0 min-w-0 mb-1">
                    
                    <Tooltip title={<MarkdownRenderer content={PROJECT_ROOT_TOOLTIP_DOCS}  />} arrow
                        placement="right">
                        <IconButton size="small" color="info" aria-label="project root documentation">
                            <DescriptionIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={projectRoot} arrow placement="top">
                        <Typography variant="caption" className="font-mono font-semibold text-text-primary truncate max-w-[180px] sm:max-w-sm">
                            {truncatePathDisplay(projectRoot)}
                        </Typography>
                    </Tooltip>
                    
                </Box>
            <FloatingIconTextField
              label="Enter your prompt"
              multiline
              rows={3}
              fullWidth
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={isLoading}
              floatingActionGroupsByCorner={floatingActionGroupsByCorner} 
              sx={{
                backgroundColor:'background.paper',
                '& .MuiInputBase-multiline': { 
                  padding: '40px 20px 40px 20px !important'
                },
            }}
            />
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
            >
              {REVISION_TONES.map((tone) => (
                <MenuItem key={tone.value} onClick={() => handleMenuItemClick(tone)} className="gap-2">
                  {tone.icon}
                  {tone.label}
                </MenuItem>
              ))}

            </Menu>
            <Stack 
                direction="row" 
                spacing={2} 
                alignItems="center" 
                className="mt-3 text-sm text-text-secondary" 
                flexWrap="wrap"
            >

                
                
                {/* 2. Attached File Status */}
                {selectedFile && (
                    <Stack direction="row" spacing={1} alignItems="center" className="max-w-sm">
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

                {/* 3. Hidden AI Config status feedback for UX consistency */}
                <Box className="mt-1 text-xs text-text-secondary flex gap-2 ml-auto">
                    <Typography variant="caption">
                        AI Instructions: <span className={`font-mono font-bold ${additionalInstructions.length > 50 ? 'text-primary-main' : 'text-text-secondary'}`}>{additionalInstructions.length > 50 ? 'Custom' : 'Default'}</span>
                    </Typography>
                    <Typography variant="caption">
                        Output Format: <span className={`font-mono font-bold ${expectedOutputFormat.length > 50 ? 'text-primary-main' : 'text-text-secondary'}`}>{expectedOutputFormat.length > 50 ? 'Schema' : 'Default'}</span>
                    </Typography>
                </Box>
            </Stack>
        </Box>

      </CardContent>
    </Card>
  );
};
