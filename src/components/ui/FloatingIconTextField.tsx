import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { Box, SxProps } from '@mui/material';

/**
 * Props for the FloatingIconTextField component.
 * Extends Material UI's TextFieldProps to allow all standard TextField props.
 */
interface FloatingIconTextFieldProps extends TextFieldProps {
  /** Optional React node containing action buttons/icons to float inside the bottom-right corner. */
  floatingActions?: React.ReactNode;
}

const floatingActionsContainerSx: SxProps = {
    position: 'absolute',
    bottom: 6, 
    right: 6, 
    zIndex: 1, // Ensure floating actions are above the textarea content
};

/**
 * A TextField component with an optional floating action area positioned at the bottom-right
 * inside the text area.
 */
export default function FloatingIconTextField({
  floatingActions,
  ...props
}: FloatingIconTextFieldProps) {
  return (
    <Box position="relative" display="inline-block" width="100%">
      {/* 
        Ensure TextField minimum height accommodates the floating actions 
        by setting appropriate padding internally or relying on MUI's default multi-line structure.
      */}
      <TextField fullWidth {...props} />

      {floatingActions && (
        <Box sx={floatingActionsContainerSx}>
          {floatingActions}
        </Box>
      )}
    </Box>
  );
}