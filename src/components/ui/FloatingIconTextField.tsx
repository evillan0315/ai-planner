// FilePath: src/components/FloatingIconTextField.tsx
// Title: TextField with floating icon button (bottom-right)
// Reason: Adds an icon button overlay positioned inside the TextField, now made generic.

import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add'; // Default icon
import { Box } from '@mui/material';

/**
 * Props for the FloatingIconTextField component.
 * Extends Material UI's TextFieldProps to allow all standard TextField props.
 */
interface FloatingIconTextFieldProps extends TextFieldProps {
  /** Optional custom icon to display in the floating button. Defaults to AddIcon. */
  icon?: React.ReactNode;
  /** Optional click handler for the floating icon button. The button is only rendered if this handler is provided. */
  onIconClick?: () => void;
}

/**
 * A TextField component with an optional floating icon button positioned at the bottom-right
 * inside the text area. The button is only rendered if `onIconClick` is provided.
 */
export default function FloatingIconTextField({
  icon,
  onIconClick,
  ...props
}: FloatingIconTextFieldProps) {
  return (
    <Box position="relative" display="inline-block" width="100%">
      <TextField fullWidth {...props} />

      {onIconClick && (
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            bottom: 6, // adjust as needed
            right: 6, // adjust as needed
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
          onClick={onIconClick}
        >
          {icon || <AddIcon fontSize="small" />}
        </IconButton>
      )}
    </Box>
  );
}
