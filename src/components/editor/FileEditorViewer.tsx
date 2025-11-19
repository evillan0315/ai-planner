import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as path from 'path-browserify';
import { useStore } from '@nanostores/react';
import { editorStore, updateDraftContent, saveFileContent, IEditorContent, loadFileContentFromPath, closeEditor } from '@/components/editor/stores/editorStore'; 
import { IWindowContent } from '@/components/editor/stores/floatingWindowsStore';
import type { IFileSystemEntry } from '@/components/file-explorer/types';
import { ContentLayout } from '@/components/ui/layouts/ContentLayout'; // NEW IMPORT
import type { GlobalAction } from '@/components/ui/GlobalActionButton'; // NEW IMPORT

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  SxProps,
  Chip,
  useTheme,
  Tabs, // NEW
  Tab, // NEW
  IconButton, // NEW
  Tooltip, // NEW
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close'; // NEW IMPORT
import SaveIcon from '@mui/icons-material/Save'; // NEW IMPORT
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
import AudioPlayer from '@/components/ui/player/AudioPlayer';
import VideoPlayer from '@/components/ui/player/VideoPlayer';


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
  height: '100%', // Crucial for embedding Monaco/Markdown viewers
};

const monacoContainerSx: SxProps = {
  height: '100%',
  width: '100%',
  padding: 0,
  minHeight: '500px',
};


