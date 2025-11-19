// FilePath: src/components/file-editor/FileEditorViewer.tsx
// Title: FileEditorViewer - unified multi-mode file editor/viewer
// Reason: Resolve merge conflicts and combine Contextual, Dedicated Route (multi-tab), and Singleton Drawer modes into a single consistent component.

import React, { useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as path from 'path-browserify';
import { useStore } from '@nanostores/react';
import {
  editorStore,
  updateDraftContent as updateSingletonDraftContent,
  saveFileContent as saveSingletonFileContent,
  IEditorContent,
} from '@/components/editor/stores/editorStore';
import {
  multiTabEditorStore,
  openTab,
  updateActiveTabDraft,
  saveActiveTabContent,
  IEditorTab,
  setActiveTab,
  closeTab,
} from '@/components/editor/stores/multiTabEditorStore';

import { IWindowContent } from '@/components/editor/stores/floatingWindowsStore';
import type { IFileSystemEntry } from '@/components/file-explorer/types';
import { ContentLayout } from '@/components/ui/layouts/ContentLayout';
import type { GlobalAction } from '@/components/ui/GlobalActionButton';

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  SxProps,
  useTheme,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Theme,
  Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import {
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  AUDIO_MIME_TYPES,
} from '@/constants';

// NEW IMPORTS FOR REFACTORED COMPONENTS
import { FileContentRenderer } from './views/FileContentRenderer';
import { MultiTabHeader } from './views/MultiTabHeader';
import { EditorStatusFooter } from './views/EditorStatusFooter';

// Editor helpers / components (adjust paths if necessary)
import MonacoEditor from '@/components/editor/MonacoEditor';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  getMonacoLanguage,
  CODE_MIME_TYPES,
  MARKDOWN_EXTENSIONS,
  monacoContainerSx,
} from '@/utils/editorUtils';

interface FileEditorViewerProps {
  onClose: () => void;
  // Context props passed when used inside a Floating Window
  contextEntry?: IFileSystemEntry | null;
  contextContent?: IWindowContent | null;
  contextIsLoading?: boolean;
  contextError?: string | null;
  // Function to register player actions back to the wrapper (FRDB)
  onRegisterPlayerAction?: (actions: Record<string, () => void>) => void;
}

// Define conditional styles based on whether it is media or code/text
const getContainerSx = (isMedia: boolean): SxProps => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  // Remove padding if it's media
  p: 0,
});

