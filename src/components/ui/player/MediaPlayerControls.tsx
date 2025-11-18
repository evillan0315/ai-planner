// File: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/ui/player/MediaPlayerControls.tsx

import React, { useMemo, SyntheticEvent } from 'react';
import { Box, IconButton, Slider, Typography, useTheme, Stack, SxProps, Theme, Alert } from '@mui/material';
import {
  PlayArrow, 
  Pause, 
  VolumeUp, 
  VolumeOff, 
  VolumeDown,
  GraphicEq, // Generic icon fallback
} from '@mui/icons-material';
// REMOVED: import type { IMediaPlayerState, IMediaPlayerControls } from './useMediaPlayerControls';


/**
 * Interface for the state required by the media player controls.
 */
export interface IMediaPlayerControlsState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  error: string | null;
  isLoaded: boolean;
}

/**
 * Interface for the control actions required by the media player controls.
 */
export interface IMediaPlayerControlActions {
  handlePlayPause: () => void;
  handleSeek: (_event: Event | SyntheticEvent, newValue: number | number[]) => void;
  handleVolumeChange: (_event: Event | SyntheticEvent, newValue: number | number[]) => void;
  handleToggleMute: () => void;
}

/**
 * Helper function to format time (e.g., 90 -> 1:30)
 */
const formatTime = (time: number): string => {
  if (isNaN(time) || time === Infinity || time < 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// ================================================
// SX Prop Definitions
// ================================================

const ControlsRowSx: SxProps = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
  // Ensure controls fit flush inside parent box if parent defines padding
  px: 0, 
  py: 0,
  mt: 0,
  mb: 0,
};

const SliderSx = (theme: Theme): SxProps => ({
  color: theme.palette.primary.main,
  height: 4,
  '& .MuiSlider-thumb': {
    width: 10,
    height: 10,
  },
});

const VolumeSliderSx = (theme: Theme): SxProps => ({
  ...SliderSx(theme),
  //width: 80,
});

// ================================================
// Component Interface
// ================================================

interface MediaPlayerControlsProps extends IMediaPlayerControlsState, IMediaPlayerControlActions {
    /** Optional icon to display alongside the filename/title */
    MediaIcon?: React.ElementType; 
    /** Title or filename for display */
    title?: string;
    /** If true, the controls container should span the full width of its parent */
    fullWidth?: boolean; 
}


/**
 * Generic component for rendering standardized Audio/Video playback controls (Play/Pause, Seek, Volume).
 * It expects state and handlers derived from a media control system (now managed by nanostore).
 */
export const MediaPlayerControls: React.FC<MediaPlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  error,
  isLoaded,
  handlePlayPause,
  handleSeek,
  handleVolumeChange,
  handleToggleMute,
  MediaIcon = GraphicEq, // Default to a generic audio icon
  title,
  fullWidth = true,
}) => {
  const theme = useTheme();

  const displayVolume = isMuted ? 0 : Math.round(volume * 100);
  const isPlaybackDisabled = duration === 0 || !isLoaded;

  const VolumeIcon = useMemo(() => {
    if (isMuted || volume === 0) return VolumeOff;
    if (volume < 0.5) return VolumeDown;
    return VolumeUp;
  }, [isMuted, volume]);
  
  // Custom SX for the container allowing full width control
  const containerSx = useMemo(() => ({
    ...ControlsRowSx,
    width: fullWidth ? '100%' : 'auto',
  }), [fullWidth]);

  return (
    <Box className="flex flex-col items-center">

      {/* Playback Controls and Time */}
      <Box sx={containerSx}>
        <IconButton 
          onClick={handlePlayPause}
          color='primary'
          size='large'
          disabled={isPlaybackDisabled}
        >
          {isPlaying ? <Pause fontSize='inherit' /> : <PlayArrow fontSize='inherit' />}
        </IconButton>
        
        <Typography variant="caption" color="text.secondary" className='w-10 text-center'>
          {formatTime(currentTime)}
        </Typography>

        {/* Progress Slider */}
        <Slider
          size="small"
          value={currentTime}
          onChange={handleSeek}
          min={0}
          max={duration || 0}
          aria-label="Current time"
          sx={SliderSx(theme)}
          className="flex-grow"
          disabled={isPlaybackDisabled}
        />
        
        <Typography variant="caption" color="text.secondary" className='w-10 text-center'>
          {formatTime(duration)}
        </Typography>

        {/* Volume Control */}
        <Box className='flex items-center gap-1 w-50 justify-end'>
            <IconButton onClick={handleToggleMute} size="small" color="secondary" disabled={!isLoaded}> 
                <VolumeIcon fontSize="small" />
            </IconButton>
            <Slider
                size="small"
                value={displayVolume}
                onChange={handleVolumeChange}
                min={0}
                max={100}
                aria-label="Volume"
                sx={VolumeSliderSx(theme)}
                disabled={!isLoaded}
            />
        </Box>
      </Box>
      {error && <Alert severity="error" className="mt-2">{error}</Alert>}
    </Box>
  );
};

