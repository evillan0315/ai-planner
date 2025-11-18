import { atom } from 'nanostores';

/**
 * Interface for the state of the media player.
 * Since only one media player is active in the floating dialog/drawer at a time,
 * a singleton store is used.
 */
export interface IMediaPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  error: string | null;
  isLoaded: boolean;
  mediaElement: HTMLMediaElement | null; // Reference to the active DOM element
  currentSrc: string | null; // NEW: Track the currently loaded source URL
}

const INITIAL_STATE: IMediaPlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false,
  error: null,
  isLoaded: false,
  mediaElement: null,
  currentSrc: null, // NEW
};

export const mediaPlayerStore = atom<IMediaPlayerState>(INITIAL_STATE);


// --- State Management Actions (Dispatched by DOM event listeners in Player components) ---

/**
 * Sets the DOM media element reference in the store and initializes state.
 * Resets state if the source URL changes, but preserves loaded state if the
 * element reference changes for the same source (transient component remount).
 */
export const setMediaElement = (element: HTMLMediaElement | null) => {
    const current = mediaPlayerStore.get();
    
    // We only handle non-null elements here. Unset is handled by component cleanup -> resetMediaPlayerState.
    if (!element) return; 

    const newSrc = element.src || null;

    // Check if element reference changed
    const elementChanged = element !== current.mediaElement;
    // Check if the media source URL changed
    const srcChanged = newSrc !== current.currentSrc;


    // Case 1: Source changed OR element is new and source is new (Full reset)
    if (srcChanged) {
        mediaPlayerStore.set({
            ...INITIAL_STATE, 
            mediaElement: element,
            currentSrc: newSrc,
            volume: element.volume ?? INITIAL_STATE.volume,
            isMuted: element.muted ?? INITIAL_STATE.isMuted,
        });
        element.volume = INITIAL_STATE.volume;
        element.muted = INITIAL_STATE.isMuted;
        return;
    }
    
    // Case 2: Element reference changed (transient remount, e.g., resize) but source is identical. 
    if (elementChanged && !srcChanged) {
        // Preserve player state (including isLoaded, duration, time)
        mediaPlayerStore.set({ ...current, mediaElement: element });

        // Re-sync DOM element state to the preserved store state
        element.currentTime = current.currentTime;
        element.volume = current.volume;
        element.muted = current.isMuted;
        
        // If it was playing, try to continue immediately
        if (current.isPlaying) {
             element.play().catch(console.warn); 
        }
        return;
    }
    
    // Case 3: Simple re-render, no actual DOM replacement or source change. Do nothing.
};

/**
 * Updates multiple fields in the media player state atom.
 */
export const updatePlayerState = (newState: Partial<IMediaPlayerState>) => {
    mediaPlayerStore.set({
        ...mediaPlayerStore.get(),
        ...newState,
    });
};

/**
 * Handles media loading or playback errors.
 */
export const handleMediaError = (element: HTMLMediaElement, e: ErrorEvent | null) => {
    const errorMsg = element.error ? element.error.message : e?.message || 'Error loading media file.';
    updatePlayerState({
        error: errorMsg,
        isPlaying: false,
        isLoaded: false,
    });
};


// --- Control Actions (Called by MediaPlayerControls or user interaction) ---

export const playMedia = () => {
    const { mediaElement } = mediaPlayerStore.get();
    if (mediaElement) {
        mediaElement.play().catch(e => {
            // Catch promise rejection due to auto-play restrictions
            updatePlayerState({
                error: 'Playback failed. User interaction or browser policy may be required.',
                isPlaying: false,
            });
        });
    }
};

export const pauseMedia = () => {
    const { mediaElement } = mediaPlayerStore.get();
    if (mediaElement) {
        mediaElement.pause();
    }
};

export const handlePlayPause = () => {
    const { isPlaying } = mediaPlayerStore.get();
    if (isPlaying) {
        pauseMedia();
    } else {
        playMedia();
    }
};



export const seekMedia = (
    _event: unknown, 
    newValue: number | number[],
) => {
    const newTime = typeof newValue === 'number' ? newValue : 0;
    const { mediaElement, duration } = mediaPlayerStore.get();
    
    if (mediaElement && !isNaN(newTime) && newTime >= 0 && newTime <= duration) {
        mediaElement.currentTime = newTime;
        // Update store optimistically for responsiveness
        updatePlayerState({ currentTime: newTime }); 
    }
};
/**
 * Sets the volume of the media element (0-100% input, converted to 0.0-1.0).
 */
export const setMediaVolume = (
    _event: unknown, 
    newValue: number | number[],
) => {
    const newVolumePercent = typeof newValue === 'number' ? newValue : 0;
    const newVolume = newVolumePercent / 100;
    const { mediaElement } = mediaPlayerStore.get();
    
    if (mediaElement) {
        mediaElement.volume = newVolume;
        if (newVolume > 0 && mediaElement.muted) {
            mediaElement.muted = false;
            // Update all related properties in one go
            mediaPlayerStore.set({ ...mediaPlayerStore.get(), isMuted: false, volume: newVolume });
        } else {
            mediaPlayerStore.set({ ...mediaPlayerStore.get(), volume: newVolume });
        }
    }
};

export const toggleMediaMute = () => {
    const { mediaElement, isMuted } = mediaPlayerStore.get();
    if (mediaElement) {
        const newMutedState = !isMuted;
        mediaElement.muted = newMutedState;
        updatePlayerState({ isMuted: newMutedState });
    }
};

export const resetMediaPlayerState = () => {
    mediaPlayerStore.set(INITIAL_STATE);
};

