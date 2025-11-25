import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  useTheme,
  DialogActions,
  Paper
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
  const drawerWidth = `${drawerWidthPercentage[size] * 100}%`;
  const isFullScreen = size === 'fullscreen';

  // Styles for the drawer based on the position
  const drawerPaperStyle = {
    ...(position === 'left' || position === 'right'
      ? { width: isFullScreen ? '100%' : drawerWidth }
      : { height: isFullScreen ? '100%' : drawerWidth }),
    //bgcolor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    overflow: 'auto',
    borderLeft: `${position === 'right' ? '1px solid' : ''}`,
    borderRight: `${position === 'left' ? '1px solid' : ''}`,
    borderTop: `${position === 'bottom' ? '1px solid' : ''}`,
    borderBottom: `${position === 'top' ? '1px solid' : ''}`,
    borderColor: theme.palette.divider,
  };

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
  
  
  // --- Standard Drawer Content (Non-Fullscreen) ---
  const standardContent = (
    // The Box wrapper ensures the ContentLayout takes up the full 100% height/width allowed by the Drawer paper
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
            // Ensure main content area starts without internal padding, allowing children to control layout
            contentWrapperSx={{p: 0}} 
        />
    </Box>
  );

  // --- Fullscreen Drawer Content ---
  const fullScreenContent = (
    <Paper
        sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
        }}
    >
        <ContentLayout
            headerContent={headerContent}
            headerRightActions={headerRightActions}
            children={children}
            footerContent={footerContent}
            headerHeight={DEFAULT_HEADER_HEIGHT}
            footerHeight={effectiveFooterHeight}
            contentWrapperSx={{p: 2}} // Apply general padding to the scrolling content area
        />
    </Paper>
  );

  return (
    <Drawer
      anchor={position}
      open={open}
      onClose={onClose}
      hideBackdrop={!hasBackdrop}
      disableEscapeKeyDown={!closeOnEscape}
    >
        {isFullScreen ? fullScreenContent : standardContent}
    </Drawer>
  );
};
export default CustomDrawer;
