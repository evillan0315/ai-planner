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

import type { IPlan } from './types'; 
import  { PROJECT_ROOT_TOOLTIP_DOCS } from './constants/documentation'; 
import FloatingIconTextField from '@/components/ui/FloatingIconTextField'; 
import type { GlobalAction } from '@/components/ui/GlobalActionButton'; 
import type { GlobalActionGroup } from '@/components/ui/GlobalActioButtonGroup'; 

/**
 * Truncates a file path to show start/end segments for display.
 * @param filePath The full file path.
 * @param maxLength Maximum allowed length before truncation.
 */
const truncatePathDisplay = (filePath: string, maxLength = 60): string => {
    if (!filePath || filePath.length <= maxLength) return filePath;

    const parts = filePath.split(/[/\\]/);
    const fileName = parts[parts.length - 1];
    
    // Reserve space for filename and ellipsis/separator
    const remainingSpace = maxLength - fileName.length - 3; // -3 for '.../'

    if (remainingSpace <= 0) {
        return `...${fileName.slice(-maxLength + 3)}`;
    }
    
    const start = filePath.slice(0, remainingSpace);
    const lastSeparatorIndex = Math.max(start.lastIndexOf('/'), start.lastIndexOf('\\'));
    const finalStart = lastSeparatorIndex > 0 ? start.slice(0, lastSeparatorIndex) : start;
    
    return `${finalStart}/.../${fileName}`;
};

// --- End new content constants and helpers ---


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
      
    // Action 0: Error Details (BugReportIcon) - conditionally added to Primary Actions
    const errorDetailsAction: GlobalAction[] = error ? [{
        label: "View Error Details",
        action: openErrorDetailsDrawer,
        icon: <BugReportIcon fontSize="small" />,
        color: 'error',
        disabled: isLoading,
    }] : [];
      
    // 1. Primary Actions (Bottom Right)
    const primaryActions: GlobalAction[] = [
        
        // ADDED: Error details icon moved here
        ...errorDetailsAction,
        
        {          label: "New Plan (Clear existing content)",
          action: handleClearPlan,
          icon: <NoteAddIcon fontSize="small" color="inherit" />,
          color: 'secondary',
          disabled: isLoading && !plan,
        },
        {          label: "Generate Plan",
          action: handleGeneratePlan,
          icon: isLoading ? <CircularProgress size={16} color="inherit" /> : <RocketLaunchIcon fontSize="small" />,
          color: 'success',
          disabled: isLoading || !userPrompt.trim() || !projectRoot.trim(),
        },
    ];
    
    // 2. Model Settings Actions (Top Right)
    const modelSettingsActions: GlobalAction[] = [
        {          
          label: "Edit AI Instructions / System Prompt",
          action: openAiInstructionDrawer,
          icon: <SettingsIcon fontSize="small" />,
          color: additionalInstructions.length > 50 ? 'primary' : 'secondary', // Highlight if custom instructions exist
          disabled: isLoading,
        },
        {          
          label: `Edit Expected Output Format / JSON Schema`,
          action: openExpectedOutputDrawer,
          icon: <SchemaIcon fontSize="small" />,
          color: expectedOutputFormat.length > 50 ? 'primary' : 'secondary', // Highlight if custom schema exists
          disabled: isLoading,
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
        },
        {          
          label: `Set Project Root Directory (${truncatePathDisplay(projectRoot)})`,
          action: openProjectRootPicker,
          icon: <FolderOpenIcon fontSize="small" />,
          color: 'secondary',
          disabled: isLoading,
        },
        {          
          label: `Manage AI Scan Paths (${scanPathsInput.split(',').filter(Boolean).length} included)`,
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
    openPlannerListDrawer, // New dependency
    openErrorDetailsDrawer, // New dependency
    userPrompt,
    plan,
    additionalInstructions, 
    expectedOutputFormat, 
    error, // New dependency
  ]);

  return (
    <Card sx={cardSx} className="mb-6 flex-shrink-0">
      <CardContent sx={formSectionSx} className="flex flex-col p-2">
        {/* Header Area: Removed BugReportIcon, now managed as a floating action */}
        <Box className="flex items-center justify-between mb-1">
          <Typography variant="h6" gutterBottom className="text-text-primary mb-0">
            Generate a New Plan
          </Typography>
        </Box>

        <Box className="mb-4">

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isLoading}
            />
            <Box className="flex items-center gap-1 flex-shrink-0 min-w-0 mb-1">
                    <Tooltip 
                        title={
                            <Box sx={{ whiteSpace: 'pre-wrap', p: 1, maxWidth: 350 }}>
                                <Typography variant="caption" fontWeight="bold">Project Root Documentation</Typography>
                                <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem' }}>
                                    {PROJECT_ROOT_TOOLTIP_DOCS}
                                </Typography>
                            </Box>
                        }
                        arrow
                        placement="right"
                    >
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
              rows={2} // Default visible rows
              fullWidth
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={isLoading}
              floatingActionGroupsByCorner={floatingActionGroupsByCorner} 
              sx={{backgroundColor:'background.paper'}}
            />
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
                <Box className="mt-0 text-xs text-text-secondary flex gap-4 ml-auto">
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
