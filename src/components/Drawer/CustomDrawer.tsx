import type { ReactNode } from 'react';
import React from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  useTheme,
  DialogContent,
  AppBar,
  Toolbar,
  DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useStore } from '@nanostores/react';
import { themeAtom } from '@/stores/themeStore'; // Changed from themeStore to themeAtom
import { type GlobalAction } from '@/types/action';
import GlobalActionButton from '@/components/ui/GlobalActionButton';

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
  const { theme: currentThemeMode } = useStore(themeAtom); // Changed from { mode } = useStore(themeStore) to { theme } = useStore(themeAtom)

  const drawerWidth = `${drawerWidthPercentage[size] * 100}%`;
  const isFullScreen = size === 'fullscreen';

  // Styles for the drawer based on the position
  const drawerPaperStyle = {
    ...(position === 'left' || position === 'right'
      ? { width: isFullScreen ? '100%' : drawerWidth }
      : { height: isFullScreen ? '100%' : drawerWidth }),
    bgcolor: theme.palette.background.default,
    color: theme.palette.text.primary,
    overflow: 'auto',
    borderLeft: `${position === 'right' ? '1px solid' : ''}`,
    borderRight: `${position === 'left' ? '1px solid' : ''}`,
    borderTop: `${position === 'bottom' ? '1px solid' : ''}`,
    borderBottom: `${position === 'top' ? '1px solid' : ''}`,
    borderColor: theme.palette.divider,
  };

  return (
    <Drawer
      anchor={position}
      open={open}
      onClose={onClose}
      hideBackdrop={!hasBackdrop} // hideBackdrop is true if no backdrop, so negate hasBackdrop
      PaperProps={{ sx: drawerPaperStyle }}
      disableEscapeKeyDown={!closeOnEscape} // Control escape key behavior
    >
      {isFullScreen ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
          }}
        >
          <AppBar position="static" className="shadow-md"> {/* Added shadow-md for consistency */}
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div" color="inherit"> {/* Ensure text color inherits */}
                {title}
              </Typography>
            </Toolbar>
          </AppBar>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>{children}</Box> {/* Added p:2 for consistent padding */}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {stickyHeader && (
            <Box
              sx={{
                p: 2,
                bgcolor: theme.palette.background.default,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {stickyHeader}
              <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          {!stickyHeader && title && (
            <Box
              sx={{
                p: 2,
                bgcolor: theme.palette.background.default,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                maxHeight: '48px',
              }}
            >
              <Typography variant="h6" component="div">
                {title}
              </Typography>
              <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
            }}
          >
            {children}
          </Box>
          {footerActionButton && (
            <DialogActions
              sx={{
                p: 2,
                bgcolor: theme.palette.background.default,
                borderTop: `1px solid ${theme.palette.divider}`,
                justifyContent: `${position === 'left' || position === 'bottom' ? 'flex-end' : 'flex-start'}`, // Adjust alignment based on position
              }}
            >
              <GlobalActionButton globalActions={footerActionButton} />
            </DialogActions>
          )}
        </Box>
      )}
    </Drawer>
  );
};
export default CustomDrawer;
