import React, { useCallback, useState, useRef, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  dialogStore,
  closeDialog,
  DialogOptions,
  PromptDialogOptions,
} from '@/stores/dialogStore';
import CustomDialog from './CustomDialog';
import GlobalActionButton from '@/components/ui/GlobalActionButton';
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
  useTheme,
  SxProps,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';

// ================================================
// SX Prop Definitions
// ================================================

const dialogContentWrapperSx: SxProps = {
  p: 2,
  minHeight: 100,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const promptInputContainerSx: SxProps = {
  mt: 0,
};

/**
 * Manages the rendering and lifecycle of global Alert, Confirm, and Prompt dialogs.
 * Listens to the dialogStore and translates its state into a CustomDialog instance.
 */
const GlobalDialogManager: React.FC = () => {
  const { isOpen, options, resolve, reject } = useStore(dialogStore);
  const theme = useTheme();

  // Local state for handling prompt input value
  const [promptValue, setPromptValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const initialValueRef = useRef('');

  // Reset local state when dialog closes or opens with new options
  React.useEffect(() => {
    if (options?.type === 'prompt') {
      const initial = (options as PromptDialogOptions).initialValue || '';
      setPromptValue(initial);
      initialValueRef.current = initial;
    } else {
      setPromptValue('');
      initialValueRef.current = '';
    }
    setIsLoading(false);
  }, [options]);

  const handleClose = useCallback(
    (_event: {}, reason: 'backdropClick' | 'escapeKeyDown' | 'closeButtonClick') => {
      // Reject/Cancel the promise if closed without explicit action
      if (options?.type !== 'alert' && reject) {
        // Resolve to indicate user cancelled (reject is internal to service promise)
        reject(false);
      }
      closeDialog();
    },
    [options, reject],
  );

  // --- Action Handlers ---

  const handleResolveAction = useCallback(
    (result: any) => {
      if (isLoading) return;
      
      if (options?.type === 'prompt' && !promptValue.trim()) {
        // Prompt requires input unless it started with an initial value and hasn't changed to empty.
        // We handle validation later in button disabled state.
      }
      
      // Execute the resolution function based on dialog type
      if (resolve) {
        if (options?.type === 'prompt') {
          resolve(promptValue); // Pass the input string
        } else if (options?.type === 'confirm') {
          resolve(result); // true for confirm
        } else {
          // Alert resolution is implicit success/completion
          resolve(true); 
        }
      }
      closeDialog();
    },
    [options, resolve, promptValue, isLoading],
  );

  const handleCancelAction = useCallback(() => {
    if (isLoading) return;
    
    if (reject) {
        reject(false); // Signal cancellation
    }
    closeDialog();
  }, [reject, isLoading]);

  // --- Dynamic Actions & Content ---

  const dialogActions = useMemo(() => {
    if (options?.actions) {
      return (
        <GlobalActionButton globalActions={options.actions} />
      );
    }

    if (options?.type === 'alert') {
      return (
        <GlobalActionButton
          globalActions={[
            {
              label: 'OK',
              action: () => handleResolveAction(true),
              color: 'primary',
              icon: <CheckIcon />,
              disabled: isLoading,
            },
          ]}
        />
      );
    }

    if (options?.type === 'confirm' || options?.type === 'prompt') {
      const isPromptEmpty = options.type === 'prompt' && !promptValue.trim();

      return (
        <GlobalActionButton
          globalActions={[
            {
              label: 'Cancel',
              action: handleCancelAction,
              icon: <ClearIcon />,
              color: 'inherit',
              variant: 'outlined',
              disabled: isLoading,
            },
            {
              label: options.type === 'confirm' ? 'Confirm' : 'Submit',
              action: () => handleResolveAction(true),
              icon: <CheckIcon />,
              color: 'primary',
              variant: 'contained',
              disabled: isLoading || isPromptEmpty, // Disable submit if prompt is required and empty
            },
          ]}
        />
      );
    }
    return null;
  }, [options, handleResolveAction, handleCancelAction, isLoading, promptValue]);

  const dialogContent = useMemo(() => {
    if (!options) return null;

    let content = options.content;

    if (options.type === 'prompt') {
      const promptOptions = options as PromptDialogOptions;

      content = (
        <Box>
            {options.content && (
                 <Typography variant="body1" className="mb-2" sx={{ color: 'text.primary' }}>{options.content}</Typography>
            )}
            <Box sx={promptInputContainerSx}>
                <TextField
                  fullWidth
                  autoFocus
                  label={promptOptions.placeholder || 'Enter value'}
                  placeholder={promptOptions.placeholder}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  disabled={isLoading}
                  size="small"
                  variant="outlined"
                />
            </Box>
        </Box>
      );
    }
    
    // Wrap content and ensure it has correct padding/structure
    return (
        <Box sx={dialogContentWrapperSx}>
            {content}
            {isLoading && ( // Note: We currently don't use this loading state, but keep it for future async prompt validation
                 <Box className="flex justify-center items-center">
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">Processing...</Typography>
                 </Box>
            )}
        </Box>
    );
  }, [options, promptValue, isLoading]);


  if (!isOpen || !options) {
    return null;
  }

  // Determine Dialog size based on options (defaulting to sm)
  const maxWidth = options.maxWidth ?? 'sm';

  // Handle title rendering
  let titleText = options.title || options.type.toUpperCase();
  if (options.type === 'prompt') titleText = (options as PromptDialogOptions).title || 'Input Required';

  return (
    <CustomDialog
      open={isOpen}
      onClose={handleClose}
      title={titleText}
      content={dialogContent}
      actions={dialogActions}
      maxWidth={maxWidth}
      fullWidth={true} 
      showCloseButton={options.type === 'alert'} // Show close button only for alerts/non-critical flow
      disableBackdropClick={options.type !== 'alert'} // Disable default closing for confirm/prompt
      disableEscapeKeyDown={options.type !== 'alert'} // Disable default closing for confirm/prompt
    />
  );
};

export default GlobalDialogManager;
