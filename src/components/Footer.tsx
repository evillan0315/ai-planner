import React from 'react';
import { useStore } from '@nanostores/react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  isLeftSidebarVisible,
  isRightSidebarVisible,
  toggleLeftSidebar,
  toggleRightSidebar,
} from '@/stores/uiStore';

const Footer = () => {
  const theme = useTheme();

  // Read sidebar visibility state
  const leftVisible = useStore(isLeftSidebarVisible);
  const rightVisible = useStore(isRightSidebarVisible);

  return (
    <>
      <Box className="flex justify-between items-center w-full h-full">
        <Box className="flex justify-start items-center flex-grow pl-2">
          
          {/* Toggle Left Sidebar (File Explorer) */}
          <Tooltip title={leftVisible ? "Hide File Explorer" : "Show File Explorer"}>
            <IconButton 
              onClick={toggleLeftSidebar} 
              color="inherit" 
              size="small"
              aria-label={leftVisible ? "hide left sidebar" : "show left sidebar"}
            >
              {leftVisible ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </Tooltip>

          {/* Toggle Right Sidebar (Planner Output) */}
          <Tooltip title={rightVisible ? "Hide Plan Output" : "Show Plan Output"}>
            <IconButton 
              onClick={toggleRightSidebar} 
              color="inherit" 
              size="small"
              aria-label={rightVisible ? "hide right sidebar" : "show right sidebar"}
            >
              {rightVisible ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>

        </Box>
        
        {/* Existing right side content */}
        <Box className="flex justify-end items-center w-1/2 max-w-[600px] pr-4">
          <Box className="flex items-center flex-shrink"></Box>
          <IconButton
            color="inherit"
            aria-label="open output logger"
          ></IconButton>
          <IconButton color="inherit" aria-label="open terminal"></IconButton>
        </Box>
      </Box>
    </>
  );
};
export default Footer;
