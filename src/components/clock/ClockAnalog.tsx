import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';
import { ClockConfig } from './types';
import { useLiveClock } from './hooks/useLiveClock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface ClockAnalogProps {
  config: ClockConfig;
  isConfigPreview?: boolean;
  fontSize?: number; // Optional font size override
  sx?: SxProps<Theme>; // Optional MUI sx prop
}

const AnalogClockContainerSx = (isConfigPreview: boolean): SxProps => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: 0.5,
  lineHeight: 1.1,
  flexShrink: 0,
  ...(isConfigPreview ? {} : { borderLeft: '1px solid', borderColor: 'divider' }),
});

const TimeDisplaySx: SxProps = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: 0.5,
};

const ClockAnalog: React.FC<ClockAnalogProps> = ({ config, isConfigPreview = false, fontSize, sx }) => {
  const { time, date } = useLiveClock(config); // hook now DST-aware

  const appliedFontSize = fontSize ?? (isConfigPreview ? 12 : 16);

  return (
    <Box sx={{ ...AnalogClockContainerSx(isConfigPreview), ...sx }}>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 'bold', fontSize: appliedFontSize * 0.7 }}
        noWrap
      >
        {config.label}
      </Typography>
      <Box sx={TimeDisplaySx}>
        <AccessTimeIcon fontSize="small" sx={{ color: 'text.primary' }} />
        <Typography
          variant="subtitle1"
          fontWeight="medium"
          sx={{ fontFamily: 'serif', fontSize: appliedFontSize }}
          noWrap
        >
          {time}
        </Typography>
      </Box>
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', fontSize: appliedFontSize * 0.6 }}
        noWrap
      >
        {date}
      </Typography>
    </Box>
  );
};

export default ClockAnalog;
