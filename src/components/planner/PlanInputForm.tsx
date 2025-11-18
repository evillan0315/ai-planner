import React from 'react';
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

import type { IPlan } from './types'; // Import necessary types

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

const generateButtonSx = {
  marginTop: 2,
  marginBottom: 2,
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

        {/* User Prompt Section - Always expanded by default */}
        <Accordion defaultExpanded className="rounded-lg shadow-sm border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md mb-4">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="user-prompt-content" id="user-prompt-header">
            <Typography variant="subtitle1" className="font-semibold">User Prompt</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              label="Enter your prompt for the AI"
              multiline
              rows={6}
              fullWidth
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              variant="outlined"
              disabled={isLoading}
            />
          </AccordionDetails>
        </Accordion>

        {/* Project Context Section */}
        <Accordion className="rounded-lg shadow-sm border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md mb-4">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="project-context-content" id="project-context-header">
            <Typography variant="subtitle1" className="font-semibold">Project Context</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" className="mb-2">
              <TextField label="Project Root" value={projectRoot} disabled fullWidth size="small" />
              <Tooltip title="Select Project Root Directory">
                <IconButton
                  color="primary"
                  onClick={openProjectRootPicker}
                  aria-label="select project root directory"
                  disabled={isLoading}
                >
                  <FolderOpenIcon />
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" className="mb-2">
              <TextField
                label="Scan Paths (comma-separated)"
                value={scanPathsInput}
                disabled
                fullWidth
                size="small"
                placeholder="e.g., src, public, package.json"
              />
              <Tooltip title="Manage AI Scan Paths">
                <IconButton
                  color="primary"
                  onClick={openScanPathsDrawer}
                  aria-label="manage ai scan paths"
                  disabled={isLoading}
                >
                  <AddRoadIcon />
                </IconButton>
              </Tooltip>
            </Stack>
            {/* Multimodal File Upload */}
            <Stack direction="row" spacing={1} alignItems="center" className="mt-2">
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                size="small"
              >
                Upload Context File
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isLoading}
              />
              {selectedFile && (
                <Chip
                  label={`File: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`}
                  onDelete={handleClearFile}
                  color="info"
                  size="small"
                  sx={{ color: theme.palette.text.primary, borderColor: theme.palette.info.main }}
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* AI Configuration Section */}
        <Accordion className="rounded-lg shadow-sm border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md mb-4">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="ai-config-content" id="ai-config-header">
            <Typography variant="subtitle1" className="font-semibold">AI Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} className="mb-2">
              <Button
                variant="outlined"
                startIcon={<DescriptionIcon />}
                onClick={openAiInstructionDrawer}
                disabled={isLoading}
                fullWidth
                size="small"
              >
                Edit AI Instructions
              </Button>
              <Button
                variant="outlined"
                startIcon={<SchemaIcon />}
                onClick={openExpectedOutputDrawer}
                disabled={isLoading}
                fullWidth
                size="small"
              >
                Edit Expected Output Format
              </Button>
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
          <Box className="flex gap-2">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClearPlan}
              disabled={isLoading && !plan} 
            >
              Clear Plan
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGeneratePlan}
              disabled={isLoading || !userPrompt.trim() || !projectRoot.trim()}
              startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
              sx={generateButtonSx}
            >
              {isLoading ? 'Generating Plan...' : 'Generate Plan'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
