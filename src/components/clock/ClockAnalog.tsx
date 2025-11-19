import React from 'react';
import { Box, Typography, SxProps } from '@mui/material';
import { ClockConfig } from './types';
import { useLiveClock } from '@/hooks/useLiveClock';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // Icon for visual flair

interface ClockAnalogProps {
  config: ClockConfig;
}

const AnalogClockContainerSx: SxProps = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: 0.5,
  lineHeight: 1.1,
  // Add visual separation from other clocks
  borderLeft: '1px solid',
  borderColor: 'divider',
};

const TimeDisplaySx: SxProps = { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 0.5,
};

const ClockAnalog: React.FC<ClockAnalogProps> = ({ config }) => {
  // Pass 'analog' override to ensure 12-hour format is used regardless of stored config preference (for demonstration)
  const { time, date } = useLiveClock(config, 'analog'); 

  return (
    <Box sx={AnalogClockContainerSx} className="flex-shrink-0 pl-3 min-w-40">
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }} noWrap>
        {config.label}
      </Typography>
      <Box sx={TimeDisplaySx}>
        <AccessTimeIcon fontSize="small" sx={{ color: 'text.primary' }} />
        <Typography variant="subtitle1" fontWeight="medium" sx={{ fontFamily: 'serif' }} noWrap>
          {time}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
        {date}
      </Typography>
    </Box>
  );
};

export default ClockAnalog;