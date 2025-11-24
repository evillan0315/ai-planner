import type { ReactNode } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  useTheme,
  SxProps, // Explicitly imported for helper function
  Theme,   // Explicitly imported for helper function
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useStore } from '@nanostores/react';

// UI Icons (Only keeping necessary ones for media/editor controls)
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; 
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import ImageIcon from '@mui/icons-material/Image';

import CustomDrawer from '@/components/Drawer/CustomDrawer';
import FloatingResizableDraggableBox from '@/components/ui/FloatingResizableDraggableBox'; 
import { editorStore, closeEditor, saveFileContent } from '@/components/editor/stores/editorStore'; 
import FileEditorViewer from '@/components/editor/FileEditorViewer'; 
import GlobalActionButton, { GlobalAction } from '@/components/ui/GlobalActionButton'; 
// REMOVED: import GlobalLoadingOverlay from '@/components/ui/loader/GlobalLoadingOverlay'; 
import GlobalLinearLoader from '@/components/ui/loader/GlobalLinearLoader'; // ADDED
import FileExplorer from '@/components/file-explorer/FileExplorer'; 
import PlanGenerator from '@/components/planner/PlanGenerator'; 
import  {Terminal } from '@/components/terminal/Terminal'; // ADDED

import Footer from '@/components/ui/layouts/Footer'; // MODIFIED IMPORT PATH
import { NavBar } from './NavBar'; // NEW IMPORT

// NEW IMPORTS FOR MULTI-WINDOW SUPPORT
import {
  floatingWindowsStore,
  closeFloatingWindow,
  updateWindowPosition,
  updateWindowSize,
  bringWindowToFront,
} from '@/components/editor/stores/floatingWindowsStore'; 

// Media Constants and Types
import type { IFileSystemEntry } from '@/components/file-explorer/types'; 
import {
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  AUDIO_MIME_TYPES,
} from '@/constants';
import { useAuth } from '@/hooks/useAuth'; // Re-adding useAuth because we need isLoggedIn check

// --- IMPORTS FOR RESIZABLE LAYOUT ---
import {
  isRightSidebarVisible,
  isLeftSidebarVisible,
  rightSidebarWidth,
  leftSidebarWidth,
  isTerminalVisible, // ADDED
  terminalHeight,    // ADDED
  setTerminalHeight, // ADDED
} from '@/stores/uiStore';

interface LayoutProps {
  children: ReactNode;
}


const NAVBAR_HEIGHT = 50; // MODIFIED: Changed from 64 to 50
const FOOTER_HEIGHT = 38; // MODIFIED TO 38px

const MIN_SIDEBAR_WIDTH = 300;
const MAX_SIDEBAR_WIDTH = 1000;
const SIDEBAR_RESIZER_WIDTH = 2;
const BOTTOM_RESIZER_HEIGHT = 2; // Resizer height for bottom drawer

// Helper function to map mimeType to an Icon component
const getMediaIcon = (mimeType?: string | null): React.ReactNode => {
  if (!mimeType) return <InsertDriveFileIcon fontSize="small" color="action" />;
  
  if (IMAGE_MIME_TYPES.has(mimeType)) {
    return <ImageIcon fontSize="small" color="primary" />;
  }
  if (VIDEO_MIME_TYPES.has(mimeType)) {
    return <VideocamIcon fontSize="small" color="error" />;
  }
  if (AUDIO_MIME_TYPES.has(mimeType)) {
    return <AudiotrackIcon fontSize="small" color="secondary" />;
  }
  // Default for non-media files opened contextually (e.g., large logs, plaintext in floating viewer)
  return <InsertDriveFileIcon fontSize="small" color="action" />;
};


