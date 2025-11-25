import React from 'react';
import { Box, Button, Tooltip, IconButton, type ButtonProps } from '@mui/material';

// Define ButtonColor and ButtonVariant based on Material UI's ButtonProps
export type ButtonColor = ButtonProps['color'];
export type ButtonVariant = ButtonProps['variant'];

export interface GlobalAction {
  label?: string;
  action?: () => void;
  icon?: React.ReactNode;
  color?: ButtonColor;
  variant?: ButtonVariant;
  disabled?: boolean;
  component?: React.ReactNode;
  iconOnly?: boolean | true; 
  size?: ButtonProps['size'];
}

export interface GlobalActionButtonProps {
  globalActions: GlobalAction[];
  iconOnly?: boolean; // New prop for icon-only mode
}

function GlobalActionButton({ globalActions, iconOnly = false }: GlobalActionButtonProps) {
  // Default iconOnly to false
  const boxSx = {
    display: 'flex',
    gap: 1,
  };

  return (
    <Box sx={boxSx}>
      {globalActions &&
        globalActions.map((action, index) =>
          action.component ? (
            <React.Fragment key={index}>{action.component}</React.Fragment>
          ) : action.iconOnly ? (
            <Tooltip key={index} title={action.label} arrow>
              <IconButton
                onClick={action.action}
                color={action.color || 'primary'}
                size={action.size || 'small'}
                disabled={action.disabled}
              >
                {action.icon ? action.icon : null}
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              key={index}
              onClick={action.action}
              color={action.color || 'primary'}
              variant={action.variant || ''}
              startIcon={action.icon || null}
              disabled={action.disabled}
              size={action.size || 'small'}
            >
              {action.label}
            </Button>
          ),
        )}
    </Box>
  );
}

export default GlobalActionButton;