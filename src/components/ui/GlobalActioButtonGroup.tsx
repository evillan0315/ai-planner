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
  let requiresCentering = false;

  if (positionX || positionY) {
    positionStyles.position = 'fixed'; // Assume fixed positioning if absolute coordinates are provided
    positionStyles.zIndex = 1000; // Ensure it floats above content

    if (positionY === 'top') {
      positionStyles.top = PADDING_OFFSET;
    } else if (positionY === 'bottom') {
      positionStyles.bottom = PADDING_OFFSET;
    } else {
        requiresCentering = true;
    }

    if (positionX === 'left') {
      positionStyles.left = PADDING_OFFSET;
    } else if (positionX === 'right') {
      positionStyles.right = PADDING_OFFSET;
    } else {
        requiresCentering = true;
    }
  }

  // Handle centering logic for missing axes
  if (requiresCentering) {
      if (!positionX) {
          positionStyles.left = '50%';
          // Only set X transform
          positionStyles.transform = 'translateX(-50%)';
      }
      if (!positionY) {
          positionStyles.top = '50%';
          // Only set Y transform
          positionStyles.transform = positionStyles.transform 
              ? `${positionStyles.transform} translateY(-50%)`
              : 'translateY(-50%)';
      }
  }
  
  // If both X and Y are missing (full center)
  if (!positionX && !positionY) {
      positionStyles.position = 'fixed';
      positionStyles.zIndex = 1000;
      positionStyles.top = '50%';
      positionStyles.left = '50%';
      positionStyles.transform = 'translate(-50%, -50%)';
  } else if (positionX && positionY) {
      // If both axes are explicitly defined, ensure transform is cleared.
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