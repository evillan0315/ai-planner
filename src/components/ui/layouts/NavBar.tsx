import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Stack,
  Menu,
  MenuItem,
  IconButton,
  useTheme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';

// UI Icons
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MenuIcon from '@mui/icons-material/Menu';
import SendIcon from '@mui/icons-material/Send';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import CodeIcon from '@mui/icons-material/Code';

export const NavBar: React.FC = () => {
  const theme = useTheme();
  const { isLoggedIn, logout, user } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="sticky" className="shadow-md">
      <Toolbar elevation={2} sx={{ justifyContent: 'space-between', backgroundColor: 'background.paper', color: 'text.primary' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <RouterLink
            to="/"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <AddRoadIcon sx={{ fontSize: 30 }} />
              <Typography
                variant="h6"
                component="div"
                sx={{ color: 'inherit' }}
              >
                AI Planner
              </Typography>
            </Stack>
          </RouterLink>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            {/* Added Codejector Link */}
            <MenuItem
              component={RouterLink}
              to="/codejector"
              onClick={handleMenuClose}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <CodeIcon fontSize="small" />
                <Typography>Codejector Workspace</Typography>
              </Stack>
            </MenuItem>
            {/* Existing Links */}
            <MenuItem
              component={RouterLink}
              to="/planner"
              onClick={handleMenuClose}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <AddRoadIcon fontSize="small" />
                <Typography>AI Plan Generator</Typography>
              </Stack>
            </MenuItem>
            <MenuItem
              component={RouterLink}
              to="/prompt-generator"
              onClick={handleMenuClose}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <AutoAwesomeIcon fontSize="small" />
                <Typography>Prompt Generator</Typography>
              </Stack>
            </MenuItem>
            <MenuItem
              component={RouterLink}
              to="/files"
              onClick={handleMenuClose}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <FolderSharedIcon fontSize="small" />
                <Typography>File Explorer</Typography>
              </Stack>
            </MenuItem>
            <MenuItem
              component={RouterLink}
              to="/stream-demo"
              onClick={handleMenuClose}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <SendIcon fontSize="small" />
                <Typography>Stream Demo</Typography>
              </Stack>
            </MenuItem>
          </Menu>

          {isLoggedIn ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2, color: 'inherit' }}>
                Welcome, {user?.firstName || user?.email || 'User'}
              </Typography>
              <Button
                onClick={logout}
                color="inherit"
                variant="text"
                size="small"
                startIcon={<LogoutIcon fontSize="small" />}
                sx={{ mr: 1 }}
              >
                Logout
              </Button>
            </Box>
          ) : (
            <RouterLink to="/login" style={{ textDecoration: 'none' }}>
              <Button
                color="inherit"
                variant="text"
                size="small"
                startIcon={<LoginIcon fontSize="small" />}
                sx={{ mr: 1 }}
              >
                Login
              </Button>
            </RouterLink>
          )}
          <ThemeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
};