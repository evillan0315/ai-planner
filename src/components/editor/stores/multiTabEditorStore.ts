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
  id: string; // File path (used as unique key)
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
  activeTabIndex: number | null; // Tracks the array index of the active tab
  isInitializing: boolean; // Tracks if the store is loading the first tab based on URL
}

const INITIAL_STATE: MultiTabEditorState = {
  tabs: [],
  activeTabIndex: null,
  isInitializing: false,
};

export const multiTabEditorStore = atom<MultiTabEditorState>(INITIAL_STATE);

/**
 * Helper to update a specific tab by ID immutably.
 * Used primarily for asynchronous updates when only the file path (ID) is known.
 */
const updateTabInStoreById = (tabId: string, update: Partial<IEditorTab>) => {
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
  const normalizedPath = path.normalize(filePath.replace(/\/g, '/'));

  // 1. If already open, just activate it
  const existingIndex = current.tabs.findIndex(t => t.id === normalizedPath);
  if (existingIndex !== -1) {
    setActiveTab(existingIndex);
    return;
  }

  // 2. Prevent opening media files in the multi-tab editor pane
  const extension = normalizedPath.split('.').pop()?.toLowerCase() || '';
  // Note: We don't have mimeType easily here, so we rely on extension/assume non-media unless known.

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

  const newTabs = [...current.tabs, newTab];
  const newActiveIndex = newTabs.length - 1; // Index of the new tab

  multiTabEditorStore.set({ 
    ...current, 
    tabs: newTabs, 
    activeTabIndex: newActiveIndex, // Set active index
    isInitializing: false 
  });

  // 3. Fetch content
  try {
    const response = await fileExplorerService.readFileContent(normalizedPath);
    
    const finalLanguage = response.language || extension;
    const finalMimeType = response.mimeType || '';

    // Check if the file is media based on fetched MIME type, if so, close tab and inform user (or handle error)
    if (IMAGE_MIME_TYPES.has(finalMimeType) || VIDEO_MIME_TYPES.has(finalMimeType) || AUDIO_MIME_TYPES.has(finalMimeType)) {
        // Viewer will handle displaying media files with a warning if needed.
    }
    
    updateTabInStoreById(normalizedPath, {
      isLoading: false,
      content: response.content,
      draftContent: response.content, 
      language: finalLanguage,
      mimeType: finalMimeType,
      error: null,
    });
  } catch (err: unknown) {
    const errorMessage = (err as Error).message || `Failed to load file content for ${normalizedPath}.`;
    updateTabInStoreById(normalizedPath, {
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
  const indexToClose = current.tabs.findIndex(t => t.id === tabId);

  if (indexToClose === -1) return;
  
  const tabToClose = current.tabs[indexToClose];

  if (tabToClose?.hasUnsavedChanges && !window.confirm(`You have unsaved changes in ${tabToClose.name}. Are you sure you want to close?`)) {
      return; // Do not close
  }

  const newTabs = current.tabs.filter((t, index) => index !== indexToClose);
  let newActiveTabIndex: number | null = current.activeTabIndex;

  if (indexToClose === current.activeTabIndex) {
    // If the active tab is closed, activate the closest neighbor
    if (newTabs.length > 0) {
      // Calculate the index of the next active tab
      const nextIndex = Math.min(indexToClose, newTabs.length - 1);
      newActiveTabIndex = nextIndex;
    } else {
      newActiveTabIndex = null;
    }
  } else if (current.activeTabIndex !== null && indexToClose < current.activeTabIndex) {
      // If a tab before the active tab is closed, shift the active tab index left by 1
      newActiveTabIndex = current.activeTabIndex - 1;
  }

  multiTabEditorStore.set({ 
      ...current, 
      tabs: newTabs, 
      activeTabIndex: newActiveTabIndex, 
  });
  
  // If no tabs remain, ensure the singleton drawer editor is also closed (for layout consistency)
  if (newTabs.length === 0) {
      closeEditor(); 
  }
};

/**
 * Sets the active tab index.
 */
export const setActiveTab = (index: number | null) => {
  const current = multiTabEditorStore.get();
  if (current.activeTabIndex !== index) {
    // Ensure index is valid if not null
    const finalIndex = (index !== null && index >= 0 && index < current.tabs.length) ? index : null;
    multiTabEditorStore.set({ ...current, activeTabIndex: finalIndex });
  }
};

/**
 * Updates the draft content for the active tab.
 */
export const updateActiveTabDraft = (newContent: string) => {
  const current = multiTabEditorStore.get();
  const activeTabIndex = current.activeTabIndex;

  if (activeTabIndex === null || activeTabIndex < 0 || activeTabIndex >= current.tabs.length) return;
  
  const activeTab = current.tabs[activeTabIndex];
  if (!activeTab) return;
  
  const hasChanged = newContent !== activeTab.content;

  const newTabs = [...current.tabs];
  newTabs[activeTabIndex] = {
    ...activeTab,
    draftContent: newContent,
    hasUnsavedChanges: hasChanged,
  };
  
  multiTabEditorStore.set({ ...current, tabs: newTabs });
};

/**
 * Saves the draft content of the active tab back to the server.
 */
export const saveActiveTabContent = async () => {
    const current = multiTabEditorStore.get();
    const activeTabIndex = current.activeTabIndex;

    if (activeTabIndex === null || activeTabIndex < 0 || activeTabIndex >= current.tabs.length) return { success: false, message: 'No active tab.' };

    const tab = current.tabs[activeTabIndex];
    if (!tab || !tab.hasUnsavedChanges) {
        return { success: false, message: 'No changes detected.' };
    }

    // Set loading state on the specific tab via temporary full state update
    const tabsLoading = [...current.tabs];
    tabsLoading[activeTabIndex] = { ...tab, isLoading: true, error: null };
    multiTabEditorStore.set({ ...current, tabs: tabsLoading });

    try {
        const result = await fileExplorerService.writeFileContent(tab.filePath, tab.draftContent);
        
        if (result.success) {
            // Update original content to match draft and clear unsaved flags
            const newTabs = [...current.tabs];
            newTabs[activeTabIndex] = {
                ...tab,
                isLoading: false,
                content: tab.draftContent, // Original content is now the saved draft
                draftContent: tab.draftContent, // Ensure draft is consistent with new content
                hasUnsavedChanges: false,
                error: null,
            };
            multiTabEditorStore.set({ ...current, tabs: newTabs });
            
            return { success: true, message: result.message };
        } else {
            throw new Error(result.message || 'Save operation failed.');
        }

    } catch (err: unknown) {
        const errorMessage = (err as Error).message || 'Failed to save file.';
        
        // Revert loading state and set error on the tab
        const newTabs = [...current.tabs];
        newTabs[activeTabIndex] = {
            ...tab,
            isLoading: false,
            error: errorMessage,
        };
        multiTabEditorStore.set({ ...current, tabs: newTabs });

        return { success: false, message: errorMessage };
    }
};