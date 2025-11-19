import React, { useMemo } from 'react';
import { Box, SxProps } from '@mui/material';
import GlobalActionButton, { GlobalAction } from './GlobalActionButton';

// ---------------------------
// 1. Interfaces & Types
// ---------------------------

export interface GlobalActionGroup {
  actionGroup: GlobalAction[];
  key?: string | number; // Added optional key for stable rendering of groups
}

export interface GlobalActioButtonGroupProps {
  actionArray: GlobalActionGroup[];
  /** Determines horizontal position. Requires the component to be absolutely or fixed positioned. */
  positionX?: 'left' | 'right';
  /** Determines vertical position. Requires the component to be absolutely or fixed positioned. */
  positionY?: 'top' | 'bottom';
  /** Presentation style (list, thumb, card) - currently controls size/style hints. */
  view?: 'list' | 'thumb' | 'card';
  /** Layout direction of the groups. */
  orientation?: 'horizontal' | 'vertical';
  /** Whether the buttons should render as icon-only (passed to GlobalActionButton). */
  iconOnly?: boolean;
}

// ---------------------------
// 2. SX Prop Definitions
// ---------------------------

const PADDING_OFFSET = 12; // Standard MUI spacing (equivalent to 1.5 units, or theme.spacing(1.5))

const getButtonGroupSx = (
  orientation: 'horizontal' | 'vertical',
  positionX?: 'left' | 'right',
  positionY?: 'top' | 'bottom',
): SxProps => {
  const isVertical = orientation === 'vertical';

  const positionStyles: SxProps = {};
  
  // Only apply fixed positioning if at least one coordinate is explicitly provided.
  if (positionX !== undefined || positionY !== undefined) {
    positionStyles.position = 'fixed';
    positionStyles.zIndex = 1000; // Ensure it floats above content
    
    // Apply specific positional offsets
    if (positionY === 'top') {
      positionStyles.top = PADDING_OFFSET;
      positionStyles.bottom = 'auto';
    } else if (positionY === 'bottom') {
      positionStyles.bottom = PADDING_OFFSET;
      positionStyles.top = 'auto';
    }

    if (positionX === 'left') {
      positionStyles.left = PADDING_OFFSET;
      positionStyles.right = 'auto';
    } else if (positionX === 'right') {
      positionStyles.right = PADDING_OFFSET;
      positionStyles.left = 'auto';
    }

    // Centering logic for the missing axis
    if (positionX === undefined && positionY !== undefined) {
        positionStyles.left = '50%';
        positionStyles.transform = 'translateX(-50%)';
    } else if (positionY === undefined && positionX !== undefined) {
        positionStyles.top = '50%';
        positionStyles.transform = 'translateY(-50%)';
    } else if (positionX !== undefined && positionY !== undefined) {
        // Both defined (no transform needed)
        positionStyles.transform = 'none';
    }
  } else {
      // If neither is defined, do nothing, allowing the component to behave as a normal flex Box
      positionStyles.transform = 'none';
  }


  // Flex container styles using MUI sx
  const flexStyles: SxProps = {
    display: 'flex',
    // Apply flex direction to the container to manage group layout
    flexDirection: isVertical ? 'column' : 'row',
    // Use MUI spacing units (1 = 8px, so 1 = gap of 8px) to separate groups
    gap: 1,
    alignItems: 'center',
    flexWrap: 'wrap', // Allow wrapping if space runs out horizontally
  };

  return { ...positionStyles, ...flexStyles };
};


// ---------------------------
// 3. Component Implementation
// ---------------------------

/**
 * A container component for grouping Global Actions, allowing flexible positioning and orientation.
 * It iterates over action groups and renders each group using GlobalActionButton for internal button layout.
 */
export default function GlobalActioButtonGroup({
  actionArray,
  positionX,
  positionY,
  view = 'list', // View prop currently unused for styling but included for future use
  orientation = 'horizontal',
  iconOnly = false,
}: GlobalActioButtonGroupProps) {

  // containerSx determines the fixed position and the layout of groups (group separation)
  const containerSx = useMemo(() => getButtonGroupSx(orientation, positionX, positionY), [orientation, positionX, positionY]);
  
  if (!actionArray || actionArray.length === 0) {
    return null;
  }
  
  return (
    <Box sx={containerSx} className="GlobalActioButtonGroup">
      {actionArray.map((group, groupIndex) => (
        // Each group is rendered within a Box to maintain external spacing/alignment
        <Box 
          key={group.key || groupIndex} 
          className="flex-shrink-0"
        >
          <GlobalActionButton 
            globalActions={group.actionGroup} 
            iconOnly={iconOnly} 
          />
        </Box>
      ))}
    </Box>
  );
}