import { atom } from 'nanostores';

interface GeminiState {
  // We assume the API key might be configurable later, though it defaults to the environment variable.
  apiKey: string | null;
  // State for streaming content demo
  streamingContent: string;
  isStreaming: boolean;
  streamingError: string | null;
}

// Read key from environment once
const API_KEY_FROM_ENV = import.meta.env.VITE_GEMINI_API_KEY || null;

export const geminiStore = atom<GeminiState>({
  apiKey: API_KEY_FROM_ENV,
  streamingContent: '',
  isStreaming: false,
  streamingError: null,
});

/**
 * Selector function to get the current Gemini API Key.
 * @returns The API key or null if not set.
 */
export const getApiKey = (): string | null => {
  return geminiStore.get().apiKey;
};

// Optional action to allow setting the key dynamically if needed later
export const setApiKey = (key: string | null) => {
  geminiStore.set({ apiKey: key });
};

/**
 * Action to append a chunk of streamed content.
 * @param chunk - The text delta to append.
 */
export const appendStreamingContent = (chunk: string) => {
    const current = geminiStore.get();
    geminiStore.set({
        ...current,
        streamingContent: current.streamingContent + chunk,
    });
};

/**
 * Action to reset or initialize the streaming status.
 * @param isStreaming - Boolean indicating if a stream is currently active.
 * @param error - Optional error message if streaming failed to start or stopped unexpectedly.
 */
export const setStreamingStatus = (isStreaming: boolean, error: string | null = null) => {
    const current = geminiStore.get();
    geminiStore.set({
        ...current,
        isStreaming: isStreaming,
        streamingError: error,
    });
};

/**
 * Action to clear all streaming content and error state.
 */
export const clearStreamingData = () => {
    geminiStore.set({
        ...geminiStore.get(),
        streamingContent: '',
        streamingError: null,
    });
};