// --- Resizer Style Helper ---
const getResizerSx = (theme: Theme, isCurrentResizing: boolean, direction: 'horizontal' | 'vertical'): SxProps<Theme> => ({
    // Base properties (overridden by usage context if needed)
    width: direction === 'horizontal' ? SIDEBAR_RESIZER_WIDTH : '100%',
    height: direction === 'vertical' ? BOTTOM_RESIZER_HEIGHT : '100%',
    
    // Visual feedback
    backgroundColor: isCurrentResizing ? theme.palette.primary.main : theme.palette.divider,
    transition: 'background-color 0.2s ease',
    '&:hover': {
        backgroundColor: theme.palette.primary.light,
    },
    // Optional shadow for extra visibility when active
    boxShadow: isCurrentResizing ? `0 0 5px ${theme.palette.primary.main}` : 'none',
});
// --- End Resizer Style Helper ---


export const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  // MODIFIED: Retrieve isLoggedIn AND logout function from useAuth
  const { isLoggedIn, logout } = useAuth(); 
  const location = useLocation(); // Use location hook
  
  // 1. Code Editor Drawer State (Singleton)
  const { 
    isOpen: isEditorOpen, 
    fileEntry, 
    hasUnsavedChanges, 
    isLoading: isEditorLoading, 
  } = useStore(editorStore); // Listen to editor store
  
  // 2. Floating Window State (Collection)
  const { windows } = useStore(floatingWindowsStore);

  // --- Resizable Layout State ---
  const $isRightSidebarVisible = useStore(isRightSidebarVisible);
  const $isLeftSidebarVisible = useStore(isLeftSidebarVisible);
  const $rightSidebarWidth = useStore(rightSidebarWidth);
  const $leftSidebarWidth = useStore(leftSidebarWidth);
  
  // ADDED Terminal State
  const $isTerminalVisible = useStore(isTerminalVisible);
  const $terminalHeight = useStore(terminalHeight); // Get height from store

  const [isResizing, setIsResizing] = useState<null | 'left' | 'right' | 'bottom'>(null); // ADDED 'bottom'
  const initialMouseX = useRef(0);
  const initialMouseY = useRef(0); // ADDED Y tracking
  const initialSidebarWidth = useRef(0);
  const initialTerminalHeight = useRef(0); // ADDED height tracking
  // --- End Resizable Layout State ---

  // --- Resizing Logic ---

  /** Start resizing a sidebar */
  const startResizing = useCallback((side: 'left' | 'right' | 'bottom') => (e: React.MouseEvent) => {
    // Check if the target is an interactive element inside the header (like a button)
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, a, input, [role="button"]');
    
    // Safety check: Do not start resizing if target is an interactive element
    if (isInteractive) return;

    e.preventDefault();
    e.stopPropagation();


    setIsResizing(side);
    initialMouseX.current = e.clientX;
    initialMouseY.current = e.clientY; // Store initial Y position
    
    if (side === 'left') {
        initialSidebarWidth.current = $leftSidebarWidth;
        document.body.style.cursor = 'ew-resize';
    } else if (side === 'right') {
        initialSidebarWidth.current = $rightSidebarWidth;
        document.body.style.cursor = 'ew-resize';
    } else if (side === 'bottom') {
        initialTerminalHeight.current = $terminalHeight;
        document.body.style.cursor = 'ns-resize'; // North-South resize cursor
    }
    
    // Disable selection and pointer events globally while resizing for smooth dragging
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
  }, [$leftSidebarWidth, $rightSidebarWidth, $terminalHeight]);

  const stopResizing = useCallback(() => {
    if (isResizing) {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.style.pointerEvents = 'auto';
      setIsResizing(null);
    }
  }, [isResizing]);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Horizontal resize (Left/Right Sidebars)
      if (isResizing === 'left' || isResizing === 'right') {
          const deltaX = e.clientX - initialMouseX.current;
          let newWidth = initialSidebarWidth.current;
          
          if (isResizing === 'left') {
            newWidth += deltaX;
          } else { 
            // Right sidebar moves width inverse of deltaX
            newWidth -= deltaX;
          }
          
          newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
          
          if (isResizing === 'left') {
              leftSidebarWidth.set(newWidth);
          } else {
              rightSidebarWidth.set(newWidth);
          }
          
      } else if (isResizing === 'bottom') {
        // Vertical resize (Bottom Terminal Drawer)
        const deltaY = initialMouseY.current - e.clientY; // Dragging UP increases height
        let newHeight = initialTerminalHeight.current + deltaY;
        
        // Define min/max height for terminal (e.g., 100px min, 90% of viewport max)
        const MAX_TERMINAL_HEIGHT = window.innerHeight * 0.9;
        
        newHeight = Math.max(
          100, // Minimum height
          Math.min(MAX_TERMINAL_HEIGHT, newHeight)
        );
        
        setTerminalHeight(newHeight); // Use the dedicated action
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // --- End Resizing Logic ---

  const handleSaveFile = async () => {
    const result = await saveFileContent();
    if (result.success) {
        // Optionally show success notification
    } else {
        // Error handling is managed by editorStore internally, but we can log/show externally if needed.
        console.error("File save failed:", result.message);
    }
  };

  // Actions for the code/text editor drawer
  const editorActions: GlobalAction[] = [
    {
      label: 'Close',
      action: closeEditor,
      icon: <CloseIcon />,
      color: 'inherit',
      variant: 'outlined',
    },
    {
      label: 'Save',
      action: handleSaveFile,
      icon: <SaveIcon />,
      color: 'primary',
      variant: 'contained',
      disabled: !hasUnsavedChanges || isEditorLoading,
    },
  ];
  
  // NEW: Check if the user is on the Codejector page, where the editor is persistent. 
  const isCodejectorPage = location.pathname.startsWith('/codejector/editor'); 

  // If we are on the Codejector page, suppress the drawer even if the store says a file is open.
  const shouldOpenDrawer = isEditorOpen && !isCodejectorPage;
  
  // Calculate the effective content height considering the terminal drawer presence
  const terminalOffsetHeight = $isTerminalVisible ? $terminalHeight + BOTTOM_RESIZER_HEIGHT : 0; // The total height reduction ABOVE the footer.


  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      className="transition-colors duration-200"
    >
      <NavBar />
      {/* 0. Global Linear Loader (Sits immediately below the sticky NavBar) */}
      <GlobalLinearLoader /> 
      
      {/* Main content + optional sidebars (NEW STRUCTURE) */}
      <Box 
        className="main-layout flex-grow w-full flex flex-row overflow-hidden"
        sx={{
          // Calculate remaining space: 100vh - Navbar - Footer - TerminalOffset
          height: `calc(100vh - ${NAVBAR_HEIGHT}px - ${FOOTER_HEIGHT}px - ${terminalOffsetHeight}px)`,
          minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px - ${FOOTER_HEIGHT}px - ${terminalOffsetHeight}px)`,
        }}
      >
        {/* Left sidebar */}
        {isLoggedIn && $isLeftSidebarVisible && (
          <>
            <Box
              className="flex-shrink-0 overflow-auto flex flex-col border-r"
              sx={{
                width: $leftSidebarWidth,
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                p: 0, // Ensure FileExplorer manages its own padding
              }}
            >
              {/* === File Explorer Component === */}
              <FileExplorer />
              {/* =============================== */}
            </Box>
            {/* Draggable resizer */}
            <Box
              onMouseDown={startResizing('left')}
              className="flex-shrink-0 cursor-ew-resize z-10"
              sx={{
                ...getResizerSx(theme, isResizing === 'left', 'horizontal'),
                width: SIDEBAR_RESIZER_WIDTH,
              }}
              title="Resize sidebar"
            />
          </>
        )}

        {/* Main Outlet content (Children) */}
        <Box
          className="main-outlet-content flex-grow flex flex-col overflow-auto min-w-0 pb-[0px]"
          sx={{ backgroundColor: theme.palette.background.default }}
        >
          {children}
        </Box>

        {/* Right sidebar */}
        {isLoggedIn && $isRightSidebarVisible && (
          <>
            {/* Draggable resizer */}
            <Box
              onMouseDown={startResizing('right')}
              className="flex-shrink-0 cursor-ew-resize z-10"
              sx={{
                 ...getResizerSx(theme, isResizing === 'right', 'horizontal'),
                 width: SIDEBAR_RESIZER_WIDTH,
              }}
              title="Resize sidebar"
            />
            <Box
              className="flex-shrink-0 overflow-auto flex flex-col border-l pb-0"
              sx={{
                width: $rightSidebarWidth,
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
              }}
            >
              {/* Right Sidebar Content: Plan Generator */}
              <PlanGenerator />
            </Box>
          </>
        )}
      </Box>
      
      {/* 3. Bottom Terminal Drawer (NEW: Sits between main content and footer) */}
      {isLoggedIn && $isTerminalVisible && (
          <Box
              className="terminal-area flex-shrink-0 relative"
              sx={{
                  height: $terminalHeight + BOTTOM_RESIZER_HEIGHT, // Height + Resizer buffer
                  backgroundColor: theme.palette.background.default,
              }}
          >
              {/* Resizer Handle (Positioned at the TOP of the terminal area) */}
              <Box
                  onMouseDown={startResizing('bottom')}
                  className="terminal-resizer absolute top-0 left-0 right-0 z-20 cursor-ns-resize"
                  sx={{
                      ...getResizerSx(theme, isResizing === 'bottom', 'vertical'),
                      height: BOTTOM_RESIZER_HEIGHT,
                  }}
                  title="Resize terminal"
              />
              {/* Terminal Content (Adjust position to sit below the resizer bar) */}
              <Box 
                  sx={{ 
                    height: `calc(100% - ${BOTTOM_RESIZER_HEIGHT}px)`, // Take 100% minus the resizer height
                    backgroundColor: theme.palette.background.default, 
                    position: 'absolute', 
                    top: BOTTOM_RESIZER_HEIGHT, 
                    left: 0, 
                    right: 0 
                  }}
              >
                  <Terminal onLogout={logout} terminalHeight={$terminalHeight} />
              </Box>
          </Box>
      )}


      {/* Sticky footer */}
      <Paper
        elevation={5}
        className="sticky bottom-0 z-[300] w-full flex flex-col justify-center items-center radius-0" // Changed to flex-col
        sx={{
          height: FOOTER_HEIGHT,
          backgroundColor: theme.palette.background.default,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Footer />
      </Paper>
      
      {/* 1. Global File Editor/Viewer Drawer (for code/text, singleton) */}
      <CustomDrawer
        open={shouldOpenDrawer} // Conditional opening based on route
        onClose={closeEditor}
        position="right"
        size="large" // Use large size for code editing
        title={fileEntry ? `Editor: ${fileEntry.name}` : 'File Editor/Viewer'}
        hasBackdrop={true}
        footerActionButton={editorActions}
      >
        {/* FileEditorViewer reads its context from the singleton editorStore here */}
        <FileEditorViewer onClose={closeEditor} />
      </CustomDrawer>
      
      {/* 2. Global Floating Viewers (for media/read-only, multi-instance) */}
      {windows.map((window) => (
        <FloatingResizableDraggableBox
          key={window.id}
          id={window.id}
          title={window.fileEntry ? `Viewer: ${window.fileEntry.name}` : 'File Viewer'}
          currentX={window.position.x}
          currentY={window.position.y}
          currentWidth={window.size.width}
          currentHeight={window.size.height}
          currentZIndex={window.zIndex}
          onMove={updateWindowPosition}
          onResize={updateWindowSize}
          onFocus={bringWindowToFront}
          onClose={closeFloatingWindow}
          minWidth={200}
          minHeight={150}
          className="shadow-2xl"
          // Pass dynamic icon based on file type
          headerLeftActions={getMediaIcon(window.fileEntry?.mimeType)}
        >
          {/* Pass the specific window context to FileEditorViewer. */}
          <FileEditorViewer 
            onClose={() => closeFloatingWindow(window.id)}
            contextEntry={window.fileEntry}
            contextContent={window.content}
            contextIsLoading={window.isLoading}
            contextError={window.error}
          />
        </FloatingResizableDraggableBox>
      ))}
      {/* REMOVED GlobalLoadingOverlay which showed a blocking modal */}
    </Box>
  );
};
