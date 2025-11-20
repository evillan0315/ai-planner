import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { clockConfigsStore } from '@/stores/clockStore';
import { Box, IconButton, Tooltip, useTheme } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

import ClockDigital from './ClockDigital';
import ClockAnalog from './ClockAnalog';
import ClockConfigDialog from './ClockConfigDialog';
import { ClockConfig } from './types';

const LiveClockContainerSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    flexShrink: 0,
    height: '100%',
};

/**
 * Main component to display multiple configured clocks and handle the configuration dialog.
 */
const LiveClock: React.FC = () => {
  const clockConfigs = useStore(clockConfigsStore);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const theme = useTheme();

  const handleOpenConfig = () => setIsConfigOpen(true);
  const handleCloseConfig = () => setIsConfigOpen(false);

  const renderClock = (config: ClockConfig) => {
    const key = config.id;
    if (config.displayType === 'digital') {
      return <ClockDigital key={key} config={config} />;
    }
    return <ClockAnalog key={key} config={config} />;
  };

  return (
    <Box sx={LiveClockContainerSx} className="h-full">
      
      {/* Render Clocks */}
      {clockConfigs.map(renderClock)}
      
      {/* Configuration Button */}
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

      {/* Configuration Dialog */}
      <ClockConfigDialog open={isConfigOpen} onClose={handleCloseConfig} maxWidth="lg"/>
    </Box>
  );
};

export default LiveClock;