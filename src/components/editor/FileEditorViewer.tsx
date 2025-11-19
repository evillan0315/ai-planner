import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as path from 'path-browserify';
import { useStore } from '@nanostores/react';
import {
  editorStore,
  updateDraftContent as updateSingletonDraftContent,
  saveFileContent as saveSingletonFileContent,
  IEditorContent,
  loadFileContentFromPath as loadSingletonFileContentFromPath,
  closeEditor,
} from '@/components/editor/stores/editorStore';
import {
  multiTabEditorStore,
  openTab,
  setActiveTab,
  closeTab,
  updateActiveTabDraft,
  saveActiveTabContent,
  IEditorTab,
} from '@/components/editor/stores/multiTabEditorStore';

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
import { getMonacoLanguage } from '@/utils/editorUtils';
import {
  CODE_MIME_TYPES,
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  AUDIO_MIME_TYPES,
  MARKDOWN_EXTENSIONS,
  HTML_EXTENSIONS,
} from '@/constants';
//import AudioPlayer from '@/components/ui/player/AudioPlayer';
//import VideoPlayer from '@/components/ui/player/VideoPlayer';


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
 * 1. Contextual (reading from props, typically for floating media viewers).
 * 2. Singleton Drawer (reading from global editorStore).
 * 3. Dedicated Route (reading from global multiTabEditorStore, wrapped in ContentLayout).
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
  
  // --- State Management Selection ---
  
  // 1. Singleton Store (Drawer Mode)
  const globalState = useStore(editorStore);
  const { tabs, activeTabId } = useStore(multiTabEditorStore);
  
  // 2. Determine which state source to use (Contextual > Dedicated Tab > Singleton Drawer)
  
  let currentTabOrContent: (IEditorContent | IEditorTab | IWindowContent) | null;
  let currentFileEntry: IFileSystemEntry | null;
  let isLoading: boolean;
  let error: string | null;
  let draftContent: string | null;
  let hasUnsavedChanges: boolean;
  let isCodeEditable: boolean = true;

  if (isContextualMode) {
      currentTabOrContent = contextContent;
      currentFileEntry = contextEntry;
      isLoading = !!contextIsLoading;
      error = contextError;
      draftContent = null;
      hasUnsavedChanges = false;
  } else if (isDedicatedRouteMode) {
      // Dedicated Multi-Tab Mode
      const activeTab = tabs.find(t => t.id === activeTabId) ?? null;
      currentTabOrContent = activeTab;
      currentFileEntry = activeTab ? { path: activeTab.filePath, name: activeTab.name, isDirectory: false, type: 'file' } : null; // Synthesize minimal entry
      isLoading = activeTab?.isLoading ?? false;
      error = activeTab?.error ?? null;
      draftContent = activeTab?.draftContent ?? null;
      hasUnsavedChanges = activeTab?.hasUnsavedChanges ?? false;
  } else {
      // Singleton Drawer Mode
      currentTabOrContent = globalState.content;
      currentFileEntry = globalState.fileEntry;
      isLoading = globalState.isLoading;
      error = globalState.error;
      draftContent = globalState.draftContent;
      hasUnsavedChanges = globalState.hasUnsavedChanges;
  }

  const activePath = currentFileEntry?.path || decodedUrlPath || null;

  
  // --- Dedicated Route Initialization Effect ---
  // If we are in dedicated route mode, open/activate the file specified by the URL path.
 useEffect(() => {
    if (isDedicatedRouteMode && decodedUrlPath) {
        // Load/activate the requested path in the multi-tab store
        openTab(decodedUrlPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedUrlPath, isDedicatedRouteMode]); 

  
  // Get details from the determined content source
  const content = currentTabOrContent;
  const fileEntry = currentFileEntry;
  
  // Check if content implies media based on mimeType
  const mimeType = fileEntry?.mimeType || content?.mimeType || '';
  const isMedia = IMAGE_MIME_TYPES.has(mimeType) || 
                  VIDEO_MIME_TYPES.has(mimeType) || 
                  AUDIO_MIME_TYPES.has(mimeType);

  
  const determineRenderer = (fileContent: (IEditorContent | IEditorTab | IWindowContent) | null) => {
    if (!fileContent) return 'code'; // Default to code editor if no content info

    // In multi-tab mode, we use draftContent for rendering if present
    const contentString = (fileContent as IEditorTab).draftContent ?? fileContent.content;
    const { mimeType: type, filePath } = fileContent;
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    // Use a smaller limit for contextual viewer if content is large (though we usually skip content for media)
    const isLargeFile = (contentString?.length || 0) > 1024 * 500; // 500KB limit

    // 1. Markdown
    if (MARKDOWN_EXTENSIONS.has(extension)) {
      return 'markdown';
    }

    // 2. HTML (Rendered in iframe for safety and layout accuracy)
    if (HTML_EXTENSIONS.has(extension)) {
      return 'iframe';
    }

    // 3. Media types (These should only happen in Contextual Mode)
    // We treat media files as code/plaintext if opened in dedicated mode, but let the Contextual mode override here.
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
    
    // Determine content to display: draft first, then original
    const displayContent = draftContent ?? content.content;
    
    // --- Media Rendering Logic using stream URL (new implementation) ---
    if (isMedia) {
        // Media should only happen in Contextual mode, if it happens here, it's an error/warning
        if (!isContextualMode) {
            return (
                <Alert severity="info">
                    Media files are typically opened in floating windows. Path: {fileEntry?.path}
                </Alert>
            );
        }
        
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

        const url = mediaStreamUrl || fileEntry?.path; 

        if (url) {
            if (rendererType === 'image') {
                return (
                    <Box className="flex justify-center items-center w-full h-full"> 
                        <img 
                            src={url} 
                            alt={fileEntry?.name || 'File Preview'} 
                            className="w-full object-contain" 
                            style={{ maxHeight: '100%', maxWidth: '100%' }}
                        />
                    </Box>
                );
            }
            
            if (rendererType === 'video') {
                return (
                    <Box className="flex justify-center items-center h-full">
                        <VideoPlayer 
                            src={url} 
                            fileName={fileEntry?.name} 
                            onRequestFullscreenReady={handleRegisterFullscreen}
                        />
                    </Box>
                );
            }
            
            // Audio rendering
            if (rendererType === 'audio') {
                return (
                    <Box className="flex justify-center items-center h-full p-1"> 
                        <AudioPlayer src={url} fileName={fileEntry?.name} />
                    </Box>
                );
            }
        }
        
        return <Alert severity="warning">Could not display media content.</Alert>
    }
    
    // --- HTML Rendering Logic ---
    if (isHtml) {
        // content.content must exist here
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
        return (
            <Box className="p-4">
                <MarkdownRenderer content={displayContent || content.content} />
            </Box>
        );
    }
    
    // Default to Monaco Editor for code and plaintext
    const monacoLanguage = content.language || getMonacoLanguage(content.filePath);
    
    if (rendererType === 'code' || rendererType === 'plaintext') {
        const saveAction = isDedicatedRouteMode ? saveActiveTabContent : saveSingletonFileContent;
        const updateAction = isDedicatedRouteMode ? updateActiveTabDraft : updateSingletonDraftContent;

        return (
            <Box sx={monacoContainerSx}>
                <MonacoEditor
                    value={displayContent || content.content}
                    onChange={isCodeEditable ? updateAction : () => {}} // Only allow changing if editable
                    language={monacoLanguage}
                    options={{
                        readOnly: !isCodeEditable,
                        minimap: { enabled: false },
                        wordWrap: 'on',
                    }}
                    // Pass save function only if editable
                    onSaveShortcut={isCodeEditable ? saveAction : undefined}
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

  // --- 2. Multi-Tab Renderer Function (Used by Dedicated Route Mode) ---

  const renderMultiFileTabs = (tabs: IEditorTab[], activeTabId: string | null) => {
    
    const handleTabChange = (_: React.SyntheticEvent, newTabId: string) => {
        if (newTabId !== activeTabId) {
             setActiveTab(newTabId);
        }
    };

    return (
        <Tabs 
            value={activeTabId || false} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{
                height: '100%', 
                minHeight: '38px', 
                alignItems: 'flex-end', 
                borderBottom: 'none', 
                flexGrow: 1,
                justifyContent: 'flex-start',
            }}
        >
            {tabs.map((tab) => (
                <Tooltip title={tab.filePath} key={tab.id}>
                    <Tab 
                        component="div"
                        value={tab.id}
                        label={
                            <Box className="flex items-center">
                                <Typography variant="body2" component="span" sx={{ mr: 1, fontStyle: tab.hasUnsavedChanges ? 'italic' : 'normal' }}>
                                    {tab.name}
                                    {tab.hasUnsavedChanges && ' *'}
                                </Typography>
                                <IconButton 
                                    size="small" 
                                    sx={{ p: 0, ml: 1, color: 'text.secondary' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab.id);
                                    }}
                                >
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                        }
                        sx={{
                            minHeight: '38px',
                            height: '38px', // Ensure tabs are explicitly 38px high to match header
                            py: 0,
                            px: 2,
                            textTransform: 'none',
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
            ))}
        </Tabs>
    );
  };

  // Actions for the dedicated route editor (Save if changes exist)
  // isCodeEditable calculated in the scope above

  const dedicatedRouteActions: GlobalAction[] = isCodeEditable && hasUnsavedChanges ? [
    {
      label: 'Save',
      action: saveActiveTabContent, // Use multi-tab save action
      icon: <SaveIcon />,
      color: 'primary',
      variant: 'contained',
      disabled: isLoading, 
      tooltip: 'Save active file content (Ctrl+S)',
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
    let footerContentNode: React.ReactNode | null = null;
    
    // Determine content based on the currently selected tab
    const activeTab = tabs.find(t => t.id === activeTabId);

    if (isLoading && activePath && !activeTab) {
        contentNode = (
            <Box className="flex flex-col items-center justify-center h-full">
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    Loading {path.basename(activePath)}...
                </Typography>
            </Box>
        );
    } else if (activeTab && activeTab.error) {
        contentNode = (
            <Box sx={{ p: 4, height: '100%' }}>
                <Alert severity="error">
                    Failed to load file: {activeTab.error}
                </Alert>
            </Box>
        );
    } else if (!activeTab) {
        contentNode = (
            <Box sx={{ p: 4, height: '100%' }}>
                <Alert severity="info">
                    No file content loaded or specified. Please open a file from the explorer.
                </Alert>
            </Box>
        );
    } else {
        headerContentNode = renderMultiFileTabs(tabs, activeTabId);
        contentNode = renderContent(); // Renders the content of the active tab
        
        // Define footer content 
        if (!isMedia) { 
             footerContentNode = (
                <Box className="flex justify-between items-center px-4 py-1 h-[30px]" >
                    <Typography variant="caption" color="text.secondary">
                        Path: <span className="font-mono">{activeTab.filePath}</span>
                    </Typography>
                    {activeTab.hasUnsavedChanges && (
                        <Chip 
                            label="Unsaved Changes" 
                            color="warning" 
                            size="small" 
                            className="animate-pulse" 
                        />
                    )}
                </Box>
             );
        }
    }

    return (
        <ContentLayout
            headerHeight={38} // Set tab height to 38px
            footerHeight={30} // Set footer height to 30px
            headerContent={headerContentNode}
            headerRightActions={dedicatedRouteActions}
            footerContent={footerContentNode}
            // Ensure ContentLayout main area takes up all remaining space and is scrollable.
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
        <Box className="header flex justify-between items-center px-4 py-1" sx={{borderBottom: `1px solid ${theme.palette.divider}`}}>
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
