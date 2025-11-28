import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Check, Add } from '@mui/icons-material';
import { GEMINI_SYSTEM_CONFIG } from './index'; // Assuming you save the config here

// --- Helper Functions to Handle Nested State ---

/**
 * Gets a value from a nested object using a path array.
 * @param {object} obj - The object to traverse.
 * @param {string[]} path - The array of keys representing the path.
 */
const getNestedValue = (obj, path) => {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

/**
 * Sets a value in a nested object using a path array.
 * @param {object} obj - The object to modify.
 * @param {string[]} path - The array of keys representing the path.
 * @param {*} value - The new value to set.
 */
const setNestedValue = (obj, path, value) => {
  const newObj = { ...obj };
  let current = newObj;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (i === path.length - 1) {
      current[key] = value;
    } else {
      if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
        // Create a new object if the intermediate path doesn't exist or is a primitive/array
        current[key] = {};
      }
      current = current[key];
    }
  }
  return newObj;
};

// --- Array Input Component ---

const ArrayInput = ({ label, items, onChange, path }) => {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem.trim()) {
      onChange(path, [...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleDeleteItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(path, newItems);
  };

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="subtitle1" className="font-semibold mb-1">
        {label}
      </Typography>
      <Paper elevation={1} className="flex flex-wrap gap-2 mb-2 p-2 min-h-[40px] max-h-40 overflow-y-auto border border-dashed">
        {items.map((item, index) => (
          <Chip
            key={index}
            label={item}
            onDelete={() => handleDeleteItem(index)}
            size="small"
          />
        ))}
        {!items || items.length === 0 && (
            <Typography variant="body2" color="text.secondary" className="italic pt-1 pl-1">
              No items added.
            </Typography>
        )}
      </Paper>
      <Box className="flex gap-2">
        <TextField
          label={`New ${label.replace(/ \(Array\)/g, '')} Item`}
          variant="outlined"
          size="small"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          fullWidth
        />
        <Button
          onClick={handleAddItem}
          variant="contained"
          size="small"
          startIcon={<Add />}
          disabled={!newItem.trim()}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

// --- Form Section Renderer ---

const FormSection = ({ title, data, path, handleChange }) => {
  const fields = Object.entries(data);

  return (
    <Accordion elevation={3} defaultExpanded className="shadow-lg mb-4 rounded-lg overflow-hidden">
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        className="transition duration-150 hover:bg-opacity-80"
      >
        <Typography variant="h6" className="font-bold">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 ">
        {fields.map(([key, value]) => {
          const currentPath = [...path, key];
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

          if (Array.isArray(value)) {
            return (
              <div key={key} className="md:col-span-2">
                <ArrayInput
                  label={`${label}`}
                  items={value}
                  onChange={handleChange}
                  path={currentPath}
                />
              </div>
            );
          } else if (typeof value === 'boolean') {
            return (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={value}
                    onChange={(e) => handleChange(currentPath, e.target.checked)}
                    color="primary"
                  />
                }
                label={label}
                className="col-span-1"
              />
            );
          } else if (typeof value === 'object' && value !== null) {
            // Recursively render nested objects
            return (
              <div key={key} className="md:col-span-2 mt-2">
                <FormSection
                  title={label}
                  data={value}
                  path={currentPath}
                  handleChange={handleChange}
                />
              </div>
            );
          } else {
            // Default: Text Field for strings/numbers
            const isTextArea = key === 'description' || key === 'reply_format' || key === 'reasoning' || key === 'tone' || key === 'adaptivity';
            return (
              <TextField
                key={key}
                label={label}
                variant="outlined"
                size="small"
                value={value || ''}
                onChange={(e) => handleChange(currentPath, e.target.value)}
                fullWidth
                multiline={isTextArea}
                rows={isTextArea ? 2 : 1}
                className="col-span-1"
              />
            );
          }
        })}
      </AccordionDetails>
    </Accordion>
  );
};

// --- Main Component ---

const SystemConfigForm = () => {
  const [config, setConfig] = useState(GEMINI_SYSTEM_CONFIG.json.system_instruction);
  const [currentTab, setCurrentTab] = useState(0);

  // General handler for all field changes
  const handleConfigChange = (path, value) => {
    setConfig((prev) => setNestedValue(prev, path, value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted Configuration:', config);
    alert('Configuration saved (Check console for output)!');
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Extract the top-level keys for the form (name, version, description, behavior, etc.)
  const topLevelSections = Object.entries(config).filter(([key, value]) => typeof value === 'object' && value !== null && !Array.isArray(value));
  const topLevelFields = Object.entries(config).filter(([key, value]) => typeof value !== 'object' || value === null || Array.isArray(value));

  return (
<Box className="p-4">
    <Box className="text-center">
      <Typography variant="h4" component="h1" className="font-extrabold">
          System Configuration Editor
        </Typography>
        <Typography variant="body1" color="secondary">
            Edit AI System Instructions and Schema Parameters.
        </Typography>
        </Box>

        <Tabs value={currentTab} onChange={handleTabChange} aria-label="Configuration Tabs">
          <Tab label="Editable JSON" />
          <Tab label="Schema View" />
        </Tabs>
       
       <Box className="flex-grow overflow-y-auto h-[calc(100vh-180px)] p-4" sx={{backgroundColor: 'background.paper'}}>
        {/* JSON Data Tab */}
        {currentTab === 0 && (
        
          <form onSubmit={handleSubmit} className="flex flex-col">
           <Box className="space-y-4 pb-6 flex-grow" >
            
            {/* Top-Level Primitive Fields (Name, Version, Description) */}
            <Paper elevation={1} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {topLevelFields.map(([key, value]) => {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const isTextArea = key === 'description';
                return (
                  <TextField
                    key={key}
                    label={label}
                    variant="outlined"
                    size="small"
                    value={value || ''}
                    onChange={(e) => handleConfigChange([key], e.target.value)}
                    fullWidth
                    multiline={isTextArea}
                    rows={isTextArea ? 3 : 1}
                  />
                );
              })}
            </Paper>

            {/* Nested Sections (Behavior, Interaction Rules, etc.) */}
            {topLevelSections.map(([key, value]) => (
              <FormSection
                key={key}
                title={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                data={value}
                path={[key]}
                handleChange={handleConfigChange}
              />
            ))}
           </Box>
            <Box className="flex justify-center sticky bottom-0 py-3 shadow-lg">
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<Check />}
                className="shadow-xl px-8"
              >
                Apply Configuration
              </Button>
            </Box>
          </form>
        )}

        {/* JSON Schema Tab (Read-Only) */}
        {currentTab === 1 && (
            <Paper elevation={1} className="p-4 overflow-x-auto rounded-lg">
                <Typography variant="h6" sx={{ color: 'primary.main' }} className="mb-2">
                    System Instruction Schema
                </Typography>
                <pre className="text-sm bg-gray-800 text-green-300 p-3 rounded overflow-auto">
                    {JSON.stringify(GEMINI_SYSTEM_CONFIG.schema, null, 2)}
                </pre>
            </Paper>
        )}
       </Box>
    
    </Box>
  );
};

export default SystemConfigForm;

