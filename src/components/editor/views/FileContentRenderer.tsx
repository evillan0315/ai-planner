import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  SxProps,
} from '@mui/material';
import MonacoEditor from '@/components/editor/monaco/MonacoEditor';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';
import { getMonacoLanguage } from '@/utils/editorUtils';
import {
  CODE_MIME_TYPES,
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  AUDIO_MIME_TYPES,
  MARKDOWN_EXTENSIONS,
  HTML_EXTENSIONS,
} from '@/constants';
import type { IEditorContent } from '@/components/editor/stores/editorStore';
import type { IEditorTab } from '@/components/editor/stores/multiTabEditorStore';
import type { IWindowContent } from '@/components/editor/stores/floatingWindowsStore';
import type { IFileSystemEntry } from '@/components/file-explorer/types';

// --- Types ---

type EditorContentSource = (IEditorContent | IEditorTab | IWindowContent);

interface FileContentRendererProps {
    content: EditorContentSource;
    fileEntry: IFileSystemEntry | null;
    isLoading: boolean;
    error: string | null;
    draftContent: string | null;
    isContextualMode: boolean;
    // Actions for editable modes (Monaco)
    onSaveShortcut?: () => Promise<void>;
    onContentChange?: (value: string) => void;
    // Media streaming specific props (only used in Contextual mode)
    mediaStreamUrl?: string | null;
    mediaUrlLoading?: boolean;
    mediaUrlError?: string | null;
    // Prop for media players (if they become available)
    onRegisterPlayerAction?: (actions: Record<string, () => void>) => void;
}

type RendererType = 'code' | 'markdown' | 'image' | 'video' | 'audio' | 'iframe' | 'plaintext' | 'unsupported';

// --- Styles ---

const monacoContainerSx: SxProps = {
  height: '100%',
  width: '100%',
  padding: 0,
  minHeight: '200px', 
};

const markdownContainerSx: SxProps = {
    padding: 4,
    overflowY: 'auto',
    height: '100%',
};

const mediaContainerSx: SxProps = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
};

// --- Utilities ---

const determineRendererType = (fileContent: EditorContentSource | null): RendererType => {
    if (!fileContent) return 'unsupported'; 

    const { mimeType: type, filePath } = fileContent;
    const extension = filePath.split('.').pop()?.toLowerCase() || '';

    const contentString = (fileContent as IEditorTab).draftContent ?? fileContent.content;
    const isLargeFile = (contentString?.length || 0) > 1024 * 500; // 500KB limit

    if (MARKDOWN_EXTENSIONS.has(extension)) return 'markdown';
    if (HTML_EXTENSIONS.has(extension)) return 'iframe';
    
    // Media types
    if (IMAGE_MIME_TYPES.has(type || '')) return 'image';
    if (VIDEO_MIME_TYPES.has(type || '')) return 'video';
    if (AUDIO_MIME_TYPES.has(type || '')) return 'audio';
    
    // Code/Text (Monaco)
    if (CODE_MIME_TYPES.has(type || '') || !isLargeFile) {
        return 'code';
    }

    return 'plaintext';
};

/**
 * Renders the file content using the appropriate viewer (Monaco, Markdown, Image, Video, IFrame).
 */
