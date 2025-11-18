

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom'; // ADDED
import * as path from 'path-browserify'; // ADDED
import { useStore } from '@nanostores/react';
import { editorStore, updateDraftContent, saveFileContent, IEditorContent, loadFileContentFromPath } from '@/components/editor/stores/editorStore'; 
import { IWindowContent } from '@/components/editor/stores/floatingWindowsStore'; // Import the new window content type
import type { IFileSystemEntry } from '@/components/file-explorer/types'; // Import IFileSystemEntry

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  SxProps,
  Chip,
  useTheme
} from '@mui/material';
import MonacoEditor from '@/components/editor/monaco/MonacoEditor';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';
import  { getMonacoLanguage } from '@/utils/editorUtils';
import  {
  CODE_MIME_TYPES,
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  AUDIO_MIME_TYPES,
  MARKDOWN_EXTENSIONS,
  HTML_EXTENSIONS,
} from '@/constants';
import { fileExplorerService } from '@/components/file-explorer/api/fileExplorerService'; // Import service
import AudioPlayer from '@/components/ui/player/AudioPlayer'; // ADDED Import AudioPlayer
import VideoPlayer from '@/components/ui/player/VideoPlayer'; // NEW Import VideoPlayer


interface FileEditorViewerProps {
    onClose: () => void;
    // Context props passed when used inside a Floating Window
    contextEntry?: IFileSystemEntry | null;
    contextContent?: IWindowContent | null;
    contextIsLoading?: boolean;
    contextError?: string | null;
    // NEW PROP: Function to register player actions back to the wrapper (FRDB)
    onRegisterPlayerAction?: (actions: Record<string, () => void>) => void;
}

// Define conditional styles based on whether it is media or code/text
const getContainerSx = (isMedia: boolean): SxProps => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  // Remove padding if it's media, as the Dialog wrapper in Layout.tsx handles padding.
  p: 0,
});

const contentContainerSx: SxProps = {
  flexGrow: 1,
  //minHeight: '200px', // Minimum space for content
  overflow: 'auto',
  position: 'relative',
  height: '100%',
};

const monacoContainerSx: SxProps = {
  height: '100%',
  width: '100%',
  padding: 0,
  minHeight: '500px',
};


/**
 * Renders the file content using the appropriate viewer (Monaco, Markdown, Image, Video, IFrame).
 * It can operate in two modes:
 * 1. Singleton (reading from global editorStore, typically for the code editor drawer).
 * 2. Contextual (reading from props, typically for floating media viewers).
 */
