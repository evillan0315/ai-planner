import React from 'react';
import { Box, Typography, useTheme, SxProps, IconButton, Tooltip } from '@mui/material';
import { Stop, Videocam, CameraAlt, StopCircle, ScreenshotMonitor } from '@mui/icons-material';
import LiveClock from '@/components/clock/LiveClock';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useStore } from '@nanostores/react';
import { isTerminalVisible, toggleTerminal } from '@/stores/uiStore';
import TerminalIcon from '@mui/icons-material/Terminal';

// NEW IMPORTS for Dialog Service and Clock Dialog
import ClockConfigDialog from '@/components/clock/ClockConfigDialog'; 
import { dialogService } from '@/services/dialogService'; 
import { snackbarService } from '@/components/ui/snackbar/services/snackbarService'; 

// --- Types for Footer actions ---
import  { openDialog, type DialogOptions } from '@/stores/dialogStore';

const footerContentSx: SxProps = {
  height: '100%',
  width: '100%',
  px: 2,
};

// --- Recording Control Emulation Styles (Derived from RecordingControls.tsx) ---

const commonIconButtonSx: SxProps = {
  fontSize: '1.5rem', // Smaller for footer context
  '&:hover': {
    backgroundColor: (theme: Theme) => theme.palette.action.hover,
  },
};

const primaryIconColorSx: SxProps = (theme: Theme) => ({
  color: theme.palette.primary.main,
});

const errorIconColorSx: SxProps = (theme: Theme) => ({
  color: theme.palette.error.main,
});

const secondaryIconColorSx: SxProps = (theme: Theme) => ({
  color: theme.palette.secondary.main,
});

// --- Component Implementation ---

/**
 * Global application footer displaying status, clock, and theme toggle.
 * Expected to be wrapped by a container defining a fixed height (38px).
 */
const Footer: React.FC = () => {
  const theme = useTheme();
  const showTerminal = useStore(isTerminalVisible);
  const { closeDialog } = dialogService; // Using service wrappers
  
  // Placeholder state/actions for recording controls
  const [isScreenRecording, setIsScreenRecording] = React.useState(false);
  const [isCameraRecording, setIsCameraRecording] = React.useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = React.useState(false);

  // Clock Click Handler
  const handleClockClick = () => {
    // Trigger opening ClockConfigDialog using dialogService wrappers
    const dialogContent = (
        <ClockConfigDialog 
            open={true} 
            onClose={() => closeDialog()} 
        />
    );
    
    openCustomDialog({
        type: 'custom',
        title: 'Clock Configuration',
        content: dialogContent,
        maxWidth: 'lg',
        // Actions are implicitly handled by CustomDialog rendering its close button
    });
  };

  // Placeholder Recording Handlers
  const handleScreenRecToggle = () => {
    if (isScreenRecording) {
      setIsScreenRecording(false);
      snackbarService.showSuccess('Screen recording stopped (Placeholder)', 3000);
    } else {
      setIsScreenRecording(true);
      snackbarService.showWarning('Screen recording started (Placeholder)', 3000);
    }
  };

  const handleCameraRecToggle = () => {
    if (isCameraRecording) {
      setIsCameraRecording(false);
      snackbarService.showSuccess('Camera recording stopped (Placeholder)', 3000);
    } else {
      setIsCameraRecording(true);
      snackbarService.showWarning('Camera recording started (Placeholder)', 3000);
    }
  };

  const handleCapture = () => {
    setIsCapturingScreenshot(true);
    snackbarService.show('Capturing screenshot...', 'info', 2000);
    setTimeout(() => {
      setIsCapturingScreenshot(false);
      snackbarService.showSuccess('Screenshot captured (Placeholder)', 3000);
    }, 1500);
  };

  return (
    <Box 
      className="flex justify-between items-center"
      sx={footerContentSx}
    >
      {/* Left Status Area */}
      <Box className="flex items-center gap-2">
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          AI Planner v1.0.0
        </Typography>
        
        {/* CLOCK IMPLEMENTATION: Wrapped in Tooltip/Box to make it clickable */}
        <Tooltip title="Open Clock Configuration">
            <Box onClick={handleClockClick} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <LiveClock 
                    footer 
                    sx={{ fontSize: '1rem' }} // Smaller font size
                />
            </Box>
        </Tooltip>
        
      </Box>

      {/* Center Status Area - Recording Controls Emulation */}
      <Box className="flex items-center gap-1 px-4">
        
        {/* Screen Recording Control */}
        <Tooltip title={isScreenRecording ? "Stop Screen Recording" : "Start Screen Recording"}>
          <IconButton 
            aria-label="screen recording control" 
            onClick={handleScreenRecToggle}
            size="small"
            sx={{ ...commonIconButtonSx, ...(isScreenRecording ? errorIconColorSx : primaryIconColorSx) }}
          >
            {isScreenRecording ? <Stop fontSize="small" /> : <Videocam fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Camera Recording Control */}
        <Tooltip title={isCameraRecording ? "Stop Camera Recording" : "Start Camera Recording"}>
          <IconButton 
            aria-label="camera recording control" 
            onClick={handleCameraRecToggle}
            size="small"
            sx={{ ...commonIconButtonSx, ...(isCameraRecording ? errorIconColorSx : primaryIconColorSx) }}
          >
            {isCameraRecording ? <StopCircle fontSize="small" /> : <CameraAlt fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Screenshot Control */}
        <Tooltip title="Capture Screenshot">
          <IconButton 
            aria-label="capture screenshot" 
            onClick={handleCapture}
            disabled={isCapturingScreenshot}
            size="small"
            sx={{ ...commonIconButtonSx, ...secondaryIconColorSx }}
          >
            {isCapturingScreenshot ? 
                <CircularProgress size={18} sx={{ color: theme.palette.secondary.main }} /> : 
                <ScreenshotMonitor fontSize="small" />
            }
          </IconButton>
        </Tooltip>

      </Box>
      
      {/* Right Status Area */}
      <Box className="flex items-center gap-2">
        <Tooltip title={showTerminal ? 'Hide Terminal' : 'Show Terminal'}>
          <IconButton 
            size="small" 
            onClick={toggleTerminal}
            color={showTerminal ? 'primary' : 'inherit'} 
          > <TerminalIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <ThemeToggle />
      </Box>
      
      {/* Clock Config Dialog must be rendered or managed here if it's not managed globally */}
      <ClockConfigDialog open={openDialog.type === 'custom' && openDialog.title === 'Clock Configuration' && openDialog.open} onClose={() => openDialog({type: 'close'})} />
    </Box>
  );
};

export default Footer;
