import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  Grid,
  Button,
  IconButton,
  FormHelperText, // Import FormHelperText
  Paper
} from '@mui/material';
import { nanoid } from 'nanoid';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Delete';

// --- Type Definitions based on context/schema component usage ---

interface JsonSchemaProperty {
    type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
    title?: string;
    description?: string;
    default?: any;
    enum?: string[];
    format?: string;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    items?: JsonSchema | JsonSchemaProperty; 
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
    ['x-layout']?: string; // Custom layout hint
    ['x-classNames']?: string; // Custom class names hint
    ['x-multiline']?: boolean; // Custom flag for multiline string
}

interface JsonSchema {
    type?: 'object' | 'array' | string;
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
    items?: JsonSchema | JsonSchemaProperty;
    title?: string;
    description?: string;
    ['x-layout']?: string; // Custom layout hint
}

// Mock implementation for deepEqual since it wasn't provided in context files
const deepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
};

// --- Component Props ---

interface DynamicFormBuilderProps {
  schema: JsonSchema;
  initialData?: Record<string, any>;
  onFormChange?: (data: Record<string, any>) => void;
  level?: number;
}

const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  schema,
  initialData = {},
  onFormChange,
  level = 0,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  // Initialize formData based on schema defaults and initialData
  useEffect(() => {
    const initial: Record<string, any> = { ...initialData };
    let needsUpdate = false;

    if (schema.properties) {
      Object.keys(schema.properties).forEach((key) => {
        const prop = schema.properties![key];
        
        if (initial[key] === undefined || initial[key] === null) { 
          if (prop.default !== undefined && prop.default !== null) {
            initial[key] = prop.default;
            needsUpdate = true;
          } else if (prop.type === 'array' && prop.items) {
            initial[key] = []; // Initialize array of objects/primitives as empty array
            needsUpdate = true;
          } else if (prop.type === 'object') {
            initial[key] = {}; // Initialize object as empty object
            needsUpdate = true;
          } 
        }
        
        // Deep initialization for nested objects/arrays if they exist in initial data but need recursive structure setup
        if (initial[key] && prop.type === 'object' && typeof prop.properties === 'object' && typeof initial[key] === 'object') {
             // Recursively check nested properties presence/defaults if not already handled above
        }
      });
    }
    
    // Only update formData if the new initial state derived from schema/initialData is different from current formData
    if (!deepEqual(formData, initial)) {
        setFormData(initial);
    }
    
  }, [schema, initialData]); 


  // Notify parent on change
  useEffect(() => {
      onFormChange?.(formData);
  }, [formData, onFormChange]);

  const handleChange = useCallback(
    (key: string, value: any, itemIndex?: number) => {
      setFormData((prev) => {
        const newFormData = { ...prev };

        if (itemIndex !== undefined) {
          // Handling array item change
          const currentArray = Array.isArray(newFormData[key]) ? [...newFormData[key]] : [];
          
          // For arrays of objects, value is the updated object data from the recursive call
          if (typeof value === 'object' && value !== null && !Array.isArray(value) && currentArray[itemIndex] && typeof currentArray[itemIndex] === 'object') {
              // Merge in case nested structure carries state like '_id' not present in the form change payload
              currentArray[itemIndex] = { ...currentArray[itemIndex], ...value };
          } else {
              currentArray[itemIndex] = value; 
          }
          
          newFormData[key] = currentArray;
        } else {
          // Handling top-level or object property change
          newFormData[key] = value;
        }

        return newFormData;
      });
    },
    [],
  );

  const handleAddItemToArray = useCallback(
    (key: string, itemSchema: JsonSchema | JsonSchemaProperty) => {
      setFormData((prev) => {
        const currentArray = Array.isArray(prev[key]) ? [...prev[key]] : [];
        const newItem: Record<string, any> = { _id: nanoid() }; // Add a unique id for keying in React
        
        // Initialize new item with defaults if itemSchema looks like a property or schema definition
        if (itemSchema.type === 'object' && itemSchema.properties) {
            Object.keys(itemSchema.properties).forEach((propKey) => {
                const prop = itemSchema.properties![propKey];
                if (prop.default !== undefined) {
                    newItem[propKey] = prop.default;
                } else if (prop.type === 'array') {
                    newItem[propKey] = [];
                } else if (prop.type === 'object') {
                    newItem[propKey] = {};
                }
            });
        }
        
        currentArray.push(newItem);
        const newFormData = { ...prev, [key]: currentArray };
        return newFormData;
      });
    },
    [],
  );

  const handleRemoveItemFromArray = useCallback(
    (key: string, indexToRemove: number) => {
      setFormData((prev) => {
        const currentArray = Array.isArray(prev[key]) ? [...prev[key]] : [];
        const newArray = currentArray.filter(
          (_, index) => index !== indexToRemove,
        );
        const newFormData = { ...prev, [key]: newArray };
        return newFormData;
      });
    },
    [],
  );

  if (
    !schema ||
    (!schema.properties && schema.type !== 'array' && schema.type !== 'object')
  ) {
    return (
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{ fontStyle: 'italic', ml: level * 2 }}
      >
        {level === 0
          ? 'No schema properties to display a form, or schema is not an object/array root.'
          : 'No properties defined for this sub-schema.'}
      </Typography>
    );
  }

  // Helper to render a single field based on schema property definition
  const renderField = (key: string, prop: JsonSchemaProperty, fieldClassNames: string) => {
    const value = formData[key] ?? (prop.default !== undefined ? prop.default : null);
    const label = prop.title || key;
    const description = prop.description;
    // Note: schema.required applies to properties of the current schema level, not nested ones for simplicity here.
    const isRequired = Array.isArray((schema as JsonSchema).required) ? (schema as JsonSchema).required!.includes(key) : false;

    // Define common props for Material UI components, excluding `helperText` initially
    const muiCommonProps = {
      fullWidth: true,
      margin: 'normal' as const,
      required: isRequired,
    };

    switch (prop.type) {
      case 'string':
        if (prop.format === 'date') {
          return (
            <TextField
              key={key}
              label={label}
              type="date"
              value={value || ''}
              onChange={(e) => handleChange(key, e.target.value, undefined)}
              InputLabelProps={{ shrink: true }}
              helperText={description} // Explicitly add helperText for TextField
              {...muiCommonProps}
              className={fieldClassNames}
              sx={{ ml: level * 2 }}
            />
          );
        }
        if (prop.enum) {
          return (
            <FormControl key={key} {...muiCommonProps} className={fieldClassNames} sx={{ ml: level * 2 }}>
              <InputLabel id={`${key}-select-label`}>{label}</InputLabel>
              <Select
                labelId={`${key}-select-label`}
                id={`${key}-select`}
                value={value || ''}
                label={label}
                onChange={(e) => handleChange(key, e.target.value as string, undefined)}
              >
                {prop.enum.map((option: string) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              {description && <FormHelperText>{description}</FormHelperText>}
            </FormControl>
          );
        }
        // Check for x-multiline custom property
        if (prop['x-multiline']) {
          return (
            <TextField
              key={key}
              label={label}
              value={value || ''}
              onChange={(e) => handleChange(key, e.target.value, undefined)}
              helperText={description}
              multiline // Render as multiline textarea
              rows={4}   // Default number of rows
              {...muiCommonProps}
              className={fieldClassNames}
              sx={{ ml: level * 2 }}
            />
          );
        }
        return (
          <TextField
            key={key}
            label={label}
            value={value || ''}
            onChange={(e) => handleChange(key, e.target.value, undefined)}
            helperText={description} // Explicitly add helperText for TextField
            {...muiCommonProps}
            className={fieldClassNames}
            sx={{ ml: level * 2 }}
          />
        );
      case 'number':
      case 'integer':
        return (
          <TextField
            key={key}
            label={label}
            type="number"
            value={value === null || value === undefined ? '' : value}
            onChange={(e) => handleChange(key, Number(e.target.value), undefined)}
            helperText={description} // Explicitly add helperText for TextField
            {...muiCommonProps}
            className={fieldClassNames}
            sx={{ ml: level * 2 }}
          />
        );
      case 'boolean':
        return (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                checked={!!value} // Ensure boolean value
                onChange={(e) => handleChange(key, e.target.checked, undefined)}
                name={key}
              />
            }
            label={label}
            sx={{ mt: 2, mb: 1, ml: level * 2 }}
            className={fieldClassNames}
          />
        );
      case 'array':
        if (prop.items && typeof prop.items === 'object') {
          // Array of objects or complex types
          const currentArray = Array.isArray(formData[key])
            ? formData[key]
            : [];
          const itemSchema = prop.items as JsonSchemaProperty; // Assume single item schema definition
          
          // Get x-layout for individual array items, if defined in the item schema
          const itemLayoutClasses = (itemSchema as any)['x-layout'] || 'grid grid-cols-12 gap-2';

          return (
            <Box
              key={key}
              // Apply fieldClassNames to the container for the entire array field
              className={fieldClassNames}
              sx={{ 
                mt: 2, mb: 2, 
                borderLeft: 1, borderColor: 'divider', 
                ml: level * 2, 
                p: 1.5, 
                bgcolor: 'rgba(0, 0, 0, 0.03)' // Subtle background for array block
              }}
            >
              <Typography variant="subtitle2" gutterBottom className="mb-2">
                {label} (List)
              </Typography>
              {description && (
                <FormHelperText sx={{ ml: 0 }}>{description}</FormHelperText>
              )}
              
              {currentArray.map((item: Record<string, any>, index: number) => (
                <Box
                  key={item._id || index} // Use unique id if available, otherwise index
                  // Apply itemLayoutClasses to the individual item's container
                  className={itemLayoutClasses}
                  sx={{ 
                    mt: 1, mb: 1, 
                    p: 1.5, 
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    position: 'relative',
                    bgcolor: 'background.paper',
                  }}
                >
                  <IconButton
                    aria-label="remove item"
                    onClick={() => handleRemoveItemFromArray(key, index)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      zIndex: 1,
                    }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography
                    variant="caption"
                    sx={{ mb: 1, display: 'block' }}
                  >
                    Item {index + 1}
                  </Typography>
                  <DynamicFormBuilder
                    schema={itemSchema as JsonSchema}
                    initialData={item}
                    onFormChange={(nestedData) =>
                      handleChange(key, nestedData, index)
                    }
                    level={level + 1}
                  />
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleAddItemToArray(key, itemSchema)}
                sx={{ mt: 2, textTransform: 'none' }}
                variant="outlined"
                size="small"
              >
                Add {label} Item
              </Button>
            </Box>
          );
        } else {
          // Array of primitive types, handled as comma-separated string
          return (
            <TextField
              key={key}
              label={`${label} (comma-separated)`}
              value={Array.isArray(value) ? value.join(', ') : value || ''}
              onChange={(e) =>
                handleChange(
                  key,
                  e.target.value
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter((s: string) => s !== ''),
                  undefined
                )
              }
              helperText={description} // Explicitly add helperText for TextField
              {...muiCommonProps}
              className={fieldClassNames}
              sx={{ ml: level * 2 }}
            />
          );
        }
      case 'object':
        // The prop itself defines the schema for the nested object
        return (
          <Box
            key={key}
            // Apply fieldClassNames to the container for the entire object field
            className={fieldClassNames}
            sx={{
              mt: 2,
              mb: 2,
              pl: 2,
              borderLeft: 1,
              borderColor: 'divider',
              ml: level * 2,
            }}
          >
            <Typography variant="subtitle2" gutterBottom className="mb-2">
              {label}
            </Typography>
            {description && (
              <FormHelperText sx={{ ml: 0 }}>{description}</FormHelperText>
            )}
            <DynamicFormBuilder
              schema={prop as JsonSchema}
              initialData={formData[key] || {}}
              onFormChange={(nestedData) => handleChange(key, nestedData, undefined)}
              level={level + 1}
            />
          </Box>
        );
      default:
        return (
          <Typography
            key={key}
            variant="body2"
            color="error"
            className={fieldClassNames}
            sx={{ ml: level * 2 }}
          >
            Unsupported type for {label}: {prop.type}
          </Typography>
        );
    }
  };

  // Determine the root layout classes, defaulting if x-layout is not present
  const rootLayoutClasses = (schema as any)['x-layout'] || 'grid grid-cols-1 gap-4';

  // Prepare properties for sorting by x-order
  const sortedProperties = schema.properties
    ? Object.entries(schema.properties)
        .map(([key, prop]) => ({
          key,
          prop,
          order: (prop as any)['x-order'] ?? Infinity, // Assign Infinity if x-order is missing
          classNames: (prop as any)['x-classNames'] ?? '', // Capture x-classNames
        }))
        .sort((a, b) => a.order - b.order)
    : [];

  // Handle root being an array (which typically happens only if this component is recursively called on an array's 'items' schema)
  if (schema.type === 'array' && schema.items) {
      // If root is array, we render array controls wrapper here, otherwise we rely on renderField logic above.
      // Since this component is primarily designed for object schemas from config files, we treat array structure via renderField.
  }

  return (
  <Paper elevation={2} className="h-full max-w-2xl overflow-auto">
    <Box className={rootLayoutClasses}>
      {level === 0 && schema.title && (
        <Typography variant="h6" gutterBottom className="col-span-12">
          {schema.title}
        </Typography>
      )}
      {level === 0 && schema.description && (
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mb: 2 }}
          className="col-span-12"
        >
          {schema.description}
        </Typography>
      )}

      {sortedProperties.map(({ key, prop, classNames }) => (
        <React.Fragment key={key}>
          {renderField(key, prop, classNames)}
        </React.Fragment>
      ))}
    </Box>
   </Paper>
  );
};

export default DynamicFormBuilder;

