import React, { useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  useTheme,
  SxProps,
  Theme,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Interface for the props of the CustomDialog component.
 */
interface CustomDialogProps {
  open: boolean;
  /** 
   * Callback fired when the component requests to be closed. 
   * Includes native MUI reasons ('backdropClick', 'escapeKeyDown') plus custom 'closeButtonClick'.
   */
  onClose: (
    event: {},
    reason: 'backdropClick' | 'escapeKeyDown' | 'closeButtonClick',
  ) => void;
  title?: React.ReactNode | string;
  content: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
  showCloseButton?: boolean;
  PaperPropsSx?: SxProps<Theme>;
}

// ================================================
// SX Prop Definitions
// ================================================

const dialogTitleSx = (theme: Theme) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  // Standard DialogTitle padding
  pr: 2, 
  backgroundColor: theme.palette.background.paper,
});

const dialogActionsSx = (theme: Theme) => ({
  pt: 1,
  justifyContent: 'flex-end',
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
});

const dialogContentSx = (theme: Theme) => ({
  p: 0, // Default padding for content container, children components should manage internal padding
});

/**
 * A highly reusable, customizable Material UI Dialog component.
 * Manages standard dialog features like title, content, actions, and close behavior.
 */
const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onClose,
  title,
  content,
  actions,
  maxWidth = 'sm',
  fullWidth = false,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  showCloseButton = true,
  PaperPropsSx = {},
}) => {
  const theme = useTheme();

  // Internal handler for native Dialog close events (backdrop/escape)
  const handleNativeClose = useCallback(
    (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (disableBackdropClick && reason === 'backdropClick') {
        return;
      }
      if (disableEscapeKeyDown && reason === 'escapeKeyDown') {
        return;
      }
      // Pass the event up to the parent component
      onClose(event, reason);
    },
    [disableBackdropClick, disableEscapeKeyDown, onClose],
  );

  // Handler for explicit close button click
  const handleCloseButtonClick = useCallback(() => {
    onClose({}, 'closeButtonClick');
  }, [onClose]);

  const finalDialogTitleSx = useMemo(() => dialogTitleSx(theme), [theme]);

  // Determine the close button placement.
  const isTitlePresent = !!title;
  
  const renderTitleContent = useMemo(() => {
    if (!isTitlePresent) return null;
    
    const titleNode = typeof title === 'string' ? (
        <Typography
          variant="h6"
          component="span"
          sx={{ fontWeight: 'bold', flexGrow: 1 }}
          className="truncate"
        >
          {title}
        </Typography>
      ) : (
        title
      );
      
      return (
          <DialogTitle id="custom-dialog-title" sx={finalDialogTitleSx}>
            {titleNode}
            {showCloseButton && (
                <IconButton
                  onClick={handleCloseButtonClick}
                  size="small"
                  sx={{ color: theme.palette.text.secondary, ml: 1 }}
                  aria-label="close"
                >
                  <CloseIcon />
                </IconButton>
            )}
          </DialogTitle>
      );
  }, [isTitlePresent, title, finalDialogTitleSx, showCloseButton, handleCloseButtonClick, theme.palette.text.secondary]);


  return (
    <Dialog
      open={open}
      onClose={handleNativeClose as any} // Cast to any because we handle extra reason 'closeButtonClick' outside native MUI
      maxWidth={maxWidth || 'xl'}
      fullWidth={fullWidth || true}
      disableEscapeKeyDown={disableEscapeKeyDown} // MUI handles the initial escape suppression
      PaperProps={{
        sx: {
          color: theme.palette.text.primary,
          borderRadius: 2, // Apply theme border radius
          ...PaperPropsSx,
        },
      }}
      aria-labelledby="custom-dialog-title"
    >
      {renderTitleContent}
      
      {/* Absolute close button fallback if no title is present but requested */}
      {!isTitlePresent && showCloseButton && (
          <IconButton
              onClick={handleCloseButtonClick}
              size="small"
              sx={{ color: theme.palette.text.secondary, position: 'absolute', right: 8, top: 8, zIndex: 8888 }}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
      )}

      {content && <DialogContent sx={dialogContentSx(theme)}>{content}</DialogContent>}

      {actions && (
        <DialogActions sx={dialogActionsSx(theme)}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CustomDialog;
