 import React from 'react';
import { IconButton, Tooltip, CircularProgress, SxProps, Theme } from '@mui/material';
import { Stop, Videocam, CameraAlt, StopCircle, ScreenshotMonitor } from '@mui/icons-material';
import GlobalActionButton, { GlobalAction } from '@/components/ui/GlobalActionButton';

interface RecordingActionIconsProps {
  isScreenRecording: boolean;
  isCameraRecording: boolean;
  isCapturing: boolean;
  onStartScreenRecording: () => void;
  onStopScreenRecording: () => void;
  onStartCameraRecording: () => void;
  onStopCameraRecording: () => void;
  onCapture: () => void;
}

// --- Styling Emulation (Derived from RecordingControls.tsx) ---

const commonIconButtonSx: SxProps<Theme> = (theme) => ({
  fontSize: '1.5rem', // Standard icon size for the footer
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
});

const primaryIconColorSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.primary.main,
});

const errorIconColorSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.error.main,
});

const secondaryIconColorSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.secondary.main,
});


/**
 * A button set component mimicking the structure and styling of RecordingControls,
 * designed to be used within GlobalActioButtonGroup contexts (like the Footer).
 * Note: Actions use placeholder implementations here, expecting parent (Footer) to handle state/logic.
 */
export const RecordingActionIcons: React.FC<RecordingActionIconsProps> = ({
  isScreenRecording,
  isCameraRecording,
  isCapturing,
  onStartScreenRecording,
  onStopScreenRecording,
  onStartCameraRecording,
  onStopCameraRecording,
  onCapture,
}) => {

  // We construct the list of GlobalActions here, relying on GlobalActionButton to render them correctly.
  const actionGroups: GlobalAction[][] = [
    // Screen Recording Group
    [
      {
        icon: isScreenRecording ? <Stop fontSize="inherit" /> : <Videocam fontSize="inherit" />,
        label: isScreenRecording ? "Stop Screen Recording" : "Start Screen Recording",
        action: isScreenRecording ? onStopScreenRecording : onStartScreenRecording,
        color: isScreenRecording ? 'error' : 'primary',
        variant: 'text',
        iconOnly: true,
        size: 'medium',
      }
    ],
    // Camera Recording Group
    [
      {
        icon: isCameraRecording ? <StopCircle fontSize="inherit" /> : <CameraAlt fontSize="inherit" />,
        label: isCameraRecording ? "Stop Camera Recording" : "Start Camera Recording",
        action: isCameraRecording ? onStopCameraRecording : onStartCameraRecording,
        color: isCameraRecording ? 'error' : 'primary',
        variant: 'text',
        iconOnly: true,
        size: 'medium',
      }
    ],
    // Screenshot Group
    [
      {
        icon: isCapturing ? (
            <CircularProgress size={20} sx={secondaryIconColorSx} />
        ) : (
            <ScreenshotMonitor fontSize="inherit" />
        ),
        label: "Capture Screenshot",
        action: onCapture,
        color: 'secondary',
        variant: 'text',
        iconOnly: true,
        size: 'medium',
        disabled: isCapturing,
      }
    ]
  ];

  return (
    <GlobalActionButton 
        globalActions={actionGroups.map(group => ({ actionGroup: group }))} 
        iconOnly={true}
        orientation="horizontal"
    />
  );
};
