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
import VisibilityIcon from '@mui/icons-material/Visibility';

import { ClockDisplayType, ClockConfig } from './types';
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
  const [newClockFormat24Hr, setNewClockFormat24Hr] = useState(false);


  const handleAddClock = useCallback(() => {
    const newId = `clock-${Date.now()}`;
    addClockConfig({
      id: newId,
      label: newClockLabel,
      timezone: newClockTimezone || 'UTC',
      displayType: newClockDisplayType,
      format24Hr: newClockDisplayType === 'digital' ? newClockFormat24Hr : undefined,
    });
    setNewClockLabel('New Clock');
    setNewClockFormat24Hr(false);
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
    if (!config) return null;
    const safeConfig: ClockConfig = {
      id: config.id,
      label: config.label || 'Clock',
      timezone: config.timezone || 'UTC',
      displayType: config.displayType,
      format24Hr: config.format24Hr ?? false,
    };

    // Fixed font/size for preview clocks
    const previewFontSize = 14; // px
    const analogPreviewSize = 40; // px

    return safeConfig.displayType === 'digital'
      ? <ClockDigital config={safeConfig} isConfigPreview fontSize={previewFontSize} />
      : <ClockAnalog config={safeConfig} isConfigPreview size={analogPreviewSize} />;
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
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              pr: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 1,
            }}
          >
            <Box className="flex-shrink-0 w-36">
              <TextField
                value={config.label}
                onChange={(e) => handleUpdateLabel(config.id, e.target.value)}
                variant="standard"
                size="small"
                fullWidth
                label="Label"
                InputProps={{ style: { fontSize: 13 } }}
                InputLabelProps={{ style: { fontSize: 12 } }}
              />
            </Box>

            <Box
              className="flex-shrink-0 flex items-center gap-1 border-r pr-4 pl-2 self-stretch"
              sx={{ borderColor: 'divider' }}
            >
              <VisibilityIcon fontSize="small" color="action" sx={{ alignSelf: 'center', mt: 1 }} />
              {renderClockPreview(config)}
            </Box>

            <Box className="flex gap-2 items-center flex-grow justify-end">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={config.timezone || 'UTC'}
                  onChange={(e) => handleUpdateTimezone(config.id, e.target.value)}
                  displayEmpty
                  sx={{ fontSize: 13 }}
                >
                  {AvailableTimezones.map((tz) => (
                    <MenuItem key={tz.value} value={tz.value} sx={{ fontSize: 13 }}>
                      {tz.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant={config.displayType === 'digital' ? 'contained' : 'outlined'}
                onClick={() => handleUpdateDisplayType(config.id, 'digital')}
                startIcon={<DvrIcon />}
                size="small"
                sx={{ minWidth: 80, fontSize: 12 }}
              >
                Digital
              </Button>
              <Button
                variant={config.displayType === 'analog' ? 'contained' : 'outlined'}
                onClick={() => handleUpdateDisplayType(config.id, 'analog')}
                startIcon={<AlarmOnIcon />}
                size="small"
                sx={{ minWidth: 80, fontSize: 12 }}
              >
                Traditional
              </Button>

              {config.displayType === 'digital' && (
                <Box className="flex gap-1 items-center flex-shrink-0">
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                    Format:
                  </Typography>
                  <Button
                    variant={config.format24Hr === true ? 'outlined' : 'contained'}
                    onClick={() => handleUpdateFormat(config.id, false)}
                    size="small"
                    sx={{ minWidth: 60, fontSize: 12 }}
                  >
                    12 Hr
                  </Button>
                  <Button
                    variant={config.format24Hr === true ? 'contained' : 'outlined'}
                    onClick={() => handleUpdateFormat(config.id, true)}
                    size="small"
                    sx={{ minWidth: 60, fontSize: 12 }}
                  >
                    24 Hr
                  </Button>
                </Box>
              )}

              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleRemoveClock(config.id)}
                color="error"
                disabled={configs.length === 1}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      {/* Add Clock Section */}
      <Divider sx={{ my: 2 }} />
      <Box className="flex gap-4 items-end mt-4">
        <TextField
          label="Clock Label"
          value={newClockLabel}
          onChange={(e) => setNewClockLabel(e.target.value)}
          size="small"
          variant="outlined"
          required
          InputProps={{ style: { fontSize: 13 } }}
          InputLabelProps={{ style: { fontSize: 12 } }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }} required>
          <InputLabel sx={{ fontSize: 12 }}>Timezone</InputLabel>
          <Select
            value={newClockTimezone}
            onChange={(e) => setNewClockTimezone(e.target.value as string)}
            label="Timezone"
            sx={{ fontSize: 13 }}
          >
            {AvailableTimezones.map((tz) => (
              <MenuItem key={`new-${tz.value}`} value={tz.value} sx={{ fontSize: 13 }}>
                {tz.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }} required>
          <InputLabel sx={{ fontSize: 12 }}>Display</InputLabel>
          <Select
            value={newClockDisplayType}
            onChange={(e) => setNewClockDisplayType(e.target.value as ClockDisplayType)}
            label="Display"
            sx={{ fontSize: 13 }}
          >
            <MenuItem value="digital" sx={{ fontSize: 13 }}>Digital</MenuItem>
            <MenuItem value="analog" sx={{ fontSize: 13 }}>Traditional</MenuItem>
          </Select>
        </FormControl>

        {newClockDisplayType === 'digital' && (
          <FormControl size="small" sx={{ minWidth: 100 }} required>
            <InputLabel sx={{ fontSize: 12 }}>Time Format</InputLabel>
            <Select
              value={newClockFormat24Hr ? '24hr' : '12hr'}
              onChange={(e) => setNewClockFormat24Hr(e.target.value === '24hr')}
              label="Time Format"
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="12hr" sx={{ fontSize: 13 }}>12 Hr</MenuItem>
              <MenuItem value="24hr" sx={{ fontSize: 13 }}>24 Hr</MenuItem>
            </Select>
          </FormControl>
        )}

        <Button
          onClick={handleAddClock}
          startIcon={<AddIcon />}
          variant="contained"
          color="success"
          disabled={!newClockLabel || !newClockTimezone}
          sx={{ fontSize: 13 }}
        >
          Add Clock
        </Button>
      </Box>
    </Box>
  ), [
    configs,
    newClockLabel,
    newClockTimezone,
    newClockDisplayType,
    newClockFormat24Hr,
    handleAddClock,
    handleUpdateDisplayType,
    handleUpdateFormat,
    handleRemoveClock,
    handleUpdateLabel,
    handleUpdateTimezone,
    theme.palette.divider,
  ]);

  return (
    <CustomDialog
      open={open}
      onClose={(_e, reason) => {
        if (reason === 'closeButtonClick') {
          onClose();
        }
      }}
      title="Clock Configuration"
      content={dialogContent}
      maxWidth="lg"
      fullWidth
      showCloseButton
    />
  );
};

export default ClockConfigDialog;
