import React from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  useMediaQuery,
  useTheme,
  Paper,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Brightness1Icon from '@mui/icons-material/Brightness1';
import CarbonTerminal from '@mui/icons-material/Terminal';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SettingsIcon from '@mui/icons-material/Settings'; // ADDED

import Terminal from '@/components/terminal/Terminal'; 
import {
  isTerminalVisible,
  setShowTerminal,
  disconnectTerminal,
} from '@/components/terminal/stores/terminalStore';

interface TerminalToolbarProps {
  isConnected: boolean;
  currentPath: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSettings: () => void; // ADDED
  onLogout: () => void;
  sx?: any;
}

const toolbarPaperSx = (theme: any) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 0,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  border: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  //boxShadow: 0,
});

export const TerminalToolbar: React.FC<TerminalToolbarProps> = ({
  isConnected,
  currentPath,
  onConnect,
  onDisconnect,
  onSettings,
  onLogout,
  sx,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const showTerminal = useStore(isTerminalVisible);

  /** ✅ Disconnect socket session first, then hide terminal */
  const handleCloseTerminal = () => {
    if (isConnected) {
      disconnectTerminal();
    }
    setShowTerminal(!showTerminal); // This toggles visibility, not necessarily closing the tab itself
  };
  
  // Helper to truncate path display
  const truncatePath = (p: string, maxLength = 30) => {
    if (p.length <= maxLength) return p;
    return `...${p.slice(-maxLength + 3)}`;
  }


  return (
    <Paper
      sx={{ ...toolbarPaperSx(theme), ...sx }}
      className="shadow shadow-xs"
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Close Terminal">
          <IconButton onClick={handleCloseTerminal} size="small">
            <CarbonTerminal  />
          </IconButton>
        </Tooltip>
        <Typography variant="subtitle1" sx={{ marginRight: '16px' }}>
          Terminal
        </Typography>
        
        {/* Display Current Working Directory */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, minWidth: 0 }} className="truncate">
            <FolderOpenIcon sx={{ fontSize: 16 }} color='action' />
            <Tooltip title={currentPath}>
                <Typography variant="caption" className="font-mono truncate max-w-[200px]" color="text.secondary">
                    {truncatePath(currentPath, 40)}
                </Typography>
            </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Terminal Settings">
             <IconButton onClick={onSettings} size="small">
                <SettingsIcon fontSize='small'/>
             </IconButton>
        </Tooltip>
        
        {!isSmallScreen && (
          <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
            <IconButton
              onClick={isConnected ? onDisconnect : onConnect} 
              size="small"
              sx={{
                color: isConnected ? theme.palette.success.main : theme.palette.error.main,
                marginLeft: '8px',
              }}
            >
              <Brightness1Icon fontSize='small' />
            </IconButton>
          </Tooltip>
        )}
        
      </Box>
    </Paper>
  );
};
