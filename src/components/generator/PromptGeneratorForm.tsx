import React from 'react';
import { Box, Button, CircularProgress, Alert, Stack, Typography, Card, CardContent } from '@mui/material';
import FloatingIconTextField from '@/components/ui/FloatingIconTextField';
import { useStore } from '@nanostores/react';
import { promptGeneratorStore, setInput, generatePromptOutput, resetGenerator, clearError } from './stores/promptGeneratorStore';

import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import SchemaIcon from '@mui/icons-material/Schema';

/**
 * React component for the LLM Prompt Generator input form.
 * Allows users to define various aspects of an LLM prompt.
 */
const PromptGeneratorForm: React.FC = () => {
  const { inputs, isLoading, error } = useStore(promptGeneratorStore);

  const handleGenerateClick = () => {
    clearError(); // Clear previous errors before generating
    generatePromptOutput();
  };

  const handleResetClick = () => {
    resetGenerator();
    clearError();
  };

  return (
    <Card className="mb-6 flex-shrink-0 rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md">
      <CardContent className="flex flex-col p-6">
        <Typography variant="h5" component="h2" gutterBottom className="text-primary-main font-bold mb-4">
          Define Your LLM Prompt
        </Typography>

        {error && (
          <Alert severity="error" className="mb-4" onClose={clearError}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          <FloatingIconTextField
            label="Role / Persona"
            multiline
            rows={2}
            fullWidth
            value={inputs.rolePersona}
            onChange={(e) => setInput('rolePersona', e.target.value)}
            disabled={isLoading}
            placeholder="e.g., You are an expert TypeScript developer."
          />
          <FloatingIconTextField
            label="Task / Goal"
            multiline
            rows={3}
            fullWidth
            value={inputs.taskGoal}
            onChange={(e) => setInput('taskGoal', e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Generate a React functional component for user profiles."
          />
          <FloatingIconTextField
            label="Context / Input Data"
            multiline
            rows={4}
            fullWidth
            value={inputs.contextInputData}
            onChange={(e) => setInput('contextInputData', e.target.value)}
            disabled={isLoading}
            placeholder="e.g., The user profile should display name, email, and a profile picture."
          />
          <FloatingIconTextField
            label="Format / Output Constraints"
            multiline
            rows={3}
            fullWidth
            value={inputs.formatOutputConstraints}
            onChange={(e) => setInput('formatOutputConstraints', e.target.value)}
            disabled={isLoading}
            placeholder="e.g., The output should be a single JSON object with `fileName` and `content` fields."
          />
          <FloatingIconTextField
            label="Negative Constraints"
            multiline
            rows={2}
            fullWidth
            value={inputs.negativeConstraints}
            onChange={(e) => setInput('negativeConstraints', e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Do not use `any` types. Do not include a header comment."
          />
          <FloatingIconTextField
            label="Example (Optional)"
            multiline
            rows={5}
            fullWidth
            value={inputs.example}
            onChange={(e) => setInput('example', e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Input: (React component code), Output: (Component test suite)"
          />
          <FloatingIconTextField
            label="Expected JSON Schema Output"
            multiline
            rows={8}
            fullWidth
            value={inputs.expectedOutputSchema}
            onChange={(e) => setInput('expectedOutputSchema', e.target.value)}
            disabled={isLoading}
            placeholder={JSON.stringify({
              type: 'object',
              properties: { /* ... */ },
              required: [/* ... */],
            }, null, 2)}
            icon={<SchemaIcon />}
            onIconClick={() => {
              // Optional: Add a button action here, e.g., open a schema validation helper
              console.log('Schema icon clicked!');
            }}
          />
        </Stack>

        <Box className="flex justify-end gap-2 mt-6">
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleResetClick}
            disabled={isLoading}
            startIcon={<RefreshIcon />}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateClick}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          >
            {isLoading ? 'Generating...' : 'Generate Prompt'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PromptGeneratorForm;