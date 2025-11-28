import { atom } from 'nanostores';
import { IRecording } from '../types';

interface RecordingState {
  recordings: IRecording[];
  isLoading: boolean;
  error: string | null;
}

const initialStoreState: RecordingState = {
  recordings: [],
  isLoading: false,
  error: null,
};

export const recordingStore = atom<RecordingState>(initialStoreState);

// Example action setter (to be fleshed out later)
export const recordingActions = {
  startLoading: () => {
    recordingStore.set({ ...recordingStore.get(), isLoading: true, error: null });
  },
  setRecordings: (recordings: IRecording[]) => {
    recordingStore.set({ ...recordingStore.get(), recordings, isLoading: false });
  },
  setError: (error: string) => {
    recordingStore.set({ ...recordingStore.get(), error, isLoading: false });
  }
};
