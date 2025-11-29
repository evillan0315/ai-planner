import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import { Add, Delete, Edit, Check } from '@mui/icons-material';

// --- Type Definitions for Schema Editor ---

interface SchemaProperty {
  type: string | string[];
  description?: string;
  properties?: { [key: string]: SchemaProperty };
  items?: SchemaProperty;
  enum?: string[];
  pattern?: string;
}

interface SchemaProperties {
  [key: string]: SchemaProperty;
}

interface SchemaEditorProps {
  properties: SchemaProperties;
  requiredKeys: string[];
  path: string[];
  onPropertiesChange: (
    newProperties: SchemaProperties,
    newRequiredKeys: string[],
  ) => void;
  title: string;
}

const PRIMITIVE_TYPES = ['string', 'number', 'boolean', 'array'];

// --- Helper Functions ---

const normalizeProperty = (prop: any): SchemaProperty => ({
  type: prop.type || 'string',
  description: prop.description || '',
  ...(prop.properties && { properties: prop.properties }),
  ...(prop.items && { items: prop.items }),
  ...(prop.enum && { enum: prop.enum }),
  ...(prop.pattern && { pattern: prop.pattern }),
});

// --- Property Editor Component ---

interface PropertyRowProps {
  name: string;
  property: SchemaProperty;
  required: boolean;
  onUpdate: (
    newName: string,
    newProperty: SchemaProperty,
    newRequired: boolean,
  ) => void;
  onDelete: () => void;
}

const PropertyRow: React.FC<PropertyRowProps> = ({
  name,
  property,
  required,
  onUpdate,
  onDelete,
}) => {
  const [currentName, setCurrentName] = useState(name);
  const [propState, setPropState] = useState(normalizeProperty(property));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setPropState(normalizeProperty(property));
  }, [property]);

  const handlePropChange = (key: keyof SchemaProperty, value: any) => {
    const newProp = { ...propState, [key]: value };
    setPropState(newProp);
    onUpdate(currentName, newProp, required);
  };

  const handleTypeChange = (value: string) => {
    let newProp: any = { ...propState, type: value };
    // Reset properties/items if changing to/from object/array
    if (value !== 'object') delete newProp.properties;
    if (value !== 'array') delete newProp.items;

    setPropState(newProp);
    onUpdate(currentName, newProp, required);
  };

  const handleSave = () => {
    // If name changed, trigger update
    onUpdate(currentName.trim(), propState, required);
    setIsEditing(false);
  };

  // Recursive rendering for nested properties
  const renderNestedEditor = () => {
    if (propState.type === 'object' && propState.properties) {
      return (
        <Box sx={{ ml: 3, mt: 2 }}>
          <JsonSchemaGuiEditor
            title={`Properties for: ${name}`}
            properties={propState.properties}
            requiredKeys={[]} // Assuming no direct required array for nested level in this simplified editor
            path={[]}
            onPropertiesChange={(newProps) =>
              handlePropChange('properties', newProps)
            }
          />
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 1,
        borderLeft: required ? '4px solid orange' : '4px solid lightgray',
      }}
    >
      <Box className="flex items-center gap-2 mb-2">
        <Chip
          label={required ? 'REQUIRED' : 'Optional'}
          size="small"
          color={required ? 'warning' : 'default'}
        />
        <Typography variant="subtitle2" className="font-bold flex-grow">
          {name}
        </Typography>
        <IconButton size="small" onClick={() => setIsEditing(!isEditing)}>
          <Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={onDelete}>
          <Delete fontSize="small" />
        </IconButton>
      </Box>

      {isEditing && (
        <Box className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2 p-2 border-t">
          <TextField
            label="Key Name"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            size="small"
            className="col-span-1"
          />
          <FormControl size="small" className="col-span-1">
            <InputLabel>Type</InputLabel>
            <Select
              value={
                Array.isArray(propState.type)
                  ? propState.type[0]
                  : propState.type
              }
              label="Type"
              onChange={(e) => handleTypeChange(e.target.value as string)}
            >
              {PRIMITIVE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
              <MenuItem value="object">object</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Description"
            value={propState.description || ''}
            onChange={(e) => handlePropChange('description', e.target.value)}
            size="small"
            className="col-span-2"
            multiline
            rows={1}
          />
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            className="md:col-span-4"
            startIcon={<Check />}
          >
            Save Property Details
          </Button>
        </Box>
      )}

      {/* Render nested properties editor if type is object */}
      {renderNestedEditor()}
    </Paper>
  );
};

// --- Main Schema Editor Component ---

const JsonSchemaGuiEditor: React.FC<SchemaEditorProps> = ({
  properties,
  requiredKeys,
  path,
  onPropertiesChange,
  title,
}) => {
  const [newKeyName, setNewKeyName] = useState('');

  const handleUpdateProperty = (
    oldName: string,
    newProp: SchemaProperty,
    newRequired: boolean,
  ) => {
    let newProps = { ...properties };
    let newRequiredKeys = [...requiredKeys];

    // Handle name change
    if (oldName !== newProp.name) {
      delete newProps[oldName];
      newProps[newProp.name as string] = newProp;
      const requiredIndex = newRequiredKeys.indexOf(oldName);
      if (requiredIndex !== -1) {
        newRequiredKeys[requiredIndex] = newProp.name as string;
      }
    } else {
      newProps[oldName] = newProp;
    }

    // Handle required status change (not explicitly exposed in this simplified UI yet, but required for name changes)
    const isCurrentlyRequired = newRequiredKeys.includes(oldName);
    if (newRequired && !isCurrentlyRequired) {
      newRequiredKeys.push(oldName);
    } else if (!newRequired && isCurrentlyRequired) {
      newRequiredKeys = newRequiredKeys.filter((k) => k !== oldName);
    }

    // Sort required keys for consistency
    newRequiredKeys.sort();

    onPropertiesChange(newProps, newRequiredKeys);
  };

  const handleDeleteProperty = (keyToDelete: string) => {
    const { [keyToDelete]: _, ...newProps } = properties;
    const newRequiredKeys = requiredKeys.filter((key) => key !== keyToDelete);
    onPropertiesChange(newProps, newRequiredKeys);
  };

  const handleAddProperty = () => {
    if (newKeyName.trim() && !properties[newKeyName.trim()]) {
      const key = newKeyName.trim();
      const newProps = {
        ...properties,
        [key]: { type: 'string', description: 'New property added via GUI.' },
      };
      // By default, assume new properties are optional (not in requiredKeys)
      onPropertiesChange(newProps, requiredKeys);
      setNewKeyName('');
    }
  };

  return (
    <Box sx={{ mt: 3, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
      <Typography variant="h5" className="font-bold mb-3">
        {title}
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <TextField
          label="Add New Property Key"
          variant="outlined"
          size="small"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddProperty()}
          fullWidth
        />
        <Button
          onClick={handleAddProperty}
          variant="contained"
          size="small"
          startIcon={<Add />}
          disabled={!newKeyName.trim() || !!properties[newKeyName.trim()]}
        />
      </Box>

      {Object.entries(properties).map(([key, prop]) => (
        <PropertyRow
          key={key}
          name={key}
          property={prop}
          required={requiredKeys.includes(key)}
          onUpdate={(newName, newProp, newRequired) =>
            handleUpdateProperty(key, newProp, newRequired)
          }
          onDelete={() => handleDeleteProperty(key)}
        />
      ))}

      {Object.keys(properties).length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          className="italic text-center py-4"
        >
          No properties defined for this object.
        </Typography>
      )}
    </Box>
  );
};

export default JsonSchemaGuiEditor;
