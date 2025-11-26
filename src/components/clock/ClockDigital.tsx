import React, { useEffect, useState } from 'react';
import { ClockConfig } from './types';
import { SxProps, Theme, Box } from '@mui/material';

interface ClockDigitalProps {
  config?: ClockConfig; // Optional
  isConfigPreview?: boolean; // Optional small preview
  fontSize?: number; // Optional font size override
  sx?: SxProps<Theme>; // Optional MUI sx prop for styling
}

const ClockDigital: React.FC<ClockDigitalProps> = ({ config, isConfigPreview = false, fontSize, sx }) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    if (!config) return;

    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: !config.format24Hr,
        timeZone: config.timezone,
      };
      setTimeStr(new Intl.DateTimeFormat('en-US', options).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [config?.timezone, config?.format24Hr]);

  const appliedFontSize = fontSize ?? (isConfigPreview ? 14 : 24);

  return (
    <Box
      component="span"
      sx={{
        fontSize: appliedFontSize,
        fontFamily: 'monospace',
        ...sx,
      }}
    >
      {config ? timeStr : '--:--:--'}
    </Box>
  );
};

export default ClockDigital;
