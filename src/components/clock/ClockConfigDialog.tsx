import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  clockConfigsStore,
  updateClockConfig,
  addClockConfig,
  removeClockConfig,
  AvailableTimezones,
} from '@/stores/clockStore';
import CustomDialog from '@/components/ui/dialogs/CustomDialog';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  List,
  ListItem,
  useTheme,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DvrIcon from '@mui/icons-material/Dvr';
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import VisibilityIcon from '@mui/icons-material/Visibility'; // NEW IMPORT

import { ClockDisplayType, ClockConfig } from './types';
// NEW IMPORTS
import ClockAnalog from './ClockAnalog'; 
import ClockDigital from './ClockDigital'; 

interface ClockConfigDialogProps {
  open: boolean;
  onClose: () => void;
}

const ClockConfigDialog: React.FC<ClockConfigDialogProps> = ({ open, onClose }) => {
  const configs = useStore(clockConfigsStore);
  const theme = useTheme();

  const [newClockLabel, setNewClockLabel] = useState('New Clock');
  const [newClockTimezone, setNewClockTimezone] = useState(AvailableTimezones[0].value);
  const [newClockDisplayType, setNewClockDisplayType] = useState<ClockDisplayType>('digital');
  // NEW STATE: Default to 12hr format (false)
  const [newClockFormat24Hr, setNewClockFormat24Hr] = useState(false);


  const handleAddClock = useCallback(() => {
    const newId = `clock-${Date.now()}`;
    addClockConfig({
      id: newId,
      label: newClockLabel,
      timezone: newClockTimezone,
      displayType: newClockDisplayType,
      format24Hr: newClockDisplayType === 'digital' ? newClockFormat24Hr : undefined, // Only save if digital
    });
    setNewClockLabel('New Clock'); // Reset input
    setNewClockFormat24Hr(false); // Reset format preference
  }, [newClockLabel, newClockTimezone, newClockDisplayType, newClockFormat24Hr]);
  
  const handleUpdateDisplayType = useCallback((id: string, newType: ClockDisplayType) => {
    updateClockConfig(id, { displayType: newType });
  }, []);
  
  const handleUpdateFormat = useCallback((id: string, format24Hr: boolean) => {
    updateClockConfig(id, { format24Hr });
  }, []);

  const handleUpdateLabel = useCallback((id: string, newLabel: string) => {
    updateClockConfig(id, { label: newLabel });
  }, []);
  
  const handleRemoveClock = useCallback((id: string) => {
    removeClockConfig(id);
  }, []);
  
  const handleUpdateTimezone = useCallback((id: string, newTimezone: string) => {
      updateClockConfig(id, { timezone: newTimezone });
  }, []);
  
  const renderClockPreview = (config: ClockConfig) => {
    if (config.displayType === 'digital') {
      // Pass isConfigPreview = true
      return <ClockDigital config={config} isConfigPreview={true} />;
    }
    // Pass isConfigPreview = true
    return <ClockAnalog config={config} isConfigPreview={true} />;
  };

  const dialogContent = useMemo(() => (
    <Box sx={{ p: 2, minWidth: 900 }}> 
      <Typography variant="h6" gutterBottom>
        Manage Clocks ({configs.length})
      </Typography>
      <List dense>
        {configs.map((config) => (
          <ListItem 
            key={config.id}
            // secondaryAction removed, using internal flex layout
            sx={{ 
                borderBottom: `1px solid ${theme.palette.divider}`, 
                pr: 2, 
                // Set the list item to use flex layout internally for better control
                display: 'flex', 
                alignItems: 'center',
                gap: 2, // Gap between sections
                py: 1, // Add vertical padding to accommodate clock size
            }}
          >
            
            {/* 1. Label Editor (Flex-shrink-0, fixed width) */}
            <Box className="flex-shrink-0 w-36">
                 <TextField
                    value={config.label}
                    onChange={(e) => handleUpdateLabel(config.id, e.target.value)}
                    variant="standard"
                    size="small"
                    fullWidth
                    label="Label"
                />
            </Box>

            {/* 2. Clock Preview (Flex-shrink-0, border separator) */}
            <Box 
                className="flex-shrink-0 flex items-center gap-1 border-r pr-4 pl-2 self-stretch"
                sx={{borderColor: 'divider'}}
            >
                <VisibilityIcon fontSize="small" color="action" sx={{ alignSelf: 'center', mt: 1}} />
                {renderClockPreview(config)}
            </Box>
            
            {/* 3. Controls (Timezone, Display Type, Format, Delete) (Flex-grow, justify-end) */}
            <Box className="flex gap-2 items-center flex-grow justify-end">
                {/* Timezone Selector */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                        value={config.timezone}
                        onChange={(e) => handleUpdateTimezone(config.id, e.target.value as string)}
                        displayEmpty
                    >
                        {AvailableTimezones.map((tz) => (
                            <MenuItem key={tz.value} value={tz.value}>{tz.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Display Toggle */}
                <Button
                    variant={config.displayType === 'digital' ? 'contained' : 'outlined'}
                    onClick={() => handleUpdateDisplayType(config.id, 'digital')}
                    startIcon={<DvrIcon />}
                    size="small"
                    sx={{ minWidth: 80 }}
                >
                    Digital
                </Button>
                <Button
                    variant={config.displayType === 'analog' ? 'contained' : 'outlined'}
                    onClick={() => handleUpdateDisplayType(config.id, 'analog')}
                    startIcon={<AlarmOnIcon />}
                    size="small"
                    sx={{ minWidth: 80 }}
                >
                    Traditional
                </Button>
                
                {/* NEW: 12hr / 24hr Format Toggle (only for digital clocks) */}
                {config.displayType === 'digital' && (
                     <Box className="flex gap-1 items-center flex-shrink-0">
                        <Typography variant="caption" color="text.secondary">Format:</Typography>
                        <Button
                            variant={config.format24Hr === true ? 'outlined' : 'contained'} // Contained for 12hr (default)
                            onClick={() => handleUpdateFormat(config.id, false)}
                            size="small"
                            sx={{ minWidth: 60 }}
                        >
                            12 Hr
                        </Button>
                        <Button
                            variant={config.format24Hr === true ? 'contained' : 'outlined'} // Contained for 24hr
                            onClick={() => handleUpdateFormat(config.id, true)}
                            size="small"
                            sx={{ minWidth: 60 }}
                        >
                            24 Hr
                        </Button>
                    </Box>
                )}


                {/* Delete Button */}
                <IconButton 
                    edge="end" 
                    aria-label="delete" 
                    onClick={() => handleRemoveClock(config.id)}
                    color="error"
                    disabled={configs.length === 1} // Prevent deleting the last clock
                >
                    <DeleteIcon />
                </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Add New Clock Form */}
      <Box className="flex gap-4 items-end mt-4">
        <TextField
          label="Clock Label"
          value={newClockLabel}
          onChange={(e) => setNewClockLabel(e.target.value)}
          size="small"
          variant="outlined"
          required
        />
        <FormControl size="small" sx={{ minWidth: 150 }} required>
          <InputLabel>Timezone</InputLabel>
          <Select
            value={newClockTimezone}
            onChange={(e) => setNewClockTimezone(e.target.value as string)}
            label="Timezone"
          >
            {AvailableTimezones.map((tz) => (
              <MenuItem key={`new-${tz.value}`} value={tz.value}>{tz.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 120 }} required>
          <InputLabel>Display</InputLabel>
          <Select
            value={newClockDisplayType}
            onChange={(e) => setNewClockDisplayType(e.target.value as ClockDisplayType)}
            label="Display"
          >
              <MenuItem value="digital">Digital</MenuItem>
              <MenuItem value="analog">Traditional</MenuItem>
          </Select>
        </FormControl>
        
        {/* NEW: Time Format Selector (Conditional based on display type) */}
        {newClockDisplayType === 'digital' && (
             <FormControl size="small" sx={{ minWidth: 100 }} required>
                <InputLabel>Time Format</InputLabel>
                <Select
                    value={newClockFormat24Hr ? '24hr' : '12hr'}
                    onChange={(e) => setNewClockFormat24Hr(e.target.value === '24hr')}
                    label="Time Format"
                >
                    <MenuItem value="12hr">12 Hr</MenuItem>
                    <MenuItem value="24hr">24 Hr</MenuItem>
                </Select>
             </FormControl>
        )}

        <Button
          onClick={handleAddClock}
          startIcon={<AddIcon />}
          variant="contained"
          color="success"
          disabled={!newClockLabel || !newClockTimezone}
        >
          Add Clock
        </Button>
      </Box>
    </Box>
  ), [configs, newClockLabel, newClockTimezone, newClockDisplayType, newClockFormat24Hr, handleAddClock, handleUpdateDisplayType, handleUpdateFormat, handleRemoveClock, handleUpdateLabel, handleUpdateTimezone, theme.palette.divider]);

  return (
    <CustomDialog
      open={open}
      onClose={(_e, reason) => {
          // Only allow closing via explicit button click if we need to manage state reset
          if (reason === 'closeButtonClick') {
             onClose();
          }
      }}
      title="Clock Configuration"
      content={dialogContent}
      maxWidth="lg" // Use large size to accommodate expanded content
      fullWidth={true}
      showCloseButton={true}
    />
  );
};

export default ClockConfigDialog;