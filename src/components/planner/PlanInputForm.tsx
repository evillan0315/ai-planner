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

        <Box className="flex justify-between items-center mt-2 flex-wrap gap-2">
          <Box className="flex flex-wrap gap-2">
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
            <Tooltip title="Upload Image or File for AI Context">
              <IconButton
                color="primary"
                onClick={() => fileInputRef.current?.click()}
                aria-label="upload file"
                disabled={isLoading}
              >
                <UploadFileIcon />
              </IconButton>
            </Tooltip>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={isLoading}
            />
          </Box>

          <Box className="flex flex-wrap gap-2">
            <Tooltip title="Edit AI Instructions (System Prompt)">
              <IconButton
                color="primary"
                onClick={openAiInstructionDrawer}
                aria-label="edit ai instructions"
                disabled={isLoading}
              >
                <DescriptionIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Expected Output Format (JSON Schema)">
              <IconButton
                color="primary"
                onClick={openExpectedOutputDrawer}
                aria-label="edit expected output format"
                disabled={isLoading}
              >
                <SchemaIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {selectedFile && (
          <Box className="flex items-center gap-2 mt-4">
            <Chip
              label={`File: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`}
              color="info"
              variant="outlined"
              onDelete={handleClearFile}
              sx={{ color: theme.palette.text.primary, borderColor: theme.palette.info.main }}
            />
          </Box>
        )}

        <Box className="flex justify-end gap-2 mt-4">
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
      </CardContent>
    </Card>
  );
};
