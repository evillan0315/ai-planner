import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { clockConfigsStore } from '@/stores/clockStore';
import { Box, IconButton, Tooltip, useTheme, SxProps } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

import ClockDigital from './ClockDigital';
import ClockAnalog from './ClockAnalog';
import ClockConfigDialog from './ClockConfigDialog';
import { ClockConfig } from './types';

interface LiveClockProps {
  footer?: boolean;
  sx?: SxProps; // Added sx prop
}

const LiveClock: React.FC<LiveClockProps> = ({ footer = false, sx }) => {
  const clockConfigs = useStore(clockConfigsStore);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const theme = useTheme();

  const handleOpenConfig = () => setIsConfigOpen(true);
  const handleCloseConfig = () => setIsConfigOpen(false);

  const defaultSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    gap: footer ? 0.5 : 1,
    flexShrink: 0,
    height: footer ? '30px' : '100%',
  };

  const renderClock = (config?: ClockConfig) => {
    if (!config) {
      return (
        <Box
          key="undefined-clock"
          sx={{
            fontFamily: 'monospace',
            fontSize: footer ? 12 : 16,
            color: theme.palette.text.disabled,
          }}
        >
          --:--:--
        </Box>
      );
    }

    const key = config.id;
    if (config.displayType === 'digital') {
      return <ClockDigital key={key} config={config} isConfigPreview={false} fontSize={footer ? 12 : undefined} />;
    }
    return <ClockAnalog key={key} config={config} isConfigPreview={false} size={footer ? 20 : undefined} />;
  };

  return (
    <Box sx={{ ...defaultSx, ...sx }} className={footer ? 'h-[30px]' : 'h-full'}>
      {clockConfigs.map(renderClock)}

      {!footer && (
        <Tooltip title="Configure Clocks/Timezones">
          <IconButton
            onClick={handleOpenConfig}
            color="inherit"
            size="small"
            aria-label="configure clock"
            sx={{ ml: 1, color: theme.palette.text.secondary }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <ClockConfigDialog open={isConfigOpen} onClose={handleCloseConfig} maxWidth="lg" />
    </Box>
  );
};

export default LiveClock;
