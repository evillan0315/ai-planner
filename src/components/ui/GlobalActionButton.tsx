import React from 'react';
import { Box, Button, Tooltip, IconButton } from '@mui/material';

import type { GlobalAction } from '@/types/action'; // Corrected import path for GlobalAction

interface GlobalActionButtonProps {
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
          ) : iconOnly ? (
            <Tooltip key={index} title={action.label} arrow>
              <IconButton
                onClick={action.action}
                color={action.color || 'primary'}
                size="small"
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
              variant={action.variant || 'contained'}
              startIcon={action.icon || null}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ),
        )}
    </Box>
  );
}

export default GlobalActionButton;
