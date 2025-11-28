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
import DescriptionIcon from '@mui/icons-material/Description';
import SchemaIcon from '@mui/icons-material/Schema';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BugReportIcon from '@mui/icons-material/BugReport';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SettingsIcon from '@mui/icons-material/Settings'; 
import SendIcon from '@mui/icons-material/Send'; 
import NoteAddIcon from '@mui/icons-material/NoteAdd'; 
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; 
import StyleIcon from '@mui/icons-material/Style'; 

import type { IPlan } from './types'; 
import  { PROJECT_ROOT_TOOLTIP_DOCS } from './constants/documentation'; 
import FloatingIconTextField from '@/components/ui/FloatingIconTextField'; 
import  GlobalActionButton, {  type GlobalAction } from '@/components/ui/GlobalActionButton'; 
import type { GlobalActionGroup } from '@/components/ui/GlobalActioButtonGroup'; 
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';
import { REVISION_TONES } from './constants/tones';

import { truncatePathDisplay } from './utils/index';

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
  openSystemConfig: () => void;
  openExpectedOutputDrawer: () => void;
  openErrorDetailsDrawer: () => void;
  plan: IPlan | null;
  revisionTone: string | '';
}

const formSectionSx = {
  // Define your styles here if needed
      px:2,
      py:0.5,
      margin:0
};

export const PlanInputForm: React.FC<PlanInputFormProps> = React.memo(function PlanInputForm({
  userPrompt,
  setUserPrompt,
  projectRoot,
  scanPathsInput,
  additionalInstructions,
  expectedOutputFormat,
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
  openSystemConfig,
  openExpectedOutputDrawer,
  openErrorDetailsDrawer,
  plan,
}) {
  const theme = useTheme();
  
  const cardSx = useMemo(() => ({
    backgroundColor: theme.palette.background.default,
    //border: `1px solid ${theme.palette.divider}`,
  }), [theme.palette.background.paper, theme.palette.divider]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMenuItemClick = useCallback((tone: { value: string, label: string, icon: JSX.Element }) => {
    handleRevisionTone(tone.value);
    handleClose();
  }, [handleRevisionTone, handleClose]);
  const mainActions: GlobalAction[] = [
        {
          label: "Generate Plan",
          action: handleGeneratePlan,
          icon: isLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />,
          color: 'primary',
          disabled: isLoading || !userPrompt.trim() || !projectRoot.trim(),
          iconOnly: false,
          variant: 'outlined'
        }
    
  ];
  const floatingActionGroupsByCorner: Partial<Record<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', GlobalActionGroup[]>> = useMemo(() => {
      
    const errorDetailsAction: GlobalAction[] = [{
        label: "View Error Details",
        action: openErrorDetailsDrawer,
        icon: <BugReportIcon fontSize="small" />,
        color: 'error',
        disabled: isLoading,
        iconOnly: true,
    }];
    
    const primaryActions: GlobalAction[] = [
        ...errorDetailsAction,
        {
          label: "New Plan (Clear existing content)",
          action: handleClearPlan,
          icon: <NoteAddIcon fontSize="small" color="inherit" />,
          color: 'secondary',
          disabled: isLoading && !plan,
          iconOnly: true,
        },
    
    ];

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
          label: "System Configuration",
          action: openSystemConfig,
          icon: <SettingsIcon fontSize="small" />,
          color: 'success', 
          disabled: isLoading,
          iconOnly: true,
        },
    ];

    const contextActions: GlobalAction[] = [
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
    plan,
    userPrompt,
    projectRoot,
    scanPathsInput,
    additionalInstructions,
    expectedOutputFormat,
    selectedFile,
    handleClick, 
    openErrorDetailsDrawer,
    handleClearPlan,
    handleGeneratePlan,
    handlePromptGenerate,
    openSystemConfig,
    openExpectedOutputDrawer,
    openPlannerListDrawer,
    openProjectRootPicker,
    openScanPathsDrawer,
    fileInputRef,
  ]);

  return (
    <Card elevation={2} sx={cardSx} className="flex-shrink-0 shadow-xl">
      <CardContent sx={formSectionSx} className="flex flex-col">
        <Box>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isLoading}
            />
            <Box className="flex items-center gap-1 flex-shrink-0 min-w-0">
                    
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
              rows={1}
              fullWidth
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={isLoading}
              floatingActionGroupsByCorner={floatingActionGroupsByCorner} 
              sx={{
                backgroundColor:'background.default',
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
                spacing={1} 
                alignItems="center" 
                className="mt-2 text-sm text-text-secondary justify-between" 
                flexWrap="wrap"
            >

               <Box className="text-xs flex flex-col gap-2">

                <Box className="text-xs text-text-secondary flex gap-2 ml-auto">
                    <Typography variant="caption">
                        AI Instructions: <span className={`font-mono font-bold ${additionalInstructions.length > 50 ? 'text-primary-main' : 'text-text-secondary'}`}>{additionalInstructions.length > 50 ? 'Custom' : 'Default'}</span>
                    </Typography>
                    <Typography variant="caption">
                        Output Format: <span className={`font-mono font-bold ${expectedOutputFormat.length > 50 ? 'text-primary-main' : 'text-text-secondary'}`}>{expectedOutputFormat.length > 50 ? 'Schema' : 'Default'}</span>
                    </Typography>
                   
                </Box>
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
                </Box>
                <Box className="text-xs flex gap-2 mr-auto">
                 <GlobalActionButton 
                        globalActions={mainActions} 
                    />
                 </Box>
            </Stack>
        </Box>

      </CardContent>
    </Card>
  );
});