const contentContainerSx: SxProps = {
  flexGrow: 1,
  overflow: 'auto',
  position: 'relative',
  height: '100%', // Crucial for embedding viewers
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
 * It acts as an orchestrator selecting between Contextual, Dedicated Route, or Singleton Drawer modes.
 */
const FileEditorViewer: React.FC<FileEditorViewerProps> = ({
  onClose,
  contextEntry,
  contextContent,
  contextIsLoading,
  contextError,
  onRegisterPlayerAction,
}) => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();

  // Determine if we are running in Contextual (Floating Box) Mode
  const isContextualMode = !!contextEntry;

  const urlPath = searchParams.get('path');
  const decodedUrlPath = urlPath ? decodeURIComponent(urlPath) : null;

  // Dedicated route mode: Not contextual and has a path parameter
  const isDedicatedRouteMode = !isContextualMode && !!decodedUrlPath;

  // --- State Extraction & Mode Determination ---

  // Singleton Mode State (Used for Drawer Mode and Fallbacks)
  const {
    content: singletonContent,
    isLoading: singletonIsLoading,
    error: singletonError,
    draftContent: singletonDraft,
    hasUnsavedChanges: singletonHasUnsavedChanges,
    fileEntry: singletonFileEntry,
  } = useStore(editorStore);

  // Multi-Tab Mode State (Used for Dedicated Route Mode)
  const multiTabState = useStore(multiTabEditorStore);
  const { tabs, activeTabId, isInitializing } = multiTabState;

  // Find active tab for Dedicated Mode
  const activeTab = useMemo(() => tabs.find((t) => t.id === activeTabId) ?? null, [tabs, activeTabId]);

  // Media streaming specific props (only used in Contextual mode)
  let mediaStreamUrl: string | undefined | null = null;
  let mediaUrlLoading: boolean = false;
  let mediaUrlError: string | null = null;

  // Active state derived from mode
  let activeEntry: IFileSystemEntry | null = null;
  let activeContent: IEditorContent | null = null;
  let activeDraftContent = '';
  let isLoading = false;
  let error: string | null = null;
  let hasUnsavedChanges = false;

  // Resolve current active state based on mode priority: Contextual > Dedicated Route > Singleton Drawer
  if (isContextualMode) {
    activeEntry = contextEntry ?? null;
    activeContent = contextContent
      ? {
          filePath: contextContent.filePath,
          content: contextContent.content,
          mimeType: contextContent.mimeType,
          language: contextContent.language,
        }
      : null;
    activeDraftContent = contextContent?.content ?? '';
    isLoading = contextIsLoading ?? false;
    error = contextError ?? null;
    hasUnsavedChanges = false;

    // Contextual media data:
    mediaStreamUrl = (contextContent as IWindowContent)?.mediaStreamUrl;
    mediaUrlLoading = (contextContent as IWindowContent)?.mediaUrlLoading || false;
    mediaUrlError = (contextContent as IWindowContent)?.mediaUrlError || null;
  } else if (isDedicatedRouteMode) {
    activeEntry = activeTab
      ? {
          name: activeTab.name,
          path: activeTab.filePath,
          isDirectory: false,
          type: 'file',
          mimeType: activeTab.mimeType,
          size: activeTab.content.length,
        }
      : null;
    activeContent = activeTab
      ? {
          filePath: activeTab.filePath,
          content: activeTab.content,
          mimeType: activeTab.mimeType,
          language: activeTab.language,
        }
      : null;
    activeDraftContent = activeTab?.draftContent ?? '';
    isLoading = activeTab?.isLoading ?? isInitializing;
    error = activeTab?.error ?? null;
    hasUnsavedChanges = activeTab?.hasUnsavedChanges ?? false;
  } else {
    // Singleton Drawer Mode (Fallback)
    activeEntry = singletonFileEntry ?? null;
    activeContent = singletonContent ?? null;
    activeDraftContent = singletonDraft ?? '';
    isLoading = singletonIsLoading;
    error = singletonError;
    hasUnsavedChanges = singletonHasUnsavedChanges;
  }

  // Content and fileEntry for FileContentRenderer usage
  const content = (isContextualMode ? activeContent : isDedicatedRouteMode ? activeTab : activeContent) as
    | IEditorContent
    | IEditorTab
    | IWindowContent
    | null;
  const fileEntry = activeEntry;

  const activePath = activeEntry?.path || decodedUrlPath;

  // Helper to determine if content is media
  const checkIsMedia = useCallback((p: string | null | undefined, mime: string | null | undefined): boolean => {
    if (!p) return false;
    const effectiveMime = mime || getMonacoLanguage(p);
    return IMAGE_MIME_TYPES.has(effectiveMime) || VIDEO_MIME_TYPES.has(effectiveMime) || AUDIO_MIME_TYPES.has(effectiveMime);
  }, []);

  const isMedia = checkIsMedia(activePath, activeContent?.mimeType);

  const getFileExtension = (p: string) => path.extname(p).toLowerCase();

  // Determine if it's code/text editable
  const isCodeEditable = useMemo(() => {
    if (isContextualMode) return false;
    if (isMedia) return false;
    if (!activePath) return false;

    const ext = getFileExtension(activePath);
    // Check if it's a known code/text type (or markdown)
    if (CODE_MIME_TYPES.has(activeContent?.mimeType ?? '') || CODE_MIME_TYPES.has(ext) || MARKDOWN_EXTENSIONS.some((e) => ext.endsWith(e))) {
      return true;
    }
    return false;
  }, [isContextualMode, isMedia, activePath, activeContent?.mimeType]);

  // Check if active file is Markdown
  const isMarkdown = useMemo(() => {
    return MARKDOWN_EXTENSIONS.some((ext) => activePath?.toLowerCase().endsWith(ext));
  }, [activePath]);

  // --- 2. Content Renderer Function ---
  const renderContent = useCallback(() => {
    if (isLoading && activePath) {
      return (
        <Box className="flex flex-col items-center justify-center h-full">
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading {path.basename(activePath || 'File')}...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 4, height: '100%' }}>
          <Alert severity="error">Failed to load file: {error}</Alert>
        </Box>
      );
    }

    if (!activePath || !activeContent) {
      return (
        <Box sx={{ p: 4, height: '100%' }}>
          <Alert severity="info">No file selected or content is empty.</Alert>
        </Box>
      );
    }

    // Media files (Handled by floating window / Contextual parent component)
    if (isMedia) {
      if (!isContextualMode) {
        return (
          <Box className="flex items-center justify-center h-full flex-col">
            <Typography variant="h6" color="warning.main">
              Media Viewer: {path.basename(activePath)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              This file type is best viewed in a floating window.
            </Typography>
          </Box>
        );
      }
      // In Contextual mode, the parent is expected to render the player based on contextContent.
      return null;
    }

    // Markdown files
    if (isMarkdown) {
      return (
        <Box sx={contentContainerSx}>
          <MarkdownRenderer markdown={activeDraftContent} />
        </Box>
      );
    }

    // Code/Text Editor
    const language = getMonacoLanguage(activeContent.language || path.extname(activePath));

    const monacoOnChange = isDedicatedRouteMode ? updateActiveTabDraft : updateSingletonDraftContent;
    const onSave = isCodeEditable ? (isDedicatedRouteMode ? saveActiveTabContent : saveSingletonFileContent) : undefined;

    return (
      <Box sx={monacoContainerSx}>
        <MonacoEditor value={activeDraftContent} onChange={monacoOnChange} language={language} height="100%" options={{ readOnly: !isCodeEditable }} onSaveShortcut={onSave} />
      </Box>
    );
  }, [
    isLoading,
    error,
    activePath,
    isMedia,
    isMarkdown,
    activeDraftContent,
    activeContent,
    isCodeEditable,
    isDedicatedRouteMode,
    updateActiveTabDraft,
    updateSingletonDraftContent,
  ]);

  // --- 4. Multi-Tab Renderer Function (Used by Dedicated Route Mode) ---
  const renderMultiFileTabs = (tabsList: IEditorTab[], currentActiveTabId: string | null) => {
    const handleTabChange = (_: React.SyntheticEvent, newTabId: string) => {
      if (newTabId !== currentActiveTabId) {
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
          justifyContent: 'flex-start',
        }}
      >
        <Tabs value={currentActiveTabId ?? null} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={TabsComponentSx(theme)}>
          {tabsList.map((tab) => (
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

  // --- Dedicated Route Initialization Effect ---
  // If we are in dedicated route mode, open/activate the file specified by the URL path.
  useEffect(() => {
    if (isDedicatedRouteMode && decodedUrlPath) {
      // Load/activate the requested path in the multi-tab store
      openTab(decodedUrlPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedUrlPath, isDedicatedRouteMode]);

  // Actions
  const saveAction = isDedicatedRouteMode ? saveActiveTabContent : saveSingletonFileContent;
  const updateAction = isDedicatedRouteMode ? updateActiveTabDraft : updateSingletonDraftContent;

  // Actions for the dedicated route editor (Save if changes exist)
  const dedicatedRouteActions: GlobalAction[] = hasUnsavedChanges
    ? [
        {
          label: 'Save',
          action: saveAction,
          icon: <SaveIcon />,
          color: 'primary',
          variant: 'contained',
          disabled: isLoading,
          tooltip: 'Save active file content (Ctrl+S)',
        },
      ]
    : [];

  // --- Conditional Rendering by Mode ---

  // 1. Contextual Mode (Floating Box) - Read-only view, mainly for media
  if (isContextualMode) {
    // If media, parent should render the player; otherwise render content area.
    if (isMedia) {
      return null;
    }

    return (
      <Box sx={getContainerSx(false)}>
        <Box sx={contentContainerSx}>{renderContent()}</Box>
      </Box>
    );
  }

  // 2. Dedicated Route Mode (Uses ContentLayout) - Multi-tab editor
  if (isDedicatedRouteMode) {
    let contentNode: React.ReactNode;
    let headerContentNode: React.ReactNode | null = null;
    let footerContentNode: React.ReactNode | null = null;

    if (isLoading && activePath && !activeTab) {
      // Initial load state for the dedicated path
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
          <Alert severity="error">Failed to load file: {activeTab.error}</Alert>
        </Box>
      );
    } else if (!activeTab || !activeTabId) {
      contentNode = (
        <Box sx={{ p: 4, height: '100%' }}>
          <Alert severity="info">No file content loaded or specified. Please open a file from the explorer.</Alert>
        </Box>
      );
    } else {
      // Content is ready for active tab
      headerContentNode = <MultiTabHeader tabs={tabs} activeTabId={activeTabId} />;

      contentNode = (
        <FileContentRenderer
          content={activeTab}
          fileEntry={fileEntry}
          isLoading={isLoading}
          error={error}
          draftContent={activeTab.draftContent}
          isContextualMode={false}
          onSaveShortcut={saveActiveTabContent}
          onContentChange={updateActiveTabDraft}
        />
      );

      // Define footer content
      if (!isMedia) {
        footerContentNode = (
          <EditorStatusFooter
            filePath={activeTab.filePath}
            hasUnsavedChanges={activeTab.hasUnsavedChanges}
            // Custom style for ContentLayout footer area
            sx={(theme) => ({
              height: '30px',
              backgroundColor: theme.palette.background.default,
              borderTop: `1px solid ${theme.palette.divider}`,
            })}
          />
        );
      }
    }

    return (
      <ContentLayout headerHeight={49} footerHeight={30} headerContent={headerContentNode} headerRightActions={dedicatedRouteActions} footerContent={footerContentNode} contentWrapperSx={{ p: 0 }}>
        <Box sx={contentContainerSx}>{contentNode}</Box>
      </ContentLayout>
    );
  }

  // 3. Default: Singleton Drawer Mode (Keep existing structure for internal header/footer)
  // This mode is used when openFileInEditor sets editorStore.isOpen=true, but we are not on the dedicated route.

  const drawerHeader = (
    <Box className="flex justify-between items-center p-2 border-b border-divider">
      <Typography variant="h6" component="div" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {activeEntry?.name || 'File Viewer'}
      </Typography>
      {hasUnsavedChanges && <Chip label="Unsaved" color="warning" size="small" className="mr-2" />}
      <Tooltip title="Save (Ctrl+S)">
        <IconButton onClick={saveSingletonFileContent} disabled={!hasUnsavedChanges || isLoading || !isCodeEditable} color="primary">
          <SaveIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Close">
        <IconButton onClick={onClose} color="secondary">
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const drawerFooter = (
    <Box className="flex justify-between items-center px-4 py-1 h-[30px] border-t border-divider">
      <Typography variant="caption" color="text.secondary">
        Path: <span className="font-mono">{activePath}</span>
      </Typography>
      {isCodeEditable && activeContent?.language && (
        <Typography variant="caption" color="text.secondary">
          Language: {activeContent.language}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={getContainerSx(isMedia)}>
      {/* If file is media, openFileInEditor should have delegated to Floating Windows.
          If we somehow reach here with media, show error/placeholder. */}
      {isMedia ? (
        <Box className="flex flex-col items-center justify-center h-full p-4">
          <Alert severity="warning">Media files are not supported in the primary editor view. They are opened in floating windows.</Alert>
          <Typography variant="caption" sx={{ mt: 1 }}>
            Path: {activePath}
          </Typography>
        </Box>
      ) : (
        <>
          {drawerHeader}
          <Box sx={contentContainerSx}>{renderContent()}</Box>
          {drawerFooter}
        </>
      )}
    </Box>
  );
};

export default FileEditorViewer;

