import React from 'react';
import { Box, Typography, useTheme, SxProps, IconButton, Tooltip } from '@mui/material';
import LiveClock from '@/components/clock/LiveClock';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useStore } from '@nanostores/react';
import { isTerminalVisible, toggleTerminal } from '@/stores/uiStore';
import TerminalIcon from '@mui/icons-material/Terminal';

// ---------------------------
// 1. Interfaces & Types
// ---------------------------

// No specific props required for a generic application footer

// ---------------------------
// 2. SX Prop Definitions
// ---------------------------

const footerContentSx: SxProps = {
  // Use relative height/width since the parent Paper in AppLayout enforces 38px height
  height: '100%', 
  width: '100%',
  px: 2,
};

// ---------------------------
// 3. Component Implementation
// ---------------------------

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
        <Typography variant="caption" color="text.secondary">
        <LiveClock />
            AI Planner v1.0.0
        </Typography>
        {/* Left Status Area - currently unused, can add editor status later */}
        <Box className="flex-grow flex items-center gap-4 px-4">
            {/* Future Status Indicators */}
        </Box>
        
        {/* Right Status Area */}
        <Box className="flex items-center gap-2">
            
            {/* TERMINAL TOGGLE BUTTON */}
            <Tooltip title={showTerminal ? 'Hide Terminal' : 'Show Terminal'}>
                <IconButton 
                    size="small" 
                    onClick={toggleTerminal}
                    // Highlight if active
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