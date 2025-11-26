import React from 'react';
import { Box, Typography, useTheme, SxProps, IconButton, Tooltip } from '@mui/material';
import LiveClock from '@/components/clock/LiveClock';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useStore } from '@nanostores/react';
import { isTerminalVisible, toggleTerminal } from '@/stores/uiStore';
import TerminalIcon from '@mui/icons-material/Terminal';

const footerContentSx: SxProps = {
  height: '100%',
  width: '100%',
  px: 2,
};

/**
 * Global application footer displaying status, clock, and theme toggle.
 * Expected to be wrapped by a container defining a fixed height (38px).
 */
const Footer: React.FC = () => {
  const theme = useTheme();
  const showTerminal = useStore(isTerminalVisible);

  return (
    <Box 
      className="flex justify-between items-center"
      sx={footerContentSx}
    >
      {/* Left Status Area */}
      <Box className="flex items-center gap-2">
        <LiveClock 
          footer 
          sx={{ fontSize: '1rem' }} // Smaller font size
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          AI Planner v1.0.0
        </Typography>
      </Box>

      {/* Center Status Area */}
      <Box className="flex-grow flex items-center gap-4 px-4">
        {/* Future Status Indicators */}
      </Box>
      
      {/* Right Status Area */}
      <Box className="flex items-center gap-2">
        <Tooltip title={showTerminal ? 'Hide Terminal' : 'Show Terminal'}>
          <IconButton 
            size="small" 
            onClick={toggleTerminal}
            color={showTerminal ? 'primary' : 'inherit'} 
          >
            <TerminalIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <ThemeToggle />
      </Box>
    </Box>
  );
};

export default Footer;
