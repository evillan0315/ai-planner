import React, { useMemo } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { Box, SxProps } from '@mui/material';

import GlobalActioButtonGroup, { GlobalActionGroup } from './GlobalActioButtonGroup';

// ---------------------------
// 1. Interfaces & Types
// ---------------------------

interface IconPositioning {
  x: 'left' | 'right';
  y: 'top' | 'bottom';
}

type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';


/**
 * Props for the FloatingIconTextField component.
 * Extends Material UI's TextFieldProps to allow all standard TextField props.
 */
interface FloatingIconTextFieldProps extends TextFieldProps {
  /** Actions/icons to float inside the TextField area, keyed by desired corner position. */
  floatingActionGroupsByCorner?: Partial<Record<CornerPosition, GlobalActionGroup[]>>;
}

// Map CornerPosition to Internal Positioning
const CornerMap: Record<CornerPosition, IconPositioning> = {
  'top-left': { x: 'left', y: 'top' },
  'top-right': { x: 'right', y: 'top' },
  'bottom-left': { x: 'left', y: 'bottom' },
  'bottom-right': { x: 'right', y: 'bottom' },
};

// ---------------------------
// 2. SX Prop Definitions
// ---------------------------

const ICON_OFFSET = 6; // px offset from edge (to align with typical MUI padding)
const MIN_CONTENT_AREA_CLEARANCE = 20; // Clearance needed for a row of icons + spacing


const getFloatingActionsContainerSx = (
  positioning: IconPositioning,
): SxProps => ({
  position: 'absolute',
  zIndex: 1, // Ensure floating actions are above the textarea content
  display: 'flex',
  alignItems: 'center',
  // Vertical positioning
  ...(positioning.y === 'bottom' ? { bottom: ICON_OFFSET, top: 'auto' } : { top: ICON_OFFSET, bottom: 'auto' }),
  // Horizontal positioning and flow direction (flow should be inward from the anchor)
  ...(positioning.x === 'right' ? 
    { right: ICON_OFFSET, left: 'auto', flexDirection: 'row-reverse' } : // Anchor Right, flow Right-to-Left (First group closest to corner)
    { left: ICON_OFFSET, right: 'auto', flexDirection: 'row' }), // Anchor Left, flow Left-to-Right (First group closest to corner)
});

const getInputAreaPaddingSx = (
  activeCorners: CornerPosition[],
  multiline: boolean,
): SxProps => {
    if (!multiline || activeCorners.length === 0) return {};
    
    // Determine required padding based on vertical location
    const neededPadding: { paddingTop?: number; paddingBottom?: number; } = {};
    const effectiveClearance = MIN_CONTENT_AREA_CLEARANCE; 

    // Check if we need top padding
    if (activeCorners.includes('top-left') || activeCorners.includes('top-right')) {
        neededPadding.paddingTop = effectiveClearance;
    }
    // Check if we need bottom padding
    if (activeCorners.includes('bottom-left') || activeCorners.includes('bottom-right')) {
        neededPadding.paddingBottom = effectiveClearance;
    }
    
    // Target the actual textarea/input field within the multiline InputBase structure
    return {
        '& .MuiInputBase-inputMultiline': { 
            // We use !important because default MUI padding can be hard to override otherwise.
            ...(neededPadding.paddingBottom && { paddingBottom: `${neededPadding.paddingBottom}px !important` }),
            ...(neededPadding.paddingTop && { paddingTop: `${neededPadding.paddingTop}px !important` }),
        }
    };
};


/**
 * A TextField component with an optional floating action area positioned within the text area.
 * It now supports actions positioned in four distinct corners.
 */
export default function FloatingIconTextField({
  floatingActionGroupsByCorner, // NEW PROP NAME
  InputProps: userInputProps, // Capture user InputProps
  multiline, // Must be explicitly destructured if we need its value
  ...props // Remaining TextFieldProps
}: FloatingIconTextFieldProps) {

  const isMultiline = !!multiline; 

  // 1. Determine which corners are active
  const activeCorners = useMemo(() => {
      if (!floatingActionGroupsByCorner) return [];
      
      const corners: CornerPosition[] = Object.keys(floatingActionGroupsByCorner).filter(
          key => (floatingActionGroupsByCorner as Record<CornerPosition, GlobalActionGroup[]>)[key as CornerPosition]?.some(g => g.actionGroup.length > 0)
      ) as CornerPosition[];
      
      return corners;
  }, [floatingActionGroupsByCorner]);
  
  // 2. Calculate input padding based on active corners
  const inputPaddingSx = useMemo(() => getInputAreaPaddingSx(activeCorners, isMultiline), [activeCorners, isMultiline]);

  // 3. Combine calculated padding SX with user-provided InputProps SX
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
  
  // 4. Render multiple action containers
  const actionRenderers = useMemo(() => {
    if (!floatingActionGroupsByCorner) return null;

    return activeCorners.map((corner) => {
      const groups = floatingActionGroupsByCorner[corner]!;
      const positioning = CornerMap[corner];
      const containerSx = getFloatingActionsContainerSx(positioning);

      return (
        <Box key={corner} sx={containerSx}>
          <GlobalActioButtonGroup 
            actionArray={groups} 
            iconOnly={true} 
            orientation="horizontal"
          />
        </Box>
      );
    });

  }, [floatingActionGroupsByCorner, activeCorners]);


  return (
    <Box position="relative" display="inline-block" width="100%">
      
      <TextField 
        fullWidth 
        // Pass multiline back
        multiline={multiline} 
        {...props} 
        InputProps={combinedInputProps} // Inject combined InputProps
      />

      {actionRenderers}
    </Box>
  );
}