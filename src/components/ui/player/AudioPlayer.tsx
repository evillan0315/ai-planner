import React, { useRef, useMemo, useEffect } from 'react';
import { Box, Alert, SxProps } from '@mui/material';
import {
  Audiotrack
} from '@mui/icons-material';
import { MediaPlayerControls } from './MediaPlayerControls';
import { useMediaPlayer } from './hooks/useMediaPlayer'; // IMPORT NEW HOOK

/**
 * Interface for AudioPlayer component props.
 */
interface AudioPlayerProps {
  src: string;
  fileName?: string;
}

// ================================================
// SX Prop Definitions
// ================================================

// For audio, we prioritize a sensible default width and a simple flex column layout.
const PlayerContainerSx: SxProps = { 
   display: 'flex',
   flexDirection: 'column',
   width: '100%',
   p: 0,
   border: '1px solid',
   borderColor: 'divider',
   borderRadius: 2,
   backgroundColor: 'background.paper',
   position: 'relative', // Added position relative for potential future sticky/absolute usage, though currently used as simple flow
 };


/**
 * Custom, controlled Audio Player component using Material UI elements and local state via useMediaPlayer hook.
 */
const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, fileName }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 1. Use Local Media Player State
  const { 
    error,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoaded,
    setMediaElement, 
    handlePlayPause, 
    handleSeek, 
    handleVolumeChange, 
    handleToggleMute,
  } = useMediaPlayer();

  // 2. DOM Initialization and Listener Setup
  useEffect(() => {
    const element = audioRef.current;
    
    // When the component mounts or src changes, set the element in the hook state.
    // The hook manages setting up listeners internally.
    setMediaElement(element); 

    if (element) {
      // Ensure src is set and load triggered
      if (element.src !== src) {
        element.src = src;
        element.load();
      }
    }

    // Cleanup: When the component unmounts or src changes, we explicitly unset the element.
    return () => {
      // Stop media playback before unmounting to prevent ghost playback.
      if (element && !element.paused) {
          element.pause();
      }

      // Explicitly tell the hook that the element is gone.
      setMediaElement(null); 
    };
  }, [src, setMediaElement]); // Dependencies include src and the hook's setter

  // 3. Prepare props for MediaPlayerControls
  const controlsProps = useMemo(() => ({
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
  }), [isPlaying, currentTime, duration, volume, isMuted, error, isLoaded, handlePlayPause, handleSeek, handleVolumeChange, handleToggleMute]);


  if (error && !isLoaded) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={PlayerContainerSx} className="AudioPlayer">
      <audio ref={audioRef} preload="metadata" className="hidden" />
      <MediaPlayerControls 
        {...controlsProps}
        MediaIcon={Audiotrack}
        title={fileName || 'Audio Track'}
      />
    </Box>
  );
};

export default AudioPlayer;

