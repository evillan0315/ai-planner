import { atom } from 'nanostores';
import type { IFileSystemEntry } from '@/components/file-explorer/types';
import { fileExplorerService } from '@/components/file-explorer/api/fileExplorerService';
import { IMAGE_MIME_TYPES, VIDEO_MIME_TYPES, AUDIO_MIME_TYPES } from '@/constants';

// --- Types ---

export interface IWindowContent {
  filePath: string;
  content: string; // Empty for media, used for text/code previews
  mimeType?: string;
  language?: string;
  mediaStreamUrl?: string; // Secured URL for media streaming
  mediaUrlLoading: boolean;
  mediaUrlError: string | null;
}

export interface FloatingWindow {
  id: string; // Unique identifier, usually file path
  fileEntry: IFileSystemEntry;
  content: IWindowContent;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isLoading: boolean; // For initial content/URL fetch
  error: string | null;
}

interface FloatingWindowsState {
  windows: FloatingWindow[];
  maxZIndex: number;
}

// --- Constants & Initializers ---

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 400;
const INITIAL_Z_INDEX = 1100;

function getNewWindowPosition(windows: FloatingWindow[]): { x: number; y: number } {
  // Simple cascading offset
  const offset = windows.length * 30;
  let x = 50 + offset;
  let y = 50 + offset;
  
  if (typeof window !== 'undefined') {
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    
    // Ensure the offset wraps around near the screen edges
    const wrapX = vpW - DEFAULT_WIDTH - 50;
    const wrapY = vpH - DEFAULT_HEIGHT - 50;
    
    // Calculate wrapped position
    x = (50 + (offset % wrapX));
    y = (50 + (offset % wrapY));
  }
  
  return { x: Math.max(20, x), y: Math.max(20, y) };
}

// --- Store ---

export const floatingWindowsStore = atom<FloatingWindowsState>({
  windows: [],
  maxZIndex: INITIAL_Z_INDEX,
});

// --- Actions ---

/**
 * Helper to update a single window in the store array immutably.
 */
const updateWindowInStore = (windowId: string, update: Partial<FloatingWindow>) => {
  const current = floatingWindowsStore.get();
  const index = current.windows.findIndex(w => w.id === windowId);

  if (index !== -1) {
    const newWindows = [...current.windows];
    newWindows[index] = { ...newWindows[index], ...update };
    floatingWindowsStore.set({ ...current, windows: newWindows });
  }
};

/**
 * Opens a file in a new floating window (primarily for media).
 */
export const openFloatingWindow = async (entry: IFileSystemEntry) => {
  const windowId = entry.path; 
  const current = floatingWindowsStore.get();

  // 1. If already open, just bring to front
  const existingWindow = current.windows.find(w => w.id === windowId);
  if (existingWindow) {
    bringWindowToFront(windowId);
    return;
  }

  // 2. Prepare initial state
  const newPosition = getNewWindowPosition(current.windows);
  const newZIndex = current.maxZIndex + 1; // Always increment max Z index
  const newWindow: FloatingWindow = {
    id: windowId,
    fileEntry: entry,
    position: newPosition,
    size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
    zIndex: newZIndex,
    isLoading: true,
    error: null,
    content: {
        filePath: entry.path,
        content: '',
        mimeType: entry.mimeType,
        language: entry.path.split('.').pop() || 'plaintext',
        mediaStreamUrl: undefined,
        mediaUrlLoading: false,
        mediaUrlError: null,
    }
  };

  // Update store state with new window and max Z-index
  floatingWindowsStore.set({
    windows: [...current.windows, newWindow],
    maxZIndex: newZIndex,
  });

  // 3. Start fetching stream URL or content
  try {
    updateWindowInStore(windowId, { isLoading: true });

    if (entry.isDirectory) {
        throw new Error("Cannot open directory in floating viewer.");
    }
    
    // Check if it's media or a large text file that should use streaming/URL lookup
    const isMedia = IMAGE_MIME_TYPES.has(entry.mimeType || '') || 
                    VIDEO_MIME_TYPES.has(entry.mimeType || '') ||
                    AUDIO_MIME_TYPES.has(entry.mimeType || '');
    
    let mediaStreamUrl: string | undefined;
    let fetchedContent = '';
    let finalMimeType = entry.mimeType;
    let finalLanguage = entry.path.split('.').pop() || 'plaintext';
    
    if (isMedia) {
        const url = await fileExplorerService.getFileStreamUrl(entry.path);
        mediaStreamUrl = url;
    } else {
        // Fetch content for non-media files (read-only viewer mode)
        const response = await fileExplorerService.readFileContent(entry.path);
        fetchedContent = response.content;
        finalMimeType = response.mimeType || finalMimeType;
        finalLanguage = response.language || finalLanguage;
    }
    
    updateWindowInStore(windowId, {
      isLoading: false,
      content: {
          ...newWindow.content,
          content: fetchedContent,
          mediaStreamUrl: mediaStreamUrl,
          mediaUrlLoading: false,
          mediaUrlError: null,
          mimeType: finalMimeType,
          language: finalLanguage,
      },
    });

  } catch (err: unknown) {
    const errorMsg = (err as Error).message || 'Failed to load content for floating window.';
    updateWindowInStore(windowId, {
      isLoading: false,
      error: errorMsg,
      content: {
          ...newWindow.content,
          mediaUrlLoading: false,
          mediaUrlError: errorMsg,
      }
    });
  }
};

/**
 * Closes a floating window by its ID.
 */
export const closeFloatingWindow = (windowId: string) => {
  const current = floatingWindowsStore.get();
  const newWindows = current.windows.filter(w => w.id !== windowId);
  floatingWindowsStore.set({ ...current, windows: newWindows });
};

/**
 * Updates the position of a floating window.
 */
export const updateWindowPosition = (windowId: string, position: { x: number; y: number }) => {
  updateWindowInStore(windowId, { position });
};

/**
 * Updates the size of a floating window.
 */
export const updateWindowSize = (windowId: string, size: { width: number; height: number }) => {
  updateWindowInStore(windowId, { size });
};

/**
 * Brings a specific window to the front by updating its z-index.
 */
export const bringWindowToFront = (windowId: string) => {
  const current = floatingWindowsStore.get();
  const targetWindow = current.windows.find(w => w.id === windowId);

  if (targetWindow && targetWindow.zIndex !== current.maxZIndex) {
    const newMaxZIndex = current.maxZIndex + 1;
    const newWindows = current.windows.map(w => 
        w.id === windowId ? { ...w, zIndex: newMaxZIndex } : w
    );

    floatingWindowsStore.set({
      windows: newWindows,
      maxZIndex: newMaxZIndex,
    });
  }
};

