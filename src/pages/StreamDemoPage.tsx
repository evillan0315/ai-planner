import React from 'react';
import { Box, Typography } from '@mui/material';
import StreamDemo from '@/components/gemini/StreamDemo';

/**
 * Page wrapper for the Gemini Streaming Demo component.
 */
const StreamDemoPage: React.FC = () => {
  return (
    <Box className="h-full w-full p-4 sm:p-6 lg:p-8">
      <StreamDemo />
    </Box>
  );
};

export default StreamDemoPage;
