import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Check, Add, Delete, AutoFixHigh, DesignServices } from '@mui/icons-material';
import { DEFAULT_SYSTEM_CONFIG } from './index'; 
// Import the new GUI editor
import JsonSchemaGuiEditor from '@/components/JsonSchemaGuiEditor'; 

// --- Helper Functions to Handle Nested State (UNCHANGED) ---
const getNestedValue = (obj: any, path: string[]) => {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

const setNestedValue = (obj: any, path: string[], value: any) => {
  if (!obj) return {};
  const output = Array.isArray(obj) ? [...obj] : { ...obj };
  let current = output;

  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (i === path.length - 1) {
      current[key] = value;
    } else {
      if (!current[key] || (typeof current[key] !== 'object') || Array.isArray(current[key])) {
        const nextKeyIsIndex = i + 1 < path.length && !isNaN(parseInt(path[i+1]));
        current[key] = nextKeyIsIndex ? [] : {};
      }
      current = current[key];
    }
  }

  return output;
};

// --- Array Input Component (UNCHANGED) ---
interface ArrayInputProps {
    label: string;
    items: string[];
    onChange: (path: string[], value: string[]) => void;
    path: string[];
}
const ArrayInput: React.FC<ArrayInputProps> = ({ label, items, onChange, path }) => {
    // ... (unchanged ArrayInput implementation) ...
    const [newItem, setNewItem] = useState('');
    const handleAddItem = () => {
        if (newItem.trim()) {
        onChange(path, [...items, newItem.trim()]);
        setNewItem('');
        }
    };
    const handleDeleteItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(path, newItems);
    };
    return (
        <Box sx={{ my: 2 }}>
        <Typography variant="subtitle1" className="font-semibold mb-1">
            {label}
        </Typography>
        <Paper elevation={1} className="flex flex-wrap gap-2 mb-2 p-2 min-h-[40px] max-h-40 overflow-y-auto border border-dashed">
            {items && items.map((item, index) => (
            <Chip
                key={index}
                label={item}
                onDelete={() => handleDeleteItem(index)}
                size="small"
            />
            ))}
            {(!items || items.length === 0) && (
                <Typography variant="body2" color="text.secondary" className="italic pt-1 pl-1">
                No items added.
                </Typography>
            )}
        </Paper>
        <Box className="flex gap-2">
            <TextField
            label={`New ${label.replace(/ \(List\)/g, '')} Item`}
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

// --- Form Section Renderer (UNCHANGED) ---
interface FormSectionProps {
    title: string;
    data: any;
    path: string[];
    handleChange: (path: string[], value: any) => void;
}
const FormSection: React.FC<FormSectionProps> = ({ title, data, path, handleChange }) => {
  const fields = Object.entries(data);
    // ... (unchanged FormSection implementation) ...
    return (
        <Accordion elevation={3} defaultExpanded className="shadow-lg mb-4 rounded-lg overflow-hidden">
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            className="transition duration-150 hover:bg-opacity-80 "
          >
            <Typography variant="h6" className="font-bold">{title}</Typography>
          </AccordionSummary>
          <AccordionDetails className="p-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {fields.map(([key, value]) => {
              const currentPath = [...path, key];
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
              if (Array.isArray(value)) {
                return (
                  <div key={key} className="md:col-span-2">
                    <ArrayInput
                      label={`${label} (List)`}
                      items={value || []}
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
                        checked={!!value}
                        onChange={(e) => handleChange(currentPath, e.target.checked)}
                        color="primary"
                      />
                    }
                    label={label}
                    className="col-span-1"
                  />
                );
              } else if (typeof value === 'object' && value !== null) {
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


// --- Mock Gemini API Call (UNCHANGED) ---
const mockGenerateSchema = (jsonConfig: object): Promise<string> => {
    // ... (unchanged mockGenerateSchema implementation) ...
    const configString = JSON.stringify(jsonConfig, null, 2);

    return new Promise((resolve) => {
        setTimeout(() => {
            const generatedSchema = {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "AI Configuration Generated by Gemini",
                "description": "Schema generated based on the current configuration data structure.",
                "type": "object",
                "properties": {
                    "system_instruction": {
                        "type": "object",
                        "description": "Root configuration for the AI assistant.",
                        "properties": {
                            "name": { "type": "string", "description": "Name of the agent." },
                            "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
                            "behavior": {
                                "type": "object",
                                "properties": {
                                    "tone": { "type": "string" },
                                    "structured_output": { "type": "boolean" },
                                    "adaptivity": { "type": "string", "enum": ["Low", "medium", "High"] }
                                },
                                "required": ["tone", "structured_output"]
                            }
                        },
                        "required": ["name", "version", "behavior"]
                    }
                },
                "required": ["system_instruction"]
            };
            
            resolve(JSON.stringify(generatedSchema, null, 2));
        }, 1500);
    });
};

// --- JSON Schema Conversion Helpers ---

/**
 * Extracts and normalizes the main system_instruction properties for the GUI editor.
 * @param {string} schemaString - The raw JSON schema string.
 * @returns {object | null} An object containing {properties, requiredKeys} or null if parsing fails.
 */
const extractSystemInstructionProps = (schemaString: string) => {
    try {
        const schema = JSON.parse(schemaString);
        
        const systemInstructionSchema = schema?.properties?.system_instruction;

        if (!systemInstructionSchema || systemInstructionSchema.type !== 'object' || !systemInstructionSchema.properties) {
            throw new Error("Schema does not contain a valid 'system_instruction' object properties.");
        }

        return {
            properties: systemInstructionSchema.properties,
            requiredKeys: systemInstructionSchema.required || []
        };
    } catch (e) {
        console.error("Failed to parse or extract schema properties:", e);
        return null;
    }
};

// --- Main Component (UPDATED) ---

const SystemConfigForm = () => {
  const initialConfig = DEFAULT_SYSTEM_CONFIG.json.system_instruction;
  const initialSchemaString = JSON.stringify(DEFAULT_SYSTEM_CONFIG.schema, null, 2);
  
  const [config, setConfig] = useState(initialConfig);
  const [schemaString, setSchemaString] = useState(initialSchemaString);
  const [schemaError, setSchemaError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // Memoize the extracted properties for the GUI editor
  const guiSchemaData = useMemo(() => extractSystemInstructionProps(schemaString), [schemaString]);


  // Handler for updating properties from the GUI editor (Tab 2)
  const handleGuiSchemaUpdate = (newProps: any, newRequired: string[]) => {
      // 1. Parse the current raw schema string
      let schema: any;
      try {
          schema = JSON.parse(schemaString);
      } catch (e) {
          console.error("Cannot update schema, invalid JSON:", e);
          return;
      }
      
      // 2. Safely apply the changes back to the root 'system_instruction' object
      const updatedSchema = setNestedValue(
          schema, 
          ['properties', 'system_instruction'], 
          {
              ...schema.properties.system_instruction,
              properties: newProps,
              required: newRequired.length > 0 ? newRequired : undefined, // Remove required array if empty
          }
      );

      // 3. Update the schemaString state with the new, pretty-printed JSON
      setSchemaString(JSON.stringify(updatedSchema, null, 2));
      setSchemaError(''); // Clear error if update was successful
  };


  // General handler for all field changes
  const handleConfigChange = (path: string[], value: any) => {
    setConfig((prev) => setNestedValue(prev, path, value));
  };

  // Handler for schema text field (Raw Editor: Tab 1)
  const handleSchemaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newSchemaString = e.target.value;
    setSchemaString(newSchemaString);
    setSchemaError('');

    try {
      JSON.parse(newSchemaString);
    } catch (error: any) {
      setSchemaError('Invalid JSON format. Please correct the syntax.');
    }
  };
  
  // Handler for Gemini Schema Generation
  const handleGenerateSchema = async () => {
    setIsGenerating(true);
    setSchemaError('');
    try {
        const currentJsonData = { system_instruction: config };
        const generatedSchema = await mockGenerateSchema(currentJsonData);
        
        setSchemaString(generatedSchema);

        try {
             JSON.parse(generatedSchema);
        } catch (error) {
            setSchemaError('Gemini generated an invalid JSON structure.');
        }

    } catch (error) {
        setSchemaError('Failed to generate schema from Gemini API.');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentTab === 0) {
      // Configuration submission 
      console.log('Submitted Configuration:', config);
      alert('Configuration saved (Check console for output)!');
    } else if (currentTab === 1 || currentTab === 2) {
      // Schema submission (from Raw Editor or GUI)
      if (schemaError) {
        alert('Cannot save: JSON Schema has an invalid format.');
        return;
      }
      try {
          const newSchema = JSON.parse(schemaString);
          console.log('Submitted JSON Schema:', newSchema);
          alert('JSON Schema saved and validated! Configuration structure should now be validated against this schema.');
          // In a real app, dispatch newSchema to global state/API

      } catch (error) {
          alert('Error: Schema is not valid JSON.');
      }
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const topLevelEntries = Object.entries(config);
  const topLevelFields = topLevelEntries.filter(([, value]) => typeof value !== 'object' || value === null || Array.isArray(value));
  const topLevelSections = topLevelEntries.filter(([, value]) => typeof value === 'object' && value !== null && !Array.isArray(value));

  return (
<Box className="p-2">
    <Box className="text-center mb-4">
      <Typography variant="h4" component="h1" className="font-extrabold">
          AI System Instruction Editor
        </Typography>
        <Typography variant="body1" color="secondary">
            Modify 'system_instruction' structure and its validation schema.
        </Typography>
        </Box>

        <Paper sx={{ mb: 2 }} elevation={2}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="Configuration Tabs">
            <Tab label="Configuration Data" />
            <Tab label="JSON Schema Editor (Raw)" /> {/* <--- TAB 1: Raw Editor */}
            <Tab label="Schema Editor (GUI)" />       {/* <--- TAB 2: GUI Editor */}
            <Tab label="Schema Reference" />          {/* <--- TAB 3: Read-Only */}
          </Tabs>
        </Paper>
       
       <Box className="flex-grow overflow-y-auto h-[calc(100vh-220px)] p-2" sx={{backgroundColor: 'background.default', borderRadius: 1}}>
        
        {/* Tab 0: Configuration Data Editor (UNCHANGED) */}
        {currentTab === 0 && (
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* ... (Existing Tab 0 content) ... */}
           <Box className="space-y-6 pb-6 flex-grow" >
            
            {/* Top-Level Primitive Fields */}
            <Paper elevation={3} className="p-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-l-4 border-indigo-500">
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

            {/* Nested Sections */}
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
          </form>
        )}

        {/* Tab 1: JSON Schema Editor (Raw) */}
        {currentTab === 1 && (
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <Paper elevation={3} className="p-2 flex-grow flex flex-col rounded-lg border-l-4 border-orange-500">
                <Box className="flex justify-between items-center mb-3">
                    <Typography variant="h6" sx={{ color: 'text.primary' }} className="font-semibold">
                        Editable JSON Schema (Raw)
                    </Typography>
                    <Button
                        onClick={handleGenerateSchema}
                        variant="contained"
                        color="secondary"
                        size="small"
                        startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutoFixHigh />}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Generating...' : 'Generate Schema with Gemini'}
                    </Button>
                </Box>
                {schemaError && (
                    <Alert severity="error" className="mb-3">
                        {schemaError}
                    </Alert>
                )}
                <TextField
                    label="JSON Schema"
                    multiline
                    fullWidth
                    rows={20}
                    variant="outlined"
                    value={schemaString}
                    onChange={handleSchemaChange}
                    sx={{
                        '& textarea': { fontFamily: 'monospace', fontSize: 14, lineHeight: 1.5 },
                        flexGrow: 1,
                    }}
                />
            </Paper>
            </form>
        )}

        {/* Tab 2: JSON Schema Editor (GUI) */}
        {currentTab === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <Paper elevation={3} className="p-2 flex-grow flex flex-col rounded-lg border-l-4 border-blue-500">
                <Box className="flex justify-between items-center mb-3">
                    <Typography variant="h6" sx={{ color: 'text.primary' }} className="font-semibold">
                        JSON Schema Editor (GUI) - Properties of `system_instruction`
                    </Typography>
                    <Chip 
                        label={schemaError ? "Invalid Schema" : "Schema Parsed"} 
                        color={schemaError ? "error" : "success"}
                        icon={<DesignServices />}
                    />
                </Box>

                {guiSchemaData && (
                    <JsonSchemaGuiEditor
                        title="Top-Level Instruction Fields"
                        properties={guiSchemaData.properties}
                        requiredKeys={guiSchemaData.requiredKeys}
                        path={['properties', 'system_instruction', 'properties']}
                        onPropertiesChange={handleGuiSchemaUpdate}
                    />
                )}
                
                {!guiSchemaData && (
                    <Alert severity="error">
                        Cannot load GUI editor. The raw JSON Schema is invalid or does not contain a valid 'system_instruction' object. Please fix the Raw Editor (Tab 1) first.
                    </Alert>
                )}

            </Paper>
            </form>
        )}
       
        {/* Tab 3: JSON Schema Reference (Read-Only) */}
        {currentTab === 3 && (
            <Paper elevation={3} className="p-4 overflow-x-auto rounded-lg border-l-4 border-green-500">
                <Typography variant="h6" sx={{ color: 'text.primary' }} className="mb-3 font-semibold">
                    Original Schema Reference
                </Typography>
                <pre className="text-xs bg-gray-900 text-green-300 p-3 rounded overflow-auto">
                    {JSON.stringify(DEFAULT_SYSTEM_CONFIG.schema, null, 2)}
                </pre>
            </Paper>
        )}
       </Box>

       {/* Common Save Button Box */}
       <Box className="flex justify-center sticky bottom-0 bg-white dark:bg-gray-900 py-3 mt-4 shadow-2xl rounded-t-lg border-t">
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<Check />}
            className="shadow-xl px-10"
            onClick={handleSubmit} 
            disabled={currentTab !== 0 && (!!schemaError || isGenerating)}
          >
            Save {currentTab === 0 ? 'Configuration' : (currentTab === 1 || currentTab === 2) ? 'Schema' : 'Changes'}
          </Button>
        </Box>
    </Box>
  );
};

export default SystemConfigForm;
