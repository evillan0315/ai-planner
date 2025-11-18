import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { Box, Alert, useTheme, SxProps } from '@mui/material';
import { Videocam, PlayArrow } from '@mui/icons-material';
import { MediaPlayerControls } from './MediaPlayerControls';
import { useMediaPlayer } from './hooks/useMediaPlayer'; // IMPORT NEW HOOK


/**
 * Interface for VideoPlayer component props.
 */
interface VideoPlayerProps {
  src: string;
  fileName?: string;
  /** Callback to provide the requestFullscreen function (or null/undefined to unregister) */
  onRequestFullscreenReady?: (fn: (() => void) | null) => void; 
}

// ================================================
// SX Prop Definitions
// ================================================

// Controls height estimation: MediaPlayerControls is about 48px + padding (total ~64px)
const CONTROLS_HEIGHT_PX = 44;

const PlayerContainerSx: SxProps = {
   display: 'flex',
   flexDirection: 'column',
   width: '100%',
   height: '100%', // Ensure it takes up the full space of the floating dialog content area
   position: 'relative', // Establish context for absolute controls
   p: 0,
   border: '1px solid',
   borderColor: 'divider',
};



 const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, fileName, onRequestFullscreenReady }) => {
   const theme = useTheme();
   const videoRef = useRef<HTMLVideoElement | null>(null);

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
  
  // Define requestFullscreen handler using useCallback
  const requestFullscreen = useCallback(() => {
    if (videoRef.current?.requestFullscreen) {
        // Use standard browser fullscreen API
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            videoRef.current.requestFullscreen().catch(err => {
                console.error("Failed to go fullscreen:", err);
            });
        }
    } else {
        console.warn("Fullscreen API not supported or video element missing.");
    }
}, []);


  // 2. DOM Initialization and Listener Setup
  useEffect(() => {
    const element = videoRef.current;
    
    // 2a. Set element in hook state
    setMediaElement(element); 
    
    // 2b. Expose Fullscreen Functionality
    if (onRequestFullscreenReady) {
        onRequestFullscreenReady(requestFullscreen);
    }

    if (element) {
        // Ensure src is set only once or when required, and load.
        if (element.src !== src) {
          element.src = src;
          element.load();
        }
    }


    // 2e. Cleanup
    return () => {
      // 1. Unregister Fullscreen Functionality
      if (onRequestFullscreenReady) {
          onRequestFullscreenReady(null);
      }
        
      // 2. Stop media playback on cleanup if it was playing
      if (element && !element.paused) {
          element.pause();
      }
        
      // 3. Explicitly tell the hook that the element is gone.
      setMediaElement(null);
    };
  }, [src, onRequestFullscreenReady, requestFullscreen, setMediaElement]); // Dependencies include src and the hook's setter


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

    const isVideoLoaded = isLoaded; 
 
   if (error && !isLoaded) {
    return <Alert severity="error">Video Error: {error}</Alert>;
   }

   return (
     <Box sx={PlayerContainerSx} className="VideoPlayer items-center justify-center">
       {/* Video Display Area: Takes all vertical space above the controls */}
       <Box 
            className="flex flex-grow items-center justify-center relative overflow-hidden" 
            sx={{ 
                // Padding bottom reserves space for the absolute positioned controls
                p: 0, 
                pb: `${CONTROLS_HEIGHT_PX}px`, 
                // Ensure the video wrapper respects the container's height definition
            }}
        >
            <video 
                ref={videoRef} 
                preload="metadata" 
                controls={false} // Manage controls manually
                // Tailwind class for responsiveness
                className="" 
                style={{ 
                    // Ensures video scales within the bounds set by FloatingResizableDraggableBox height
                    maxHeight: '100%', 
                    maxWidth: '100%',
                    minHeight: isVideoLoaded ? 'auto' : '100px',
                    backgroundColor: theme.palette.background.default, // Use default background for video area
                    borderRadius: theme.shape.borderRadius,
                }}
                onClick={handlePlayPause} // Allow click to play/pause
            />
            {/* Overlay Play/Pause Button for better UX, especially when paused */}
            {!isPlaying && isVideoLoaded && ( 
              <Box 
                className="absolute inset-0 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200"
                onClick={handlePlayPause}
                sx={{ cursor: 'pointer', zIndex: 5 }}
              >
                  <PlayArrow sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.8)' }} />
              </Box>
            )}
        </Box>
      

      {/* Controls: Absolute Positioned at the bottom */}
      <Box 
        className="w-full"
        sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            backgroundColor: theme.palette.background.paper, 
            zIndex: 10,
            minHeight: `${CONTROLS_HEIGHT_PX}px`, // Ensure box size consistency
            borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <MediaPlayerControls 
          {...controlsProps}
          MediaIcon={Videocam}
          title={fileName || 'Video File'}
          fullWidth={true}
        />
      </Box>
    </Box>
  );
};

export default VideoPlayer;

