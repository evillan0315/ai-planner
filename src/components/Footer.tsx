import React from 'react';
import { useStore } from '@nanostores/react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TerminalIcon from '@mui/icons-material/Terminal'; // ADDED ICON
import {
  isLeftSidebarVisible,
  isRightSidebarVisible,
  toggleLeftSidebar,
  toggleRightSidebar,
  isTerminalVisible, // ADDED
  toggleTerminal, // ADDED
} from '@/stores/uiStore';

// NEW IMPORT
import LiveClock from '@/components/clock/LiveClock';

const Footer = () => {
  const theme = useTheme();

  // Read sidebar visibility state
  const leftVisible = useStore(isLeftSidebarVisible);
  const rightVisible = useStore(isRightSidebarVisible);
  const terminalVisible = useStore(isTerminalVisible); // ADDED

  return (
    <>
      <Box className="flex justify-between items-center w-full h-full">
        {/* LEFT & CENTER Content (Sidebar Toggles, Status, Logger/Terminal Icons) */}
        <Box className="flex justify-start items-center flex-grow pl-2">
          {/* Toggle Left Sidebar (File Explorer) */}
          <Tooltip
            title={leftVisible ? 'Hide File Explorer' : 'Show File Explorer'}
          >
            <IconButton
              onClick={toggleLeftSidebar}
              color="inherit"
              size="small"
              aria-label={
                leftVisible ? 'hide left sidebar' : 'show left sidebar'
              }
            >
              {leftVisible ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </Tooltip>

          {/* Toggle Right Sidebar (Planner Output) */}
          <Tooltip
            title={rightVisible ? 'Hide Plan Output' : 'Show Plan Output'}
          >
            <IconButton
              onClick={toggleRightSidebar}
              color="inherit"
              size="small"
              aria-label={
                rightVisible ? 'hide right sidebar' : 'show right sidebar'
              }
            >
              {rightVisible ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>

          {/* Placeholder for center content (e.g., status messages, progress, logs/terminal buttons) */}
          <Box className="ml-2 flex items-center gap-1">
            {/* Placeholder Icons */}
            <Tooltip title="Open Output Logger">
              <IconButton
                color="inherit"
                aria-label="open output logger"
                size="small"
              ></IconButton>
            </Tooltip>
            {/* NEW: Toggle Terminal */}
            <Tooltip
              title={terminalVisible ? 'Hide Terminal' : 'Show Terminal'}
            >
              <IconButton
                onClick={toggleTerminal}
                color={terminalVisible ? 'primary' : 'inherit'} // Highlight if active
                aria-label="toggle terminal"
                size="small"
              >
                <TerminalIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* FAR RIGHT Content: Live Clock & Configuration */}
        <Box className="flex justify-end items-center flex-shrink-0 pr-2 h-full">
          <LiveClock />
        </Box>
      </Box>
    </>
  );
};
export default Footer;
