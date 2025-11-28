
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  useTheme,
  DialogActions,
  Paper,
  // Use Box instead of Paper for content wrapper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import GlobalActionButton, { type GlobalAction } from '@/components/ui/GlobalActionButton';
import { ContentLayout } from '@/components/ui/layouts/ContentLayout'; // NEW IMPORT

interface CustomDrawerProps {
  open: boolean;
  onClose: () => void;
  position: 'left' | 'right' | 'top' | 'bottom';
  size: 'normal' | 'medium' | 'large' | 'fullscreen';
  hasBackdrop?: boolean;
  closeOnEscape?: boolean;
  stickyHeader?: ReactNode;
  footerActionButton?: GlobalAction[];
  children: ReactNode;
  title?: string;
}

const drawerWidthPercentage: Record<CustomDrawerProps['size'], number> = {
  normal: 1 / 3,
  medium: 1 / 2,
  large: 3 / 4,
  fullscreen: 1,
};

// Define constants for header/footer heights matching ContentLayout defaults or estimates
const DEFAULT_HEADER_HEIGHT = 48; 
const DEFAULT_FOOTER_HEIGHT_WITH_ACTIONS = 50; 

const CustomDrawer: React.FC<CustomDrawerProps> = ({
  open,
  onClose,
  position,
  size = 'medium',
  hasBackdrop = false,
  closeOnEscape = true,
  stickyHeader,
  footerActionButton,
  children,
  title,
}) => {
  const theme = useTheme();
  const drawerSizeValue = `${drawerWidthPercentage[size] * 100}%`;
  const isFullScreen = size === 'fullscreen';

  // --- Styles for the inner Paper component of the Drawer (Sizing and Borders) ---
  const drawerPaperStyle = useMemo(() => {
    return {
      ...(position === 'left' || position === 'right'
        ? { width: isFullScreen ? '100%' : drawerSizeValue }
        : { height: isFullScreen ? '100%' : drawerSizeValue }),
      // Non-sizing styles applied directly to the PaperProps
      color: theme.palette.text.primary,
      overflow: 'auto',
      borderLeft: `${position === 'right' ? '1px solid' : ''}`,
      borderRight: `${position === 'left' ? '1px solid' : ''}`,
      borderTop: `${position === 'bottom' ? '1px solid' : ''}`,
      borderBottom: `${position === 'top' ? '1px solid' : ''}`,
      borderColor: theme.palette.divider,
    };
  }, [position, isFullScreen, drawerSizeValue, theme]);

  // --- Header Content and Actions ---
  
  const headerRightActions: GlobalAction[] = useMemo(() => ([
    { 
      label: 'Close Drawer', 
      action: onClose, 
      icon: <CloseIcon />, 
      color: 'inherit',
      iconOnly: true,
    },
  ]), [onClose]);
  
  const headerContent = useMemo(() => {
    if (stickyHeader) return stickyHeader;
    if (title) return (
      <Typography variant="h6" component="div" className="truncate" sx={{flexGrow: 1}}>
        {title}
      </Typography>
    );
    return null;
  }, [stickyHeader, title]);

  // --- Footer Content ---
  
  const footerContent = useMemo(() => {
    if (!footerActionButton) return undefined;
    
    // Wrap the actions in DialogActions for standardized button padding/layout within the footer area.
    return (
        <GlobalActionButton globalActions={footerActionButton} />
    );
  }, [footerActionButton]);

  // Determine height properties for ContentLayout
  const effectiveFooterHeight = footerActionButton ? DEFAULT_FOOTER_HEIGHT_WITH_ACTIONS : 0;
  
  // The Box wrapper ensures the ContentLayout takes up the full 100% height/width allowed by the Drawer paper
  const content = (
    // Use Box as a content wrapper for 100% height
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        }}
    >
        <ContentLayout
            headerContent={headerContent}
            headerRightActions={headerRightActions}
            
            children={children}

            footerContent={footerContent}
            headerHeight={DEFAULT_HEADER_HEIGHT}
            footerHeight={effectiveFooterHeight}
            // contentWrapperSx is for the *scrolling content area*. 
            // It should handle internal padding, not the drawer's main sizing/borders.
        />
    </Box>
  );


  return (
    <Drawer
      anchor={position}
      open={open}
      onClose={onClose}
      hideBackdrop={!hasBackdrop}
      disableEscapeKeyDown={!closeOnEscape}
      // FIX: Apply the custom sizing and border styles to the internal Paper component
      PaperProps={{
        sx: drawerPaperStyle,
      }}
    >
        {content}
    </Drawer>
  );
};
export default CustomDrawer;