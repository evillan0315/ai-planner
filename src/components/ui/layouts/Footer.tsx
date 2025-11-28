import React, { useState } from 'react';
import { Box, Typography, useTheme, SxProps, IconButton, Tooltip } from '@mui/material';
import LiveClock from '@/components/clock/LiveClock';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useStore } from '@nanostores/react';
import { isTerminalVisible, toggleTerminal } from '@/stores/uiStore';
import TerminalIcon from '@mui/icons-material/Terminal';
import ClockConfigDialog from '@/components/clock/ClockConfigDialog'; // Import Dialog
import { useDialogs } from '@/services/dialogService'; // Get dialog control service
import { snackbarService } from '@/components/ui/snackbar/services/snackbarService'; // Use for placeholder feedback
import { RecordingActionIcons } from '@/components/recording/RecordingActionIcons'; // NEW IMPORT

const footerContentSx: SxProps = {
  height: '100%',
  width: '100%',
  px: 2,
};

// --- Component Implementation ---

/**
 * Global application footer displaying status, clock, and theme toggle.
 * Expected to be wrapped by a container defining a fixed height (38px).
 */
const Footer: React.FC = () => {
  const theme = useTheme();
  const showTerminal = useStore(isTerminalVisible);
  const { openDialog } = useDialogs(); // Get dialog control service
  
  // Placeholder state/actions for recording controls
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [isCameraRecording, setIsCameraRecording] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);

  // Clock Click Handler
  const handleClockClick = () => {
    // Trigger opening ClockConfigDialog
    openDialog({
        type: 'custom',
        title: 'Clock Configuration',
        content: <ClockConfigDialog open={true} onClose={() => openDialog({type: 'close'})} />,
        maxWidth: 'lg',
        actions: [],
        showCloseButton: true, // Handled by CustomDialog internally if content renders it
    });
  };

  // Placeholder Recording Handlers (These will feed RecordingActionIcons)
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

      {/* Center Status Area - Recording Controls (Now integrated via RecordingActionIcons) */}
      <Box className="flex items-center px-4">
        <RecordingActionIcons
            isScreenRecording={isScreenRecording}
            isCameraRecording={isCameraRecording}
            isCapturing={isCapturingScreenshot}
            onStartScreenRecording={handleScreenRecToggle}
            onStopScreenRecording={handleScreenRecToggle}
            onStartCameraRecording={handleCameraRecToggle}
            onStopCameraRecording={handleCameraRecToggle}
            onCapture={handleCapture}
        />
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
      
      <ClockConfigDialog open={openDialog.type === 'custom' && openDialog.title === 'Clock Configuration' && openDialog.open} onClose={() => openDialog({type: 'close'})} />
    </Box>
  );
};

export default Footer;
