import { persistentAtom } from '@/utils/persistentAtom';

// Placeholder for projectRootDirectoryStore. In a full IDE, this would reflect the opened project.
export const projectRootDirectoryStore = persistentAtom<string>('projectRootDirectory', import.meta.env.VITE_BASE_DIR);

// Removed the redundant listener that caused unnecessary re-setting of the atom.
// The `persistentAtom` function already handles localStorage updates internally.
