import { atom } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';
import type { ContextMenuState, ContextMenuPosition } from '@/components/ui/context-menu/stores';
import { IFileSystemEntry } from '../types';

export const projectRootDirectoryStore = persistentAtom<string>(
  'projectRootDirectory',
  import.meta.env.VITE_BASE_DIR,
);

export const setProjectRoot = (root: string) => {
  projectRootDirectoryStore.set(root);
};

/**
 * Atom used to trigger a forced refresh of the FileExplorer component.
 * Incrementing this value tells subscribed components (FileExplorer) to reload.
 */
export const refreshTriggerAtom = atom(0);

/**
 * Action to signal the FileExplorer component to reload its current directory contents.
 */
export const triggerFileExplorerRefresh = () => {
    refreshTriggerAtom.set(refreshTriggerAtom.get() + 1);
};


// --- Selection Management ---

interface FileTreeSelectionState {
  selectedPaths: Set<string>;
  lastSelectedPath: string | null; // Anchor path for range selection
}

const fileTreeSelectionInitialState: FileTreeSelectionState = {
  selectedPaths: new Set(),
  lastSelectedPath: null,
};

export const fileTreeSelectionStore = atom<FileTreeSelectionState>(fileTreeSelectionInitialState);

/**
 * Toggles or sets a single path selection.
 * Should typically be called by FileExplorer.
 */
export const setSelectedPath = (path: string, mode: 'single' | 'toggle' = 'single') => {
  fileTreeSelectionStore.set(state => {
    const newSelectedPaths = new Set(state.selectedPaths);
    let newLastSelectedPath = path;

    if (mode === 'toggle') {
      if (newSelectedPaths.has(path)) {
        newSelectedPaths.delete(path);
        // If we untoggle the last selected, clear the anchor
        if (state.lastSelectedPath === path) {
             newLastSelectedPath = null;
        } else {
             newLastSelectedPath = state.lastSelectedPath;
        }
      } else {
        newSelectedPaths.add(path);
      }
    } else { // 'single' selection
      newSelectedPaths.clear();
      newSelectedPaths.add(path);
    }
    
    return {
      selectedPaths: newSelectedPaths,
      lastSelectedPath: newLastSelectedPath,
    };
  });
};

/**
 * Clears all selections.
 */
export const clearSelections = () => {
    fileTreeSelectionStore.set(fileTreeSelectionInitialState);
};


// --- Context Menu Management ---

interface FileTreeContextMenuState extends ContextMenuState {
  entries: IFileSystemEntry[]; // Selected entries, or just the clicked one
  anchorPath: string; // The specific path that was right-clicked
}


const fileTreeContextMenuInitialState: FileTreeContextMenuState = {
  isOpen: false,
  position: null, // Initial position is null to prevent flashing at default coordinates
  entries: [],
  anchorPath: '',
};

export const fileTreeContextMenuStore = atom<FileTreeContextMenuState | null>(fileTreeContextMenuInitialState);

/**
 * Opens the context menu at the specified location with the corresponding file system entry(ies).
 * @param event The React Mouse Event containing client X/Y coordinates.
 * @param entries The IFileSystemEntry array associated with the right-clicked item(s).
 * @param anchorPath The specific path that was right-clicked (used for single-entry actions).
 */
export const openFileTreeContextMenu = (
  event: React.MouseEvent,
  entries: IFileSystemEntry[],
  anchorPath: string,
) => {
  // Prevent the default browser context menu
  //event.preventDefault(); 
  
  const position: ContextMenuPosition  = {x:event.clientX, y: event.clientY};
  fileTreeContextMenuStore.set({
    isOpen: true,
    position,
    entries,
    anchorPath,
  });
};

/**
 * Closes the context menu and clears the associated entries.
 */
export const closeFileTreeContextMenu = () => {
  fileTreeContextMenuStore.set(fileTreeContextMenuInitialState);
};

// Expose internal state accessors if needed, but simple actions are usually preferred for nanostores
export const getFileTreeContextMenuEntries = () => fileTreeContextMenuStore.get().entries;

// Export ContextMenuPosition and ContextMenuState types for use by FileExplorerContextMenu
export { ContextMenuPosition, ContextMenuState };

