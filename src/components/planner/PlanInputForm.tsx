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
} from '@mui/material';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import DescriptionIcon from '@mui/icons-material/Description';
import SchemaIcon from '@mui/icons-material/Schema';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BugReportIcon from '@mui/icons-material/BugReport';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloseIcon from '@mui/icons-material/Close';

import type { IFileChange, IPlan } from './types'; // Import necessary types

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

const styles = {
  card: {
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
  },
  formSection: {
    padding: 3,
  },
  generateButton: {
    marginTop: 2,
    marginBottom: 2,
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 1,
    mt: 2,
    justifyContent: 'flex-end',
  },
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
    <Card sx={styles.card} className="mb-6 flex-shrink-0">
      <CardContent sx={styles.formSection}>
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
        <TextField
          label="Enter your prompt for the AI"
          multiline
          rows={6}
          fullWidth
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          variant="outlined"
          disabled={isLoading}
          sx={{ mb: 2 }}
        />

        {/* Project Context Section */}
        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography variant="subtitle1" className="font-semibold mb-2">
            Project Context
          </Typography>
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
        </Box>

        {/* AI Configuration Section */}
        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography variant="subtitle1" className="font-semibold mb-2">
            AI Configuration
          </Typography>
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
        </Box>

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
              disabled={isLoading && !plan} // 'plan' might not be defined in this scope if moved. Check context.
            >
              Clear Plan
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGeneratePlan}
              disabled={isLoading || !userPrompt.trim() || !projectRoot.trim()}
              startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
              sx={styles.generateButton}
            >
              {isLoading ? 'Generating Plan...' : 'Generate Plan'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