const FileEditorViewer: React.FC<FileEditorViewerProps> = ({
    onClose,
    contextEntry,
    contextContent,
    contextIsLoading,
    contextError,
    onRegisterPlayerAction, // NEW
}) => {
  const theme = useTheme();
  const [searchParams] = useSearchParams(); 
  // Determine if we are running in Contextual (Floating Box) Mode
  const isContextualMode = !!contextEntry;
  
  const urlPath = searchParams.get('path');
  const decodedUrlPath = urlPath ? decodeURIComponent(urlPath) : null;
  console.log(decodedUrlPath, 'decodedUrlPath');
  // Dedicated route mode: Not contextual and has a path parameter
  const isDedicatedRouteMode = !isContextualMode && !!decodedUrlPath;
  
  // Use a flag to track if route initialization is done to prevent infinite loops
  const [isRouteInitialized, setIsRouteInitialized] = useState(false);

  // 1. Get State: Prioritize context props if available, otherwise use global store
  const globalState = useStore(editorStore);
  
  
    // --- Route Initialization Effect ---
  // If we are in dedicated route mode, load the file content based on the URL path.
 useEffect(() => {
     
    if (isDedicatedRouteMode && !isRouteInitialized) {
        const currentStorePath = globalState.fileEntry?.path;
       
        // Only trigger loading if the requested path is different or if the content is missing
        if (currentStorePath !== decodedUrlPath || !globalState.content) {
            
            // We set the state to loading immediately via the store action
            loadFileContentFromPath(decodedUrlPath!)
                .then(() => setIsRouteInitialized(true))
                .catch(() => setIsRouteInitialized(true)); // Mark initialized even on failure
        } else {
            // Path matches, content loaded
            setIsRouteInitialized(true);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  
  const fileEntry = isContextualMode ? contextEntry : globalState.fileEntry;
  const content = isContextualMode ? contextContent : globalState.content;
  // Determine final loading state: 
  // If we are in dedicated route mode and haven't initialized yet, or if global store is loading, show loading.
  const isLoading = isContextualMode 
    ? contextIsLoading 
    : (globalState.isLoading || (isDedicatedRouteMode && !isRouteInitialized));
    
  const error = isContextualMode ? contextError : globalState.error;
  
  // Draft content/saving only applies to the singleton Code Editor Drawer
  const draftContent = isContextualMode ? null : globalState.draftContent;
  const hasUnsavedChanges = isContextualMode ? false : globalState.hasUnsavedChanges;
  
  // Check if content implies media based on mimeType
  const mimeType = fileEntry?.mimeType || content?.mimeType || '';
  const isMedia = IMAGE_MIME_TYPES.has(mimeType) || 
                  VIDEO_MIME_TYPES.has(mimeType) || 
                  AUDIO_MIME_TYPES.has(mimeType);

  
  const determineRenderer = (fileContent: (IEditorContent | IWindowContent) | null) => {
    if (!fileContent) return 'code'; // Default to code editor if no content info

    const { mimeType: type, filePath, content } = fileContent;
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    // Use a smaller limit for contextual viewer if content is large (though we usually skip content for media)
    const isLargeFile = (content?.length || 0) > 1024 * 500; // 500KB limit

    // 1. Markdown
    if (MARKDOWN_EXTENSIONS.has(extension)) {
      return 'markdown';
    }

    // 2. HTML (Rendered in iframe for safety and layout accuracy)
    if (HTML_EXTENSIONS.has(extension)) {
      return 'iframe';
    }

    // 3. Media types (These should only happen in Contextual Mode)
    if (IMAGE_MIME_TYPES.has(type)) return 'image';
    if (VIDEO_MIME_TYPES.has(type)) return 'video';
    if (AUDIO_MIME_TYPES.has(type)) return 'audio';
    
    // 4. Code/Text (Monaco)
    // In Contextual Mode, this is read-only. In Singleton Mode, it's editable.
    if (CODE_MIME_TYPES.has(type) || !isLargeFile) {
        return 'code';
    }

    // 5. Binary/Large File Fallback
    return 'plaintext';
  };

  const rendererType = useMemo(() => determineRenderer(content), [content]);
  const isHtml = rendererType === 'iframe';
  
  // Access media streaming URL from context content if available
  // This is only relevant in Contextual Mode
  const mediaStreamUrl = isContextualMode 
    ? (content as IWindowContent)?.mediaStreamUrl 
    : null;
  const mediaUrlLoading = isContextualMode 
    ? (content as IWindowContent)?.mediaUrlLoading 
    : false;
  const mediaUrlError = isContextualMode 
    ? (content as IWindowContent)?.mediaUrlError 
    : null;
    
  // FIX: Use useCallback to ensure a stable function reference for the VideoPlayer's prop.
  // This prevents the VideoPlayer's useEffect hook from repeatedly running cleanup/setup cycles
  // during parent re-renders (like resizing the FloatingResizableDraggableBox).
  const handleRegisterFullscreen = useCallback((requestFullscreenFn: (() => void) | null) => {
    if (onRegisterPlayerAction) {
        if (requestFullscreenFn) {
            onRegisterPlayerAction({ requestFullscreen: requestFullscreenFn });
        }
    }
  }, [onRegisterPlayerAction]);


  const renderContent = () => {
    if (!content) return null;
    
    const isCodeEditable = !isContextualMode && (rendererType === 'code' || rendererType === 'plaintext');
    
    // --- Media Rendering Logic using stream URL (new implementation) ---
    if (isMedia) {
        if (isLoading || mediaUrlLoading) {
            return (
                <Box className="flex justify-center items-center h-full">
                    <CircularProgress />
                    <Typography sx={{ml: 2}} color="text.secondary">Generating secured media stream URL...</Typography>
                </Box>
            );
        }
        
        if (error || mediaUrlError) {
            return (
                <Alert severity="error">
                    Error loading media stream: {error || mediaUrlError}
                </Alert>
            );
        }

        const url = mediaStreamUrl || fileEntry?.path; // Fallback to path if URL isn't required/available but stream is not used

        if (url) {
            if (rendererType === 'image') {
                return (
                    <Box className="flex justify-center items-center w-full h-full"> 
                        <img 
                            src={url} 
                            alt={fileEntry?.name || 'File Preview'} 
                            className="w-full object-contain" // Use object-contain for floating boxes
                            style={{ maxHeight: '100%', maxWidth: '100%' }}
                        />
                    </Box>
                );
            }
            
            if (rendererType === 'video') {
                // Use the new VideoPlayer component
                return (
                    <Box className="flex justify-center items-center h-full">
                        <VideoPlayer 
                            src={url} 
                            fileName={fileEntry?.name} 
                            // Register the fullscreen action to the parent FRDB wrapper
                            onRequestFullscreenReady={handleRegisterFullscreen} // Use stable callback
                        />
                    </Box>
                );
            }
            
            // Audio rendering
            if (rendererType === 'audio') {
                // Ensure fullscreen action is unregistered if we switch from video to audio
                // FIX: Removed call to onRegisterPlayerAction({}) here as it causes re-render churn during resize
                return (
                    <Box className="flex justify-center items-center h-full p-1"> {/* Added padding for audio controls */}
                        <AudioPlayer src={url} fileName={fileEntry?.name} />
                    </Box>
                );
            }
        }
        
        // Fallback case if media type is detected but URL isn't available
        return <Alert severity="warning">Could not display media content. Check file path permissions.</Alert>
    }
    
    // Non-media file rendering. Ensure actions are cleared.
    // FIX: Removed call to onRegisterPlayerAction({}) here as it causes re-render churn during resize

    // --- HTML Rendering Logic (Keeps client-side encoding for now, since this is smaller/text-based) ---
    if (isHtml) {
        // Use srcDoc for displaying HTML content directly from the string
        // Note: This is read-only view
        return (
            <iframe
                srcDoc={content.content}
                title={fileEntry?.name || 'HTML Viewer'}
                style={{ border: 0, width: '100%', height: '100%' }}
                sandbox="allow-scripts allow-same-origin" // Basic sandboxing
            />
        );
    }


    if (rendererType === 'markdown') {
        // Markdown viewer (read-only for contextual, uses draft for singleton)
        const displayContent = isContextualMode 
            ? content.content 
            : (draftContent || content.content);

        return (
            <Box className="p-4">
                <MarkdownRenderer content={displayContent} />
            </Box>
        );
    }
    
    // Default to Monaco Editor for code and plaintext
    const monacoLanguage = content.language || getMonacoLanguage(content.filePath);
    
    if (rendererType === 'code' || rendererType === 'plaintext') {
        return (
            <Box sx={monacoContainerSx}>
                <MonacoEditor
                    value={draftContent || content.content}
                    onChange={isCodeEditable ? updateDraftContent : () => {}} // Only allow changing if editable
                    language={monacoLanguage}
                    options={{
                        readOnly: !isCodeEditable,
                        minimap: { enabled: true },
                        wordWrap: 'on',
                    }}
                    // Pass save function only if editable
                    onSaveShortcut={isCodeEditable ? saveFileContent : undefined}
                />
            </Box>
        );
    }

    // Binary/Unsupported fallback
    return (
        <Alert severity="warning">
            Unsupported file type or file is too large for editor/viewer ({rendererType}).
            Path: {fileEntry?.path}
        </Alert>
    );
  };
  
  if (isLoading) {
     return (
         <Box className="flex flex-col items-center justify-center h-full">
             <CircularProgress />

            <Typography variant="h6" sx={{ mt: 2 }}>
                Loading {fileEntry?.name || (decodedUrlPath ? path.basename(decodedUrlPath) : 'file')}...
            </Typography>
         </Box>
     );
   }
 
  // If we are in Route Mode and initialization failed or fileEntry is null, show error/empty state
  if (!fileEntry && isDedicatedRouteMode && isRouteInitialized && !error) {
      return (
          <Box sx={{ p: 2 }}>
              <Alert severity="error">
                  No file content loaded or specified. Path: {decodedUrlPath || 'None'}
              </Alert>
          </Box>
      );
  }


  if (error) {
    return (
        <Box sx={{ p: 2 }}>
            <Alert severity="error">
                Failed to load file: {error}
            </Alert>
        </Box>
    );
  }

  return (
    <Box sx={getContainerSx(isMedia)}> {/* Use dynamic container styles */}
      {/* Status Bar (Only visible for the main code editor drawer) */}
      {!isMedia && !isContextualMode && (
        <Box className="flex justify-between items-center px-4 py-3" sx={{borderBottom: `1px solid ${theme.palette.divider}}`}}>
          <Typography variant="subtitle2" color="text.secondary">
            Path: <span className="font-mono">{fileEntry?.path}</span>
          </Typography>
          {hasUnsavedChanges && (
              <Chip 
                  label="Unsaved Changes" 
                  color="warning" 
                  size="small" 
                  className="animate-pulse" 
              />
          )}
        </Box>
      )}
      
      {/* Contextual Mode Info Bar (Optional) 
      {isContextualMode && (
          <Box className="flex justify-between items-center px-4 py-3">
              <Typography variant="caption" color="text.secondary">
                  Path: <span className="font-mono">{fileEntry?.path}</span>
              </Typography>
        
          </Box>
      )}
      */}
      <Box sx={contentContainerSx}>
        {renderContent()}
      </Box>
      {!isMedia && !isContextualMode && (
        <Box className="flex justify-between items-center px-4 py-1" sx={{backgroundColor: theme.palette.background.default, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="caption" color="text.secondary">
                  Path: <span className="font-mono">{fileEntry?.path}</span>
              </Typography>
          </Box>
       )}
    </Box>
  );
};

export default FileEditorViewer;
