import React, { useState, useCallback, useEffect, useRef, useMemo, MouseEvent as ReactMouseEvent } from 'react';
import { Box, Paper, Typography, IconButton, useTheme, SxProps, Theme, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen'; // NEW: Import FullscreenIcon

// ---------------------------
// 1. Interfaces & Types
// ---------------------------

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

type ResizeDirection =
  | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
  | null;

// Define the signature that FileEditorViewer will use to communicate capabilities
type PlayerActionRegister = (actions: Record<string, () => void>) => void;

// Define a helper interface for expected children (FileEditorViewer)
interface FileEditorViewerPropsWithAction {
    onRegisterPlayerAction?: PlayerActionRegister;
}
type ValidChildren = React.ReactElement<FileEditorViewerPropsWithAction> | React.ReactNode;

interface FloatingResizableDraggableBoxProps {
  children: ValidChildren; // Updated children type
  id: string; // NEW: Required unique ID for linking to store state
  title?: string;
  
  // State controlled by parent/store
  currentX: number; // Replaces initialX
  currentY: number; // Replaces initialY
  currentWidth: number; // Replaces initialWidth
  currentHeight: number; // Replaces initialHeight
  currentZIndex: number; // Replaces zIndex
  
  // Callbacks to update store state
  onMove: (id: string, position: Position) => void;
  onResize: (id: string, size: Size) => void;
  onFocus: (id: string) => void;
  
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  
  onClose?: (id: string) => void; // Pass ID to close handler
  /** Optional content for the header left side (e.g., custom icons, status indicators). */
  headerLeftActions?: React.ReactNode; 
  /** Optional content for the header right side (e.g., custom actions). */
  headerRightActions?: React.ReactNode; 
  /** Optional content for the footer area (e.g., actions, status bar). */
  footerActions?: React.ReactNode;
  /** Custom class for outer box (for utility-first styling like margin/shadow). */
  className?: string;
}

// ---------------------------
// 2. SX Prop Definitions
// ---------------------------

const MIN_WIDTH_DEFAULT = 250;
const MIN_HEIGHT_DEFAULT = 100;
const BORDER_SIZE = 3; // Size of the invisible resize border area
const HEADER_HEIGHT_PX = 48; // Fixed height for calculation

const resizeHandleSx: (direction: ResizeDirection) => SxProps = (direction) => ({
  position: 'absolute',
  backgroundColor: 'transparent',
  zIndex: 10, // Above the content, below drag handle
  
  // Edge handles
  ...(direction === 'n' && { top: -BORDER_SIZE / 2, left: BORDER_SIZE, right: BORDER_SIZE, height: BORDER_SIZE, cursor: 'ns-resize' }),
  ...(direction === 's' && { bottom: -BORDER_SIZE / 2, left: BORDER_SIZE, right: BORDER_SIZE, height: BORDER_SIZE, cursor: 'ns-resize' }),
  ...(direction === 'e' && { right: -BORDER_SIZE / 2, top: BORDER_SIZE, bottom: BORDER_SIZE, width: BORDER_SIZE, cursor: 'ew-resize' }),
  ...(direction === 'w' && { left: -BORDER_SIZE / 2, top: BORDER_SIZE, bottom: BORDER_SIZE, width: BORDER_SIZE, cursor: 'ew-resize' }),

  // Corner handles (larger hit area centered on corner)
  ...(direction === 'nw' && { top: -BORDER_SIZE, left: -BORDER_SIZE, width: BORDER_SIZE * 2, height: BORDER_SIZE * 2, cursor: 'nwse-resize' }),
  ...(direction === 'ne' && { top: -BORDER_SIZE, right: -BORDER_SIZE, width: BORDER_SIZE * 2, height: BORDER_SIZE * 2, cursor: 'nesw-resize' }),
  ...(direction === 'sw' && { bottom: -BORDER_SIZE, left: -BORDER_SIZE, width: BORDER_SIZE * 2, height: BORDER_SIZE * 2, cursor: 'nesw-resize' }),
  ...(direction === 'se' && { bottom: -BORDER_SIZE, right: -BORDER_SIZE, width: BORDER_SIZE * 2, height: BORDER_SIZE * 2, cursor: 'nwse-resize' }),
});

const dragHeaderSx: SxProps = {
  cursor: 'grab',
  paddingX: 1,
  borderBottom: '1px solid',
  borderColor: 'divider',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  userSelect: 'none',
  minHeight: `${HEADER_HEIGHT_PX}px`,
};

// FIXED: Use flexGrow for content area to make space for the fixed footer
const contentSx: SxProps = {
  overflowY: 'auto',
  flexGrow: 1,
};

const footerSx: (theme: Theme) => SxProps = (theme) => ({
    padding: 0,
    borderTop: '1px solid',
    borderColor: theme.palette.divider,
    display: 'flex',
    alignItems: 'center',
    minHeight: `${HEADER_HEIGHT_PX}px`, 
    flexShrink: 0,
    backgroundColor: theme.palette.background.default,
    
});

// ---------------------------
// 3. Component Implementation
// ---------------------------

/**
 * A reusable component that displays its children within a floating, resizable, and draggable box.
 * State (position, size, zIndex) is managed externally via props and callbacks.
 * This component now dynamically injects a handler into its single child (`FileEditorViewer`)
 * to receive content-specific actions (like requestFullscreen).
 */
const FloatingResizableDraggableBox: React.FC<FloatingResizableDraggableBoxProps> = ({
  children,
  id, // NEW: Use ID
  title,
  currentX, // NEW: Use current state props
  currentY,
  currentWidth, // NEW: Use current state props
  currentHeight, // NEW: Use current state props
  currentZIndex, // NEW: Use current state props for ZIndex
  onMove, // NEW: Callback for position update
  onResize, // NEW: Callback for size update
  onFocus, // NEW: Callback for focus/z-index update
  minWidth = MIN_WIDTH_DEFAULT,
  minHeight = MIN_HEIGHT_DEFAULT,
  maxWidth = Infinity,
  maxHeight = Infinity,
  onClose,
  headerLeftActions, 
  headerRightActions, 
  footerActions,
  className = 'shadow-xl',
}) => {
    const boxStyle: SxProps = {
    position: 'fixed',
    top: currentY,
    left: currentX,
    width: currentWidth,
    height: currentHeight, 
    zIndex: currentZIndex, // Use the current Z-index from props
    display: 'flex',
    flexDirection: 'column',
    overflow: 'visible', 
    border: `1px solid`,
    borderColor: 'divider',
    //minWidth: minWidth, 
    minHeight: minHeight, 
  };
  const theme = useTheme();
  
  // State for tracking interaction
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeDirection>(null);
  
  // Internal state to hold dynamic actions registered by content (e.g., { requestFullscreen: fn })
  const [dynamicHeaderActions, setDynamicHeaderActions] = useState<Record<string, () => void>>({});
  
  // Handler passed down to FileEditorViewer to register content actions
  const registerActionHandler = useCallback((newActions: Record<string, () => void>) => {
      // Clears existing actions if newActions is empty or null/undefined
      setDynamicHeaderActions(newActions || {});
  }, []);
  
  // References to track mouse start position and component dimensions/position on interaction start
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const sizeStartRef = useRef<Size>({ width: 0, height: 0 });
  const posStartRef = useRef<Position>({ x: 0, y: 0 });

  const boxRef = useRef<HTMLDivElement>(null);

  // --- Focus Handler (on any interaction start) ---
  const handleFocus = useCallback(() => {
    onFocus(id);
  }, [id, onFocus]);
  
  // --- Drag Handlers ---
  const handleDragStart = useCallback((e: ReactMouseEvent) => {
    // Check if the target is an interactive element inside the header (like a button)
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, a, input, [role="button"]');

    e.preventDefault();
    e.stopPropagation();

    if (isResizing || isInteractive) return; 
    
    // Set focus on start drag
    handleFocus();

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { x: currentX, y: currentY };
  }, [isResizing, currentX, currentY, handleFocus]);

  // --- Resize Handlers ---
  const handleResizeStart = useCallback((e: ReactMouseEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set focus on start resize
    handleFocus();

    setIsResizing(direction);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    sizeStartRef.current = { width: currentWidth, height: currentHeight };
    posStartRef.current = { x: currentX, y: currentY };
  }, [currentWidth, currentHeight, currentX, currentY, handleFocus]);
  
  // --- Global Mouse Move/Up Listeners ---

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      // 1. Handle Dragging
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        
        let newX = posStartRef.current.x + dx;
        let newY = posStartRef.current.y + dy;

        if (boxRef.current) {
            const { innerWidth: vpW, innerHeight: vpH } = window;
            const { offsetWidth: boxW, offsetHeight: boxH } = boxRef.current;
            
            // Boundary checks: keep box fully on screen
            newX = Math.max(0, Math.min(newX, vpW - boxW));
            newY = Math.max(0, Math.min(newY, vpH - boxH));
        }

        onMove(id, { x: newX, y: newY });
      } 
      
      // 2. Handle Resizing
      else if (isResizing) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        let newW = sizeStartRef.current.width;
        let newH = sizeStartRef.current.height;
        let newX = posStartRef.current.x;
        let newY = posStartRef.current.y;
        
        const effectiveMinWidth = Math.max(MIN_WIDTH_DEFAULT, minWidth);
        const effectiveMinHeight = Math.max(MIN_HEIGHT_DEFAULT, minHeight);
        
        // Calculate new size and position based on direction
        switch (isResizing) {
          case 'e':
            newW = Math.min(maxWidth, Math.max(effectiveMinWidth, sizeStartRef.current.width + dx));
            break;
          case 'w':
            newW = Math.min(maxWidth, Math.max(effectiveMinWidth, sizeStartRef.current.width - dx));
            newX = posStartRef.current.x + (sizeStartRef.current.width - newW);
            break;
          case 's':
            newH = Math.min(maxHeight, Math.max(effectiveMinHeight, sizeStartRef.current.height + dy));
            break;
          case 'n':
            newH = Math.min(maxHeight, Math.max(effectiveMinHeight, sizeStartRef.current.height - dy));
            newY = posStartRef.current.y + (sizeStartRef.current.height - newH);
            break;
          case 'ne':
            newW = Math.min(maxWidth, Math.max(effectiveMinWidth, sizeStartRef.current.width + dx));
            newH = Math.min(maxHeight, Math.max(effectiveMinHeight, sizeStartRef.current.height - dy));
            newY = posStartRef.current.y + (sizeStartRef.current.height - newH);
            break;
          case 'nw':
            newW = Math.min(maxWidth, Math.max(effectiveMinWidth, sizeStartRef.current.width - dx));
            newH = Math.min(maxHeight, Math.max(effectiveMinHeight, sizeStartRef.current.height - dy));
            newX = posStartRef.current.x + (sizeStartRef.current.width - newW);
            newY = posStartRef.current.y + (sizeStartRef.current.height - newH);
            break;
          case 'se':
            newW = Math.min(maxWidth, Math.max(effectiveMinWidth, sizeStartRef.current.width + dx));
            newH = Math.min(maxHeight, Math.max(effectiveMinHeight, sizeStartRef.current.height + dy));
            break;
          case 'sw':
            newW = Math.min(maxWidth, Math.max(effectiveMinWidth, sizeStartRef.current.width - dx));
            newH = Math.min(maxHeight, Math.max(effectiveMinHeight, sizeStartRef.current.height + dy));
            newX = posStartRef.current.x + (sizeStartRef.current.width - newW);
            break;
        }

        // Only update if dimensions actually changed
        if (newW !== currentWidth || newH !== currentHeight) {
            onResize(id, { width: newW, height: newH });
        }
        if (newX !== currentX || newY !== currentY) {
            onMove(id, { x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        // Dragging/Resizing state cleanup relies on external store updates
        // to propagate new position/size back via props.
        setIsDragging(false);
        setIsResizing(null);
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    id, 
    isDragging, 
    isResizing, 
    currentX, 
    currentY, 
    currentWidth, 
    currentHeight, 
    minWidth, 
    minHeight, 
    maxWidth, 
    maxHeight, 
    onMove, 
    onResize
  ]);

  

  // Determine effective right actions (Default Close button if none provided)
  const effectiveRightActions = useMemo(() => {
    const actions: React.ReactNode[] = [];
    
    // 1. Add dynamic actions (like Fullscreen)
    if (dynamicHeaderActions.requestFullscreen) {
        actions.push(
            <Tooltip key="fullscreen" title="Toggle Fullscreen">
                <IconButton onClick={dynamicHeaderActions.requestFullscreen} color="inherit" aria-label="toggle fullscreen">
                    <FullscreenIcon />
                </IconButton>
            </Tooltip>
        );
    }
    
    // 2. Add user-provided static right actions (this can be complex logic, keep as is)
    if (headerRightActions) {
        actions.push(headerRightActions);
    }
    
    // 3. Add default close button
    if (onClose) {
        actions.push(
            <IconButton key="close" onClick={()=>onClose(id)} color="inherit" aria-label="close">
                <CloseIcon />
            </IconButton>
        );
    }

    return actions;
}, [dynamicHeaderActions, headerRightActions, onClose, id]);
  
  // Handle cloning children to inject action registration handler
  const childrenWithProps = useMemo(() => {
    // We expect the direct child to be FileEditorViewer (ValidChildren check handles this)
    if (React.isValidElement(children)) {
      // We check if the expected prop is missing before cloning to avoid unnecessary re-renders
      if (!children.props.onRegisterPlayerAction) {
           return React.cloneElement(children, { onRegisterPlayerAction: registerActionHandler });
      }
    }
    return children;
  }, [children, registerActionHandler]);


  // Handle click on the box itself to bring it to front
  const handleBoxClick = useCallback(() => {
      handleFocus();
  }, [handleFocus]);

  const resizeDirections: ResizeDirection[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

  return (
    <Paper 
        ref={boxRef} 
        sx={boxStyle} 
        className={`bg-background-paper rounded-lg ${className}`}
        onMouseDown={handleBoxClick} // Capture click/mousedown anywhere in the box
    >
      
      {/* Resizing Handles */}
      {resizeDirections.map((dir) => (
        <Box 
          key={dir} 
          sx={resizeHandleSx(dir)}
          onMouseDown={(e) => handleResizeStart(e, dir)}
        />

      ))}

      {/* Header (Drag Handle) */}
    
      <Box 
        data-role="header" 
        sx={{...dragHeaderSx, backgroundColor: theme.palette.background.paper}} 
        onMouseDown={handleDragStart}
        className={` gap-2 flex-shrink-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* Left Actions */}
        <Box className="flex items-center flex-shrink-0 gap-1">
          {headerLeftActions}
        </Box>
        
        {/* Title (Draggable Area) */}
        <Typography 
          variant="subtitle1" 
          fontWeight="bold" 
          sx={{ color: 'text.primary', flexGrow: 1, minWidth: 0, pt: 0.5, pb: 0.5 }} 
          noWrap
          className="truncate"
        >
          {title || 'Floating Box'}
        </Typography>
        
        {/* Right Actions / Close */}
        <Box className="flex items-center flex-shrink-0 gap-1">
          {effectiveRightActions.map((action, index) => <React.Fragment key={index}>{action}</React.Fragment>)}
        </Box>
      </Box>
      

      {/* Content Area */}
      <Box  sx={contentSx}>
        {childrenWithProps}
      </Box>

       {footerActions && (
          <Box data-role="footer" sx={footerSx(theme)}>
              {footerActions}
          </Box>
      )}

    </Paper>
  );
};

export default FloatingResizableDraggableBox;