/**
 * Renders the file content using the appropriate viewer (Monaco, Markdown, Image, Video, IFrame).
 * It can operate in three modes:
 * 1. Singleton (reading from global editorStore, typically for the code editor drawer).
 * 2. Contextual (reading from props, typically for floating media viewers).
 * 3. Dedicated Route (reading from global store, wrapped in ContentLayout).
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
  }, [searchParams, isDedicatedRouteMode]); 

  
  const fileEntry = isContextualMode ? contextEntry : globalState.fileEntry;
  const content = isContextualMode ? contextContent : globalState.content;
  
  // Determine final loading state: 
  const isLoading = isContextualMode 
    ? contextIsLoading 
    : (globalState.isLoading || (isDedicatedRouteMode && !isRouteInitialized));
    
  const error = isContextualMode ? contextError : globalState.error;
  
  // Draft content/saving
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
    // isCodeEditable logic relies on !isContextualMode, which covers both Drawer and Dedicated Route modes.
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
  const handleRegisterFullscreen = useCallback((requestFullscreenFn: (() => void) | null) => {
    if (onRegisterPlayerAction) {
        if (requestFullscreenFn) {
            onRegisterPlayerAction({ requestFullscreen: requestFullscreenFn });
        }
    }
  }, [onRegisterPlayerAction]);


  const renderContent = () => {
    if (!content) return null;
    
    // Editable if not contextual AND content is code/plaintext
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
    
    // --- HTML Rendering Logic ---
    if (isHtml) {
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
        // Markdown viewer (read-only for contextual, uses draft for singleton/dedicated route)
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

  // 2. Tab Renderer Function (Used by Dedicated Route Mode)
  const fileName = fileEntry?.name || (decodedUrlPath ? path.basename(decodedUrlPath) : 'Untitled');
  const fileId = fileEntry?.path || decodedUrlPath || 'editor-default-file';

  const renderFileTabs = (path: string, fileName: string, hasUnsavedChanges: boolean) => {
    const handleTabClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        closeEditor(); // Close editor state, resets view
    };

    return (
        <Tabs 
            value={path} 
            onChange={() => {}} // Tab is read-only/single selection
            variant="scrollable"
            scrollButtons="auto"
            sx={{
                height: '100%', 
                minHeight: '48px', 
                alignItems: 'flex-end', 
                borderBottom: 'none', 
                // Ensure Tabs container takes up the space in ContentLayout toolbar
                flexGrow: 1,
                justifyContent: 'flex-start',
            }}
        >
            <Tooltip title={path}>
                <Tab 
                    value={path}
                    label={
                        <Box className="flex items-center">
                            <Typography variant="body2" component="span" sx={{ mr: 1, fontStyle: hasUnsavedChanges ? 'italic' : 'normal' }}>
                                {fileName}
                                {hasUnsavedChanges && ' *'}
                            </Typography>
                            <IconButton 
                                size="small" 
                                sx={{ p: 0, ml: 1, color: 'text.secondary' }}
                                onClick={handleTabClose}
                            >
                                <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Box>
                    }
                    sx={{
                        minHeight: '48px',
                        py: 0,
                        px: 2,
                        textTransform: 'none',
                        // Styling to make it look like an active editor tab
                        '&.Mui-selected': {
                            backgroundColor: theme.palette.background.default, 
                            borderLeft: `1px solid ${theme.palette.divider}`,
                            borderRight: `1px solid ${theme.palette.divider}`,
                            borderBottom: 'none',
                            marginBottom: '-1px', // Overlay the toolbar bottom border
                        },
                        borderTopLeftRadius: theme.shape.borderRadius,
                        borderTopRightRadius: theme.shape.borderRadius,
                    }}
                />
            </Tooltip>
        </Tabs>
    );
  };

  // Actions for the dedicated route editor (Save if changes exist)
  const isCodeEditable = !isContextualMode && (rendererType === 'code' || rendererType === 'plaintext');

  const dedicatedRouteActions: GlobalAction[] = isCodeEditable && hasUnsavedChanges ? [
    {
      label: 'Save',
      action: saveFileContent,
      icon: <SaveIcon />,
      color: 'primary',
      variant: 'contained',
      disabled: isLoading, // Use global store loading state
      tooltip: 'Save file content (Ctrl+S)',
    },
  ] : [];

  // --- Conditional Rendering by Mode ---

  // 1. Contextual Mode (Floating Box)
  if (isContextualMode) {
    return (
      <Box sx={getContainerSx(isMedia)}> 
        {isLoading && (
             <Box className="flex flex-col items-center justify-center h-full">
                 <CircularProgress />

                <Typography variant="h6" sx={{ mt: 2 }}>
                    Loading {fileEntry?.name || 'File'}...
                </Typography>
             </Box>
         )}
         {error && (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">
                    Failed to load file: {error}
                </Alert>
            </Box>
         )}
         {!isLoading && !error && (
            <Box sx={contentContainerSx}>
                {renderContent()}
            </Box>
         )}
      </Box>
    );
  }

  // 2. Dedicated Route Mode (Uses ContentLayout)
  if (isDedicatedRouteMode) {
    let contentNode: React.ReactNode;
    let headerContentNode: React.ReactNode | null = null;

    if (isLoading) {
        contentNode = (
            <Box className="flex flex-col items-center justify-center h-full">
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    Loading {fileName}...
                </Typography>
            </Box>
        );
    } else if (error) {
        contentNode = (
            <Box sx={{ p: 4, height: '100%' }}>
                <Alert severity="error">
                    Failed to load file: {error}
                </Alert>
            </Box>
        );
    } else if (!fileEntry) {
        contentNode = (
            <Box sx={{ p: 4, height: '100%' }}>
                <Alert severity="info">
                    No file content loaded or specified. Path: {decodedUrlPath || 'None'}
                </Alert>
            </Box>
        );
    } else {
        headerContentNode = renderFileTabs(fileId, fileName, hasUnsavedChanges);
        contentNode = renderContent();
    }

    return (
        <ContentLayout
            headerHeight={48} // Tabs look better at 48px
            footerHeight={30}
            headerContent={headerContentNode}
            headerRightActions={dedicatedRouteActions}
            footerContent={footerContentNode}
            // Ensure ContentLayout main area takes up all remaining space and is scrollable.
            // We rely on contentContainerSx inside children to manage inner scrolling/sizing.
            contentWrapperSx={{ p: 0 }}
        >
            <Box sx={contentContainerSx}>
               {contentNode}
            </Box>
        </ContentLayout>
    );
  }

  // 3. Default: Singleton Drawer Mode (Keep existing structure for internal header/footer)
  // If we are here, we are using the drawer (isEditorOpen=true from AppLayout)
  
  // If loading/error in Drawer mode, show status overlay
  if (isLoading || error) {
    return (
        <Box sx={getContainerSx(isMedia)} className="flex justify-center items-center">
            {isLoading && <CircularProgress />}
            {error && <Alert severity="error">Failed to load file: {error}</Alert>}
        </Box>
    );
  }


  return (
    <Box sx={getContainerSx(isMedia)}> {/* Use dynamic container styles */}
      {/* Status Bar (Only visible for the main code editor drawer) */}
      {!isMedia && !isContextualMode && (
        <Box className="header flex justify-between items-center px-4 py-3" sx={{borderBottom: `1px solid ${theme.palette.divider}`}}>
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
      
      <Box sx={contentContainerSx}>
        {renderContent()}
      </Box>
      {!isMedia && !isContextualMode && (
        <Box className="footer flex justify-between items-center px-4 py-1" sx={{backgroundColor: theme.palette.background.default, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="caption" color="text.secondary">
                  Path: <span className="font-mono">{fileEntry?.path}</span>
              </Typography>
          </Box>
       )}
    </Box>
  );
};

export default FileEditorViewer;