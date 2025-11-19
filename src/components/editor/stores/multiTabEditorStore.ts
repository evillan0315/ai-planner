import { atom } from 'nanostores';
import { fileExplorerService } from '@/components/file-explorer/api/fileExplorerService';
import * as path from 'path-browserify';
import { IMAGE_MIME_TYPES, VIDEO_MIME_TYPES, AUDIO_MIME_TYPES } from '@/constants';
import type { IFileSystemEntry } from '@/components/file-explorer/types';
import { closeEditor } from './editorStore'; // Use closeEditor for consistency/cleanup

/**
 * Represents the content and state of a single file tab.
 */
export interface IEditorTab {
  id: string; // File path
  name: string; // File name
  filePath: string;
  content: string; // Original content
  draftContent: string;
  mimeType?: string;
  language?: string;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;
}

interface MultiTabEditorState {
  tabs: IEditorTab[];
  activeTabId: string | null;
  isInitializing: boolean; // Tracks if the store is loading the first tab based on URL
}

const INITIAL_STATE: MultiTabEditorState = {
  tabs: [],
  activeTabId: null,
  isInitializing: false,
};

export const multiTabEditorStore = atom<MultiTabEditorState>(INITIAL_STATE);

/**
 * Helper to update a specific tab by ID immutably.
 */
const updateTabInStore = (tabId: string, update: Partial<IEditorTab>) => {
  const current = multiTabEditorStore.get();
  const index = current.tabs.findIndex(t => t.id === tabId);

  if (index !== -1) {
    const newTabs = [...current.tabs];
    newTabs[index] = { ...newTabs[index], ...update };
    multiTabEditorStore.set({ ...current, tabs: newTabs });
  }
};

/**
 * Opens a new tab or activates an existing one based on the file path.
 */
export const openTab = async (filePath: string) => {
  const current = multiTabEditorStore.get();
  const normalizedPath = path.normalize(filePath.replace(/\\/g, '/'));

  // 1. If already open, just activate it
  if (current.tabs.some(t => t.id === normalizedPath)) {
    setActiveTab(normalizedPath);
    return;
  }

  // 2. Prevent opening media files in the multi-tab editor pane
  const extension = normalizedPath.split('.').pop()?.toLowerCase() || '';
  // Note: We don't have mimeType easily here, so we rely on extension/assume non-media unless known.
  // The media files are handled by openFloatingWindow via openFileInEditor (which should be called if coming from FileExplorer).

  const newTab: IEditorTab = {
    id: normalizedPath,
    name: path.basename(normalizedPath),
    filePath: normalizedPath,
    content: '',
    draftContent: '',
    hasUnsavedChanges: false,
    isLoading: true,
    error: null,
  };

  multiTabEditorStore.set({ 
    ...current, 
    tabs: [...current.tabs, newTab], 
    activeTabId: normalizedPath, 
    isInitializing: false 
  });

  // 3. Fetch content
  try {
    const response = await fileExplorerService.readFileContent(normalizedPath);
    
    const finalLanguage = response.language || extension;
    const finalMimeType = response.mimeType || '';

    // Check if the file is media based on fetched MIME type, if so, close tab and inform user (or handle error)
    if (IMAGE_MIME_TYPES.has(finalMimeType) || VIDEO_MIME_TYPES.has(finalMimeType) || AUDIO_MIME_TYPES.has(finalMimeType)) {
        // Media files should be handled by floating windows (via FileExplorer -> openFileInEditor)
        // We allow the tab to open temporarily but might want to display an error or close it here.
        // For now, we load it, but the viewer will display the media/warning.
    }
    
    updateTabInStore(normalizedPath, {
      isLoading: false,
      content: response.content,
      draftContent: response.content, 
      language: finalLanguage,
      mimeType: finalMimeType,
      error: null,
    });
  } catch (err: unknown) {
    const errorMessage = (err as Error).message || `Failed to load file content for ${normalizedPath}.`;
    updateTabInStore(normalizedPath, {
      isLoading: false,
      error: errorMessage,
    });
  }
};

/**
 * Closes a tab by ID.
 */
export const closeTab = (tabId: string) => {
  const current = multiTabEditorStore.get();
  const tabToClose = current.tabs.find(t => t.id === tabId);

  if (tabToClose?.hasUnsavedChanges && !window.confirm(`You have unsaved changes in ${tabToClose.name}. Are you sure you want to close?`)) {
      return; // Do not close
  }

  const newTabs = current.tabs.filter(t => t.id !== tabId);
  let newActiveTabId = current.activeTabId;

  if (tabId === current.activeTabId) {
    // If the active tab is closed, activate the closest neighbor
    if (newTabs.length > 0) {
      const currentIndex = current.tabs.findIndex(t => t.id === tabId);
      const nextIndex = Math.min(currentIndex, newTabs.length - 1);
      newActiveTabId = newTabs[nextIndex]?.id || newTabs[0]?.id || null;
    } else {
      newActiveTabId = null;
    }
  }

  multiTabEditorStore.set({ 
      ...current, 
      tabs: newTabs, 
      activeTabId: newActiveTabId 
  });
  
  // If no tabs remain, ensure the singleton drawer editor is also closed (for layout consistency)
  if (newTabs.length === 0) {
      closeEditor(); 
  }
};

/**
 * Sets the active tab ID.
 */
export const setActiveTab = (tabId: string) => {
  const current = multiTabEditorStore.get();
  if (current.activeTabId !== tabId) {
    multiTabEditorStore.set({ ...current, activeTabId: tabId });
  }
};

/**
 * Updates the draft content for the active tab.
 */
export const updateActiveTabDraft = (newContent: string) => {
  const current = multiTabEditorStore.get();
  const activeTabId = current.activeTabId;

  if (!activeTabId) return;
  
  const activeTab = current.tabs.find(t => t.id === activeTabId);
  if (!activeTab) return;
  
  const hasChanged = newContent !== activeTab.content;

  updateTabInStore(activeTabId, {
    draftContent: newContent,
    hasUnsavedChanges: hasChanged,
  });
};

/**
 * Saves the draft content of the active tab back to the server.
 */
export const saveActiveTabContent = async () => {
    const current = multiTabEditorStore.get();
    const activeTabId = current.activeTabId;

    if (!activeTabId) return { success: false, message: 'No active tab.' };

    const tab = current.tabs.find(t => t.id === activeTabId);
    if (!tab || !tab.hasUnsavedChanges) {
        return { success: false, message: 'No changes detected.' };
    }

    updateTabInStore(activeTabId, { isLoading: true, error: null });

    try {
        const result = await fileExplorerService.writeFileContent(tab.filePath, tab.draftContent);
        
        if (result.success) {
            // Update original content to match draft
            updateTabInStore(activeTabId, {
                isLoading: false,
                content: tab.draftContent, // Original content is now the saved draft
                hasUnsavedChanges: false,
                error: null,
            });
            return { success: true, message: result.message };
        } else {
            throw new Error(result.message || 'Save operation failed.');
        }

    } catch (err: unknown) {
        const errorMessage = (err as Error).message || 'Failed to save file.';
        updateTabInStore(activeTabId, {
            isLoading: false,
            error: errorMessage,
        });
        return { success: false, message: errorMessage };
    }
};
