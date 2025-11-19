import React, { useMemo } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { Box, SxProps } from '@mui/material';

import GlobalActioButtonGroup, { GlobalActionGroup } from './GlobalActioButtonGroup'; // Import GlobalActioButtonGroup

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
  /** Actions/icons to float inside the TextField area. Must be GlobalActionGroup array. */
  floatingActionGroups?: GlobalActionGroup[]; // CHANGED PROP TYPE
  /** Optional position configuration for the floating icons. Defaults to { x: 'right', y: 'bottom' }. */
  iconPositioning?: IconPositioning;
}

// ---------------------------
// 2. SX Prop Definitions
// ---------------------------

const DEFAULT_POSITIONING: IconPositioning = { x: 'left', y: 'bottom' };
const ICON_OFFSET = 6; // px offset from edge (to align with typical MUI padding)
const MIN_CONTENT_AREA_CLEARANCE = 40; // Increased clearance needed for a row of icons + spacing


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
    { right: ICON_OFFSET, left: 'auto', flexDirection: 'row' } : // Flow left-to-right from right edge anchor
    { left: ICON_OFFSET, right: 'auto', flexDirection: 'row-reverse' }), // Flow right-to-left from left edge anchor
});

const getInputAreaPaddingSx = (
  positioning: IconPositioning,
  multiline: boolean,
): SxProps => {
    if (!multiline) return {};
    
    // Target the actual textarea/input field within the multiline InputBase structure
    return {
        '& .MuiInputBase-inputMultiline': { 
            // We use !important because default MUI padding can be hard to override otherwise.
            // Add padding based on icon location to prevent overlap
            ...(positioning.y === 'bottom' && { paddingBottom: `${MIN_CONTENT_AREA_CLEARANCE}px !important` }),
            ...(positioning.y === 'top' && { paddingTop: `${MIN_CONTENT_AREA_CLEARANCE}px !important` }),
            
            // Apply minimal horizontal padding override to ensure text doesn't flow under icons
            ...(positioning.x === 'right' && { paddingRight: `${ICON_OFFSET * 2}px !important` }),
            ...(positioning.x === 'left' && { paddingLeft: `${ICON_OFFSET * 2}px !important` }),
        }
    };
};


/**
 * A TextField component with an optional floating action area positioned within the text area.
 * Uses GlobalActioButtonGroup for flexible handling of multiple icon groups in icon-only mode.
 */
export default function FloatingIconTextField({
  floatingActionGroups, // CHANGED PROP NAME
  iconPositioning = DEFAULT_POSITIONING,
  InputProps: userInputProps, // Capture user InputProps
  multiline, // Must be explicitly destructured if we need its value
  ...props // Remaining TextFieldProps
}: FloatingIconTextFieldProps) {

  // Ensure multiline state is tracked correctly
  const isMultiline = !!multiline; 

  const containerSx = useMemo(() => getFloatingActionsContainerSx(iconPositioning), [iconPositioning]);
  
  // Calculate padding only if isMultiline is true
  const inputPaddingSx = useMemo(() => getInputAreaPaddingSx(iconPositioning, isMultiline), [iconPositioning, isMultiline]);

  // Check if any groups are provided and have actions
  const showActions = floatingActionGroups && floatingActionGroups.length > 0 && floatingActionGroups.some(g => g.actionGroup.length > 0);
  
  // Combine calculated padding SX with user-provided InputProps SX
  const combinedInputProps = useMemo(() => {
      const existingSx = userInputProps?.sx || {};
      
      // Ensure we merge the calculated input padding SX
      const combinedSx = Array.isArray(existingSx) 
          ? [...existingSx, inputPaddingSx] 
          : [existingSx, inputPaddingSx];

      return {
          ...userInputProps,
          sx: combinedSx
      };
  }, [userInputProps, inputPaddingSx]);


  return (
    <Box position="relative" display="inline-block" width="100%">
      
      <TextField 
        fullWidth 
        // Pass multiline back
        multiline={multiline} 
        {...props} 
        InputProps={combinedInputProps} // Inject combined InputProps
      />

      {showActions && (
        <Box sx={containerSx}>
          <GlobalActioButtonGroup 
            actionArray={floatingActionGroups!} 
            iconOnly={true} 
            orientation="horizontal"
          />
        </Box>
      )}
    </Box>
  );
}