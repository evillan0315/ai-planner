import React from 'react';
import { Box, Typography, SxProps } from '@mui/material';
import { ClockConfig } from './types';
import { useLiveClock } from './hooks/useLiveClock';

interface ClockDigitalProps {
  config: ClockConfig;
  isConfigPreview?: boolean; // NEW PROP
}

const DigitalClockContainerSx = (isConfigPreview: boolean): SxProps => ({
  display: 'flex',
  flexDirection: 'column',
  // Align items center for footer, flex-start for compact list preview
  alignItems: isConfigPreview ? 'flex-start' : 'center', 
  padding: 0.5,
  lineHeight: 1.2,
});

const ClockDigital: React.FC<ClockDigitalProps> = ({ config, isConfigPreview = false }) => {
  const { time } = useLiveClock(config);

  return (
    // Adjusting class names based on alignment in flex column. 'text-right' is used for footer display.
    <Box sx={DigitalClockContainerSx(isConfigPreview)} className={`flex items-center min-w-28 ${isConfigPreview ? '' : 'text-right'}`}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
        {config.label}
      </Typography>
      <Typography variant="body1" fontWeight="bold" sx={{ fontFamily: 'monospace, sans-serif' }} noWrap>
        {time}
      </Typography>
    </Box>
  );
};

export default ClockDigital;