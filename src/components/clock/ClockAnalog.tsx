import React from 'react';
import { Box, Typography, SxProps } from '@mui/material';
import { ClockConfig } from './types';
import { useLiveClock } from './hooks/useLiveClock';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // Icon for visual flair

interface ClockAnalogProps {
  config: ClockConfig;
  isConfigPreview?: boolean; // NEW PROP
}

const AnalogClockContainerSx = (isConfigPreview: boolean): SxProps => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: 0.5, // MUI spacing 0.5 = 4px padding top/bottom/right (when used with inline flex)
  lineHeight: 1.1,
  flexShrink: 0,
  // Add visual separation from other clocks only when NOT in config preview
  ...(isConfigPreview ? {} : {
      borderLeft: '1px solid',
      borderColor: 'divider',
  }),
});

const TimeDisplaySx: SxProps = { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 0.5,
};

const ClockAnalog: React.FC<ClockAnalogProps> = ({ config, isConfigPreview = false }) => {
  // Pass 'analog' override to ensure 12-hour format is used regardless of stored config preference (for demonstration)
  const { time, date } = useLiveClock(config, 'analog'); 

  // Preserve existing `pl-3` (p-left: 0.75rem / 12px) if it's not a preview, as it relies on this spacing when border is active.
  const className = `flex-shrink-0 min-w-40 ${isConfigPreview ? '' : 'pl-3'}`;

  return (
    <Box sx={AnalogClockContainerSx(isConfigPreview)} className={className}>
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