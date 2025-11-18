import { useState, useCallback, useEffect, SyntheticEvent, useMemo } from 'react';

// --- Types ---

export interface IMediaPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  error: string | null;
  isLoaded: boolean;
}

export interface IMediaPlayerControls extends IMediaPlayerState {
  setMediaElement: (element: HTMLMediaElement | null) => void;
  handlePlayPause: () => void;
  handleSeek: (_event: Event | SyntheticEvent, newValue: number | number[]) => void;
  handleVolumeChange: (_event: Event | SyntheticEvent, newValue: number | number[]) => void;
  handleToggleMute: () => void;
  // Expose the raw element for cleanup checks, if necessary
  mediaElement: HTMLMediaElement | null;
}

const INITIAL_STATE: IMediaPlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false,
  error: null,
  isLoaded: false,
};

/**
 * Hook to manage state and control logic for a single HTMLMediaElement (Audio or Video).
 * This hook ensures each player instance manages its own isolated state.
 * @returns IMediaPlayerControls object containing state and handlers.
 */
export const useMediaPlayer = (): IMediaPlayerControls => {
  const [state, setState] = useState<IMediaPlayerState>(INITIAL_STATE);
  const [mediaElement, setMediaElementReference] = useState<HTMLMediaElement | null>(null);

  // Helper to update state
  const updateState = useCallback((newState: Partial<IMediaPlayerState>) => {
    setState(prev => ({ ...prev, ...newState }));
  }, []);

  // --- Core Media Controls ---

  const playMedia = useCallback(() => {
    if (mediaElement) {
      mediaElement.play().catch(e => {
        // Catch promise rejection due to auto-play restrictions
        updateState({
          error: 'Playback failed. User interaction or browser policy may be required.',
          isPlaying: false,
        });
      });
    }
  }, [mediaElement, updateState]);

  const pauseMedia = useCallback(() => {
    if (mediaElement) {
      mediaElement.pause();
    }
  }, [mediaElement]);

  const handlePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pauseMedia();
    } else {
      playMedia();
    }
  }, [state.isPlaying, pauseMedia, playMedia]);

  const handleSeek = useCallback(
    (_event: unknown, newValue: number | number[]) => {
      const newTime = typeof newValue === 'number' ? newValue : 0;
      if (mediaElement && !isNaN(newTime) && newTime >= 0 && newTime <= state.duration) {
        mediaElement.currentTime = newTime;
        // Update state optimistically for responsiveness
        updateState({ currentTime: newTime });
      }
    },
    [mediaElement, state.duration, updateState],
  );

  const handleVolumeChange = useCallback(
    (_event: unknown, newValue: number | number[]) => {
      const newVolumePercent = typeof newValue === 'number' ? newValue : 0;
      const newVolume = newVolumePercent / 100;

      if (mediaElement) {
        mediaElement.volume = newVolume;
        const newMutedState = newVolume === 0;
        
        if (newMutedState !== mediaElement.muted) {
             mediaElement.muted = newMutedState;
        }

        updateState({ isMuted: newMutedState, volume: newVolume });
      }
    },
    [mediaElement, updateState],
  );
  
  const handleToggleMute = useCallback(() => {
    if (mediaElement) {
      const newMutedState = !state.isMuted;
      mediaElement.muted = newMutedState;
      updateState({ isMuted: newMutedState });
    }
  }, [mediaElement, state.isMuted, updateState]);

  // --- DOM Element Handlers (Setup Listeners) ---

  const setMediaElement = useCallback((element: HTMLMediaElement | null) => {
    if (element === mediaElement) return; // Element is already set
    
    setMediaElementReference(element);
    
    if (element) {
        // Initialize volume and mute based on element defaults (or component defaults)
        const initialVolume = element.volume ?? INITIAL_STATE.volume;
        const initialMuted = element.muted ?? INITIAL_STATE.isMuted;
        
        setState(prev => ({
            ...INITIAL_STATE, // Full reset state (except for volume/mute initialization)
            volume: initialVolume,
            isMuted: initialMuted,
            currentTime: element.currentTime || INITIAL_STATE.currentTime,
        }));
    } else {
        setState(INITIAL_STATE);
    }
  }, [mediaElement]);

  // Main Effect: Set up listeners when mediaElement changes
  useEffect(() => {
    const element = mediaElement;
    if (!element) return;
    
    // Initialize properties based on current state (important for remounts)
    element.volume = state.volume;
    element.muted = state.isMuted;

    // --- Event Handlers ---
    const handleLoadedMetadata = () => {
        updateState({ duration: element.duration, isLoaded: true, error: null });
    };
    const handleTimeUpdate = () => {
        updateState({ currentTime: element.currentTime });
    };
    const handleEnded = () => {
        updateState({ isPlaying: false, currentTime: 0 });
    };
    const handlePlay = () => updateState({ isPlaying: true });
    const handlePause = () => updateState({ isPlaying: false });
    const handleError = (e: Event | ErrorEvent) => {
        const errorMsg = element.error ? element.error.message : (e as ErrorEvent)?.message || 'Error loading media file.';
        updateState({
            error: errorMsg,
            isPlaying: false,
            isLoaded: false,
        });
    };

    // --- Setup Listeners ---
    element.addEventListener('loadedmetadata', handleLoadedMetadata);
    element.addEventListener('timeupdate', handleTimeUpdate);
    element.addEventListener('ended', handleEnded);
    element.addEventListener('play', handlePlay);
    element.addEventListener('pause', handlePause);
    element.addEventListener('error', handleError as EventListener);

    // --- Cleanup ---
    return () => {
      // Clean up event listeners for this specific element
      element.removeEventListener('loadedmetadata', handleLoadedMetadata);
      element.removeEventListener('timeupdate', handleTimeUpdate);
      element.removeEventListener('ended', handleEnded);
      element.removeEventListener('play', handlePlay);
      element.removeEventListener('pause', handlePause);
      element.removeEventListener('error', handleError as EventListener);
    };
  }, [mediaElement, updateState, state.volume, state.isMuted]); // Include state values used for initialization
  
  // Combine state and actions for return
  return useMemo(() => ({
    ...state,
    setMediaElement,
    handlePlayPause,
    handleSeek,
    handleVolumeChange,
    handleToggleMute,
    mediaElement, // Expose for consumer checks
  }), [
    state,
    setMediaElement,
    handlePlayPause,
    handleSeek,
    handleVolumeChange,
    handleToggleMute,
    mediaElement,
  ]);
};

