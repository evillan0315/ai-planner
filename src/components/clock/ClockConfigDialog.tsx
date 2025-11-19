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
  ListItemText,
  useTheme,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DvrIcon from '@mui/icons-material/Dvr';
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import { ClockDisplayType } from './types';

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

  const handleAddClock = useCallback(() => {
    const newId = `clock-${Date.now()}`;
    addClockConfig({
      id: newId,
      label: newClockLabel,
      timezone: newClockTimezone,
      displayType: newClockDisplayType,
    });
    setNewClockLabel('New Clock'); // Reset input
  }, [newClockLabel, newClockTimezone, newClockDisplayType]);
  
  const handleUpdateDisplayType = useCallback((id: string, newType: ClockDisplayType) => {
    updateClockConfig(id, { displayType: newType });
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
  

  const dialogContent = useMemo(() => (
    <Box sx={{ p: 2, minWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        Manage Clocks ({configs.length})
      </Typography>
      
      {/* List of Existing Clocks */}
      <List dense>
        {configs.map((config) => (
          <ListItem 
            key={config.id}
            secondaryAction={
                <Box className="flex gap-2 items-center">
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
            }
            sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pr: 20 }}
          >
            <ListItemText 
                primary={(
                    <TextField
                        value={config.label}
                        onChange={(e) => handleUpdateLabel(config.id, e.target.value)}
                        variant="standard"
                        size="small"
                        className="w-40"
                    />
                )}
            />
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
  ), [configs, newClockLabel, newClockTimezone, newClockDisplayType, handleAddClock, handleUpdateDisplayType, handleRemoveClock, handleUpdateLabel, handleUpdateTimezone, theme.palette.divider]);

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
      maxWidth="lg"
      fullWidth={false}
      showCloseButton={true}
    />
  );
};

export default ClockConfigDialog;