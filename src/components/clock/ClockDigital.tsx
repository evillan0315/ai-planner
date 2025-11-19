import React from 'react';
import { Box, Typography, SxProps } from '@mui/material';
import { ClockConfig } from './types';
import { useLiveClock } from '@/hooks/useLiveClock';

interface ClockDigitalProps {
  config: ClockConfig;
}

const DigitalClockContainerSx: SxProps = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: 0.5,
  lineHeight: 1.2,
};

const ClockDigital: React.FC<ClockDigitalProps> = ({ config }) => {
  const { time } = useLiveClock(config);

  return (
    <Box sx={DigitalClockContainerSx} className="text-right flex-shrink-0 min-w-28">
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