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
  Theme, // ADDED
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

// NEW: Styles for the Multi-Tab Editor Header, derived from codejector/DynamicMuiTabs.tsx
const TabsComponentSx = (theme: Theme): SxProps => ({
  flexGrow: 1, 
  minHeight: '49px', // Set height for the Tabs component itself
  height: '49px',
  alignItems: 'flex-start',
  
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
  },
  
  // Style for individual Tab
  '& .MuiTab-root': {
    color: theme.palette.text.secondary,
    minHeight: '49px', 
    height: '49px', 
    padding: '6px 16px',
    textTransform: 'none',
    fontSize: '0.875rem',
    
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
    
    // Ensure tabs are visually distinct and match the Codejector IDE style
    '&.Mui-selected': {
      color: theme.palette.text.primary,
      fontWeight: 'bold',
      backgroundColor: theme.palette.background.default, // Use default background for selected tab
      
      border: `1px solid ${theme.palette.divider}`,
      borderBottomColor: theme.palette.background.default, // Visual hack to hide bottom border against the selected background
      zIndex: 2, // Ensure selected tab overlays indicator/separator
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover, 
    },
  },
});


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

// ... (lots of logic omitted) ...

  // --- 2. Multi-Tab Renderer Function (Used by Dedicated Route Mode) ---

  const renderMultiFileTabs = (tabs: IEditorTab[], activeTabId: string | null) => {
    
    const handleTabChange = (_: React.SyntheticEvent, newTabId: string) => {
        if (newTabId !== activeTabId) {
             setActiveTab(newTabId);
        }
    };

    return (
        <Box 
            // This Box ensures the tabs container behaves correctly inside ContentLayout header
            sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                flexGrow: 1, 
                justifyContent: 'flex-start' 
            }}
        >
            <Tabs 
                value={activeTabId ?? null} 
                onChange={handleTabChange} 
                variant="scrollable"
                scrollButtons="auto"
                sx={TabsComponentSx(theme)}
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
                                        sx={{ p: 0, ml: 1, color: 'text.secondary', opacity: 0.8 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeTab(tab.id);
                                        }}
                                    >
                                        <CloseIcon sx={{ fontSize: 14 }} /> {/* Reduced icon size */}
                                    </IconButton>
                                </Box>
                            }
                        />
                    </Tooltip>
                ))}
            </Tabs>
        </Box>
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
// ... (logic omitted) ...

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
            headerHeight={49} // Set tab height to 49px (matching IDE style)
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
// ... (rest omitted) ...