export const FileContentRenderer: React.FC<FileContentRendererProps> = ({
    content,
    fileEntry,
    isLoading,
    error,
    draftContent,
    isContextualMode,
    onSaveShortcut,
    onContentChange,
    mediaStreamUrl,
    mediaUrlLoading,
    mediaUrlError,
    onRegisterPlayerAction,
}) => {
    
    const rendererType: RendererType = useMemo(() => determineRendererType(content), [content]);

    // Editable if NOT contextual AND content is code/plaintext
    const isCodeEditable = !isContextualMode && (rendererType === 'code' || rendererType === 'plaintext');
    
    // Determine content to display: draft first, then original
    const displayContent = draftContent ?? content?.content ?? '';
    
    // Note: The original implementation had VideoPlayer/AudioPlayer commented out.
    // We keep the structure ready but use an alert fallback for unsupported media players.
    const isMedia = rendererType === 'image' || rendererType === 'video' || rendererType === 'audio';

    
    // --- 1. Loading/Error State (Initial/Contextual) ---
    
    // Handle general loading, especially for initial contextual load or dedicated route loading.
    if (isLoading) {
         return (
             <Box className="flex flex-col items-center justify-center h-full">
                 <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }} color="text.secondary">
                    Loading {fileEntry?.name || 'Content'}...
                </Typography>
             </Box>
         );
    }
    
    if (error) {
        return (
            <Alert severity="error" className="m-4">
                Error loading content: {error}
            </Alert>
        );
    }

    if (!content) {
        return null; // Handled by orchestrator if no content/tab is active
    }
    

    // --- 2. Media Rendering (Image, Video, Audio) ---

    if (isMedia) {
        
        if (!isContextualMode) {
             return (
                <Alert severity="info" className="m-4">
                    Media files ({rendererType}) are typically opened in floating windows. Path: {fileEntry?.path}
                </Alert>
            );
        }

        if (mediaUrlLoading) {
            return (
                <Box className="flex justify-center items-center h-full">
                    <CircularProgress />
                    <Typography sx={{ml: 2}} color="text.secondary">Generating secured media stream URL...</Typography>
                </Box>
            );
        }
        
        if (mediaUrlError) {
            return (
                <Alert severity="error" className="m-4">
                    Error loading media stream: {mediaUrlError}
                </Alert>
            );
        }

        const url = mediaStreamUrl || fileEntry?.path; 

        if (url) {
            if (rendererType === 'image') {
                return (
                    <Box sx={mediaContainerSx}> 
                        <img 
                            src={url} 
                            alt={fileEntry?.name || 'File Preview'} 
                            className="w-full object-contain" 
                            style={{ maxHeight: '100%', maxWidth: '100%' }}
                        />
                    </Box>
                );
            }
            
            // Fallback for video/audio (since players were commented out in original FileEditorViewer)
             return (
                 <Alert severity="warning" className="m-4">
                     Media file ({rendererType}) found, but playback components (VideoPlayer/AudioPlayer) are currently unavailable or commented out.
                 </Alert>
             );
        }
        
        return <Alert severity="warning" className="m-4">Could not obtain media stream URL.</Alert>
    }
    
    // --- 3. HTML Rendering Logic ---
    if (rendererType === 'iframe') {
        return (
            <iframe
                srcDoc={displayContent}
                title={fileEntry?.name || 'HTML Viewer'}
                style={{ border: 0, width: '100%', height: '100%' }}
                sandbox="allow-scripts allow-same-origin" 
            />
        );
    }

    // --- 4. Markdown Rendering Logic ---
    if (rendererType === 'markdown') {
        return (
            <Box sx={markdownContainerSx}>
                <MarkdownRenderer content={displayContent} />
            </Box>
        );
    }
    
    // --- 5. Code/Plaintext (Monaco Editor) ---
    if (rendererType === 'code' || rendererType === 'plaintext') {
        const monacoLanguage = content.language || getMonacoLanguage(content.filePath);
        
        // The save/update actions come from the orchestrator (FileEditorViewer) which decides if it's multi-tab or singleton
        return (
            <Box sx={monacoContainerSx}>
                <MonacoEditor
                    value={displayContent}
                    onChange={isCodeEditable ? onContentChange : () => {}} 
                    language={monacoLanguage}
                    options={{
                        readOnly: !isCodeEditable,
                        minimap: { enabled: false },
                        wordWrap: 'on',
                    }}
                    onSaveShortcut={isCodeEditable ? onSaveShortcut : undefined}
                />
            </Box>
        );
    }

    // --- 6. Binary/Unsupported fallback ---
    return (
        <Alert severity="warning" className="m-4">
            Unsupported file type or file is too large for editor/viewer ({rendererType}).
            Path: {fileEntry?.path}
        </Alert>
    );
};

