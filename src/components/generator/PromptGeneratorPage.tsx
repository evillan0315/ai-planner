import React from 'react';
import { Box, Typography } from '@mui/material';
import PromptGeneratorForm from './PromptGeneratorForm';
import PromptGeneratorDisplay from './PromptGeneratorDisplay';
/**
 * The main page component for the LLM Prompt Generator.
 * Orchestrates the input form and the display of the generated prompt and schema.
 */
const PromptGeneratorPage: React.FC = () => {
  return (
    <Box className="flex flex-col h-full overflow-hidden p-4 sm:p-6 lg:p-8">
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="text-secondary-main font-bold mb-6"
      >
        LLM Prompt Generator
      </Typography>
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden">
        <Box className="flex flex-col overflow-y-auto pr-2">
          <PromptGeneratorForm />
        </Box>
        <Box className="flex flex-col overflow-y-auto pl-2">
          <PromptGeneratorDisplay />
        </Box>
      </Box>
    </Box>
  );
};
export default PromptGeneratorPage;
