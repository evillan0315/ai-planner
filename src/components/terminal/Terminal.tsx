import React, { useRef, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { Box, Typography, Alert, CircularProgress, useTheme, SxProps } from '@mui/material';
import { terminalService } from '@/services/terminalService';
import { terminalStore } from '@/stores/terminalStore';
import { isTerminalVisible } from '@/stores/uiStore';
import * as path from 'path-browserify';

// Interface is not strictly needed for this component, but enforcing structure
interface TerminalProps {
  height: number; // Controlled by parent
}

// --- Styles ---

const TerminalContainerSx: SxProps = (theme) => ({
    position: 'relative',
    width: '100%',
    height: '100%', 
    overflow: 'hidden',
    // Apply a standard terminal background for consistency
    backgroundColor: '#1E1E1E', 
});

/**
 * The core Xterm.js terminal component.
 * Manages the PTY connection via terminalService and displays output.
 */
const TerminalComponent: React.FC<TerminalProps> = ({ height }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  
  const { isConnected, error, cwd } = useStore(terminalStore);
  const isVisible = useStore(isTerminalVisible);

  // Determine the initial working directory to use (either the planner's root or system home)
  // Use VITE_BASE_DIR as default, normalized.
  const initialCwd = useMemo(() => {
    return path.normalize(import.meta.env.VITE_BASE_DIR || '/');
  }, []);

  // --- Effect: Initialize and Destroy Xterm Instance ---
  useEffect(() => {
    if (isVisible && terminalRef.current) {
        // Initialize Xterm and connect to WS
        terminalService.initializeTerminal(terminalRef.current, initialCwd);
    } 
    
    // Cleanup function runs when component unmounts OR isVisible changes to false
    return () => {
        // Destroy Xterm and disconnect WS
        terminalService.destroyTerminal();
    };
  }, [isVisible, initialCwd]);

  // --- Effect: Handle Visibility Changes (Focus/Resize) ---
  useEffect(() => {
    // When the drawer opens or height changes, force a fit and focus
    if (isVisible) {
      // Need a slight delay to ensure container transition is complete before fitting
      const timer = setTimeout(() => {
        terminalService.manualResize();
        terminalService.focus();
      }, 150); 
      return () => clearTimeout(timer);
    }
  }, [isVisible, height]); // Depend on visibility and height prop

  // --- Render Logic ---

  if (error) {
    return (
      <Box sx={TerminalContainerSx} className="flex flex-col items-center justify-center p-4">
        <Alert severity="error" variant="filled" sx={{ width: '90%' }}>
          Terminal Error: {error}
        </Alert>
        {cwd && (
             <Typography variant="caption" color="text.secondary" className="mt-2 block">
                Current Path: {cwd}
            </Typography>
        )}
      </Box>
    );
  }
  
  if (!isConnected && isVisible) {
    return (
      <Box sx={TerminalContainerSx} className="flex flex-col items-center justify-center p-4">
        <CircularProgress size={30} sx={{ color: theme.palette.primary.main }} />
        <Typography variant="body1" className="mt-3" color="text.secondary">
          Connecting to Terminal Service...
        </Typography>
      </Box>
    );
  }

  // The actual terminal output area
  return (
    <Box sx={TerminalContainerSx}>
      <div 
        ref={terminalRef} 
        style={{ 
            width: '100%', 
            height: '100%', 
            // Ensure color inheritance is overridden by Xterm.js styles, but keeps context
            color: theme.palette.text.primary, 
        }} 
      />
    </Box>
  );
};

export default TerminalComponent;
