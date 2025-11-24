import { atom } from 'nanostores';
import { fileExplorerService } from '@/components/file-explorer/api/fileExplorerService';
import type { IFileSystemEntry } from '@/components/file-explorer/types';
import { IMAGE_MIME_TYPES, VIDEO_MIME_TYPES, AUDIO_MIME_TYPES } from '@/constants'; // Import constants
import { openFloatingWindow } from './floatingWindowsStore'; // IMPORT NEW STORE ACTION
import * as path from 'path-browserify'; // ADDED: path utility for base name extraction
import { startGlobalLoading, stopGlobalLoading } from '@/components/ui/loader/stores/loadingStore';
/**
 * Represents the content and state of the currently open file in the editor/viewer.
 */
export interface IEditorContent {
  filePath: string;
  content: string;
  mimeType?: string; // MIME type reported by server
  language?: string; // Monaco language ID
}

interface EditorState {
  isOpen: boolean;
  fileEntry: IFileSystemEntry | null; // The metadata of the file being edited/viewed
  content: IEditorContent | null;
  isLoading: boolean;
  error: string | null;
  // State for content modification
  hasUnsavedChanges: boolean;
  draftContent: string | null;
  // isMediaFile: boolean; // REMOVED: Moved concern to floatingWindowsStore
}

const INITIAL_STATE: EditorState = {
  isOpen: false,
  fileEntry: null,
  content: null,
  isLoading: false,
  error: null,
  hasUnsavedChanges: false,
  draftContent: null,
  // isMediaFile: false, // Default to false
};

export const editorStore = atom<EditorState>(INITIAL_STATE);

const createMinimalEntry = (filePath: string): IFileSystemEntry => ({
    name: path.basename(filePath),
    path: filePath,
    isDirectory: false,
    type: 'file',
});


/**
 * Action to load file content directly into the editor store based on path. 
 * This is used for singleton viewer usage (e.g., Code Drawer).
 * @param filePath The absolute path of the file to load.
 */
export const loadFileContentFromPath = async (filePath: string) => {
    const entry = createMinimalEntry(filePath);

    // 1. Set loading state
    // Note: We assume this is only called when mounting a singleton viewer, NOT the multi-tab dedicated route.
    editorStore.set({
        ...INITIAL_STATE, // Clear previous state fully
        fileEntry: entry,
        isLoading: true,
        isOpen: false, // Dedicated routes don't use the drawer, so ensure the flag is false
    });
    startGlobalLoading(`Loading ${entry.name}...`); 
    try {
        const language = entry.path.match(/\.[^.]+$/)?.[1] || 'plaintext';
        const mimeType = entry.mimeType || '';

        // Read content
        const response = await fileExplorerService.readFileContent(entry.path);
        
        const finalLanguage = response.language || language;
        const finalMimeType = response.mimeType || mimeType;

        const contentState: IEditorContent = {
            filePath: response.filePath,
            content: response.content,
           mimeType: finalMimeType,
            language: finalLanguage,
        };
        
        editorStore.set({
            ...editorStore.get(),
            isLoading: false,
            content: contentState,
            draftContent: response.content, // Initialize draft content
            error: null,
        });
        stopGlobalLoading();
    } catch (err: unknown) {
        const errorMessage = (err as Error).message || `Failed to load file content for ${filePath}.`;
        editorStore.set({
            ...editorStore.get(),
            isLoading: false,
           error: errorMessage,
        });
        stopGlobalLoading();
    }
};



/**
 * Action to open the editor/viewer drawer and initiate file content fetching.
 * @param entry The file system entry (metadata) to load.
 */
export const openFileInEditor = async (entry: IFileSystemEntry) => {
  // Determine if it's a media file based on mime type 
  const isMedia = IMAGE_MIME_TYPES.has(entry.mimeType || '') || 
                  VIDEO_MIME_TYPES.has(entry.mimeType || '') ||
                  AUDIO_MIME_TYPES.has(entry.mimeType || '');
  
  if (isMedia) {
      // Delegate media viewing to the floating window manager
      closeEditor(); // Ensure drawer is closed if open
      await openFloatingWindow(entry);
      return;
  }
  
  // Handle code/text files in the singleton drawer editor
  editorStore.set({
    ...INITIAL_STATE, // Reset previous state
    isOpen: true,
    fileEntry: entry,
    isLoading: true,
    // isMediaFile: isMedia, // REMOVED
  });
  startGlobalLoading(`Loading ${entry.name}...`);
  try {
    
    const language = entry.path.match(/\.[^.]+$/)?.[1] || 'plaintext';
    const mimeType = entry.mimeType || '';

    // Read content for text/code files
    const response = await fileExplorerService.readFileContent(entry.path);
    
    // Update language/mimeType if server provided better info (rare, but possible)
    const finalLanguage = response.language || language;
    const finalMimeType = response.mimeType || mimeType;

    const contentState: IEditorContent = {
        filePath: response.filePath,
        content: response.content,
        mimeType: finalMimeType,
        language: finalLanguage,
    };
    
    editorStore.set({
      ...editorStore.get(),
      isLoading: false,
      content: contentState,
      draftContent: response.content, // Initialize draft content with fetched content
      error: null,
    });
    stopGlobalLoading();
  } catch (err: unknown) {
    const errorMessage = (err as Error).message || 'Failed to load file content.';
    editorStore.set({
      ...editorStore.get(),
      isLoading: false,
      error: errorMessage,
    });
    stopGlobalLoading();
  }
};

/**
 * Action to update the draft content being edited.
 */
export const updateDraftContent = (newContent: string) => {
    const current = editorStore.get();
    const originalContent = current.content?.content ?? '';
    
    // Simple change detection
    const hasChanged = newContent !== originalContent;

    editorStore.set({
        ...current,
        draftContent: newContent,
        hasUnsavedChanges: hasChanged,
    });
};

/**
 * Action to save the draft content back to the server.
 */
export const saveFileContent = async () => {
    const current = editorStore.get();
    const { draftContent, fileEntry, hasUnsavedChanges } = current;

    if (!fileEntry || !draftContent || !hasUnsavedChanges) {
        return { success: false, message: 'No file open or no changes detected.' };
    }

    editorStore.set({ ...current, isLoading: true, error: null });
    startGlobalLoading(`Saving ${fileEntry.name}...`);
    try {
        const result = await fileExplorerService.writeFileContent(fileEntry.path, draftContent);
        
        if (result.success) {
            // Update the official content to match the saved draft
            const newContentState: IEditorContent = {
                ...current.content!,
                content: draftContent,
            }
            editorStore.set({
                ...current,
                isLoading: false,
                content: newContentState,
                hasUnsavedChanges: false,
            });
            stopGlobalLoading();
            return { success: true, message: result.message };
        } else {
            throw new Error(result.message || 'Save operation failed.');
        }

    } catch (err: unknown) {
        const errorMessage = (err as Error).message || 'Failed to save file.';
        editorStore.set({
            ...editorStore.get(),
            isLoading: false,
            error: errorMessage,
        });
        stopGlobalLoading();
        return { success: false, message: errorMessage };
    }
}


/**
 * Action to close the editor/viewer drawer and reset state.
 */
export const closeEditor = () => {
  const current = editorStore.get();
  if (current.hasUnsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to close?")) {
      return; // Do not close
  }
  editorStore.set(INITIAL_STATE);
};

export const getEditorState = () => editorStore.get();
