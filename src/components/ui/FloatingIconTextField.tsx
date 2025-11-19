import React, { useMemo } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { Box, SxProps } from '@mui/material';

import GlobalActionButton, { GlobalAction } from './GlobalActionButton';

// ---------------------------
// 1. Interfaces & Types
// ---------------------------

interface IconPositioning {
  x: 'left' | 'right';
  y: 'top' | 'bottom';
}

/**
 * Props for the FloatingIconTextField component.
 * Extends Material UI's TextFieldProps to allow all standard TextField props.
 */
interface FloatingIconTextFieldProps extends TextFieldProps {
  /** Actions/icons to float inside the TextField area. Must be GlobalAction array. */
  floatingActions?: GlobalAction[];
  /** Optional position configuration for the floating icons. Defaults to { x: 'right', y: 'bottom' }. */
  iconPositioning?: IconPositioning;
}

// ---------------------------
// 2. SX Prop Definitions
// ---------------------------

const DEFAULT_POSITIONING: IconPositioning = { x: 'right', y: 'bottom' };
const ICON_OFFSET = 6; // px offset from edge (to align with typical MUI padding)

const getFloatingActionsContainerSx = (
  positioning: IconPositioning,
): SxProps => ({
  position: 'absolute',
  zIndex: 1, // Ensure floating actions are above the textarea content
  display: 'flex',
  // Vertical positioning
  ...(positioning.y === 'bottom' ? { bottom: ICON_OFFSET, top: 'auto' } : { top: ICON_OFFSET, bottom: 'auto' }),
  // Horizontal positioning
  ...(positioning.x === 'right' ? 
    { right: ICON_OFFSET, left: 'auto', flexDirection: 'row' } : 
    { left: ICON_OFFSET, right: 'auto', flexDirection: 'row-reverse' }), // Reverse order if on left for alignment
});


/**
 * A TextField component with an optional floating action area positioned within the text area.
 * Uses GlobalActionButton in icon-only mode for consistent UI.
 */
export default function FloatingIconTextField({
  floatingActions,
  iconPositioning = DEFAULT_POSITIONING,
  ...props
}: FloatingIconTextFieldProps) {

  const containerSx = useMemo(() => getFloatingActionsContainerSx(iconPositioning), [iconPositioning]);

  const showActions = floatingActions && floatingActions.length > 0;

  return (
    <Box position="relative" display="inline-block" width="100%">
      {/* 
        Ensure TextField minimum height accommodates the floating actions 
        by setting appropriate padding internally or relying on MUI's default multi-line structure.
      */}
      <TextField fullWidth {...props} />

      {showActions && (
        <Box sx={containerSx}>
          <GlobalActionButton globalActions={floatingActions} iconOnly={true} />
        </Box>
      )}
    </Box>
  );
}