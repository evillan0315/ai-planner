import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Box, Paper } from '@mui/material'; // Removed TextField
import { useStore } from '@nanostores/react';
import {
  plannerStore,
  setAdditionalInstructions,
  setExpectedOutputFormat,
} from '@/components/planner/stores/plannerStore';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import type { GlobalAction } from '@/components/ui/GlobalActionButton';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import MonacoEditor from '@/components/editor/monaco/MonacoEditor'; // Import MonacoEditor
import DynamicFormBuilder from '@/components/form/DynamicFormBuilder';
import SystemConfigForm from '@/components/planner/config/SystemConfigForm';

import {GEMINI_SYSTEM_CONFIG} from '../config';

// Path to the configuration file to load
const CONFIG_FILE_PATH = "/media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/planner/config/ai_system_instruction.yaml";
interface InstructionEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  type: 'ai' | 'expected';
}

// Style for Monaco Editor to ensure it grows and fills vertical space
const monacoEditorSx = {
  flexGrow: 1,
  height: '100%', // Explicitly set height to 100% to ensure Monaco Editor can calculate its dimensions
  minHeight: '200px', // Ensure a minimum height if the content is short
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  overflow: 'hidden', // Ensure content inside editor doesn't overflow
};

const InstructionEditorDrawer: React.FC<InstructionEditorDrawerProps> = ({
  open,
  onClose,
  type,
}) => {
  const store = useStore(plannerStore);
  const { additionalInstructions, expectedOutputFormat } = store;

  const [localValue, setLocalValue] = useState<string>('');

  useEffect(() => {
    if (open) { // Only update local state when the drawer is opened or type/store values change
      if (type === 'ai') {
        setLocalValue(additionalInstructions);
      } else {
        setLocalValue(expectedOutputFormat);
      }
    }
  }, [type, additionalInstructions, expectedOutputFormat, open]); 

  const handleSave = useCallback(() => {
    if (type === 'ai') {
      setAdditionalInstructions(localValue);
    } else {
      setExpectedOutputFormat(localValue);
    }
    onClose();
  }, [type, localValue, onClose]);

  const handleCancel = useCallback(() => {
    // Revert local changes if canceled
    if (type === 'ai') {
      setLocalValue(additionalInstructions);
    } else {
      setLocalValue(expectedOutputFormat);
    }
    onClose();
  }, [type, additionalInstructions, expectedOutputFormat, onClose]);

  const drawerTitle = type === 'ai' ? 'Edit AI Instructions' : 'Edit Expected Output Format';

  const monacoLanguage = useMemo(() => {
    return type === 'ai' ? 'markdown' : 'json';
  }, [type]);

  const drawerActions: GlobalAction[] = [
    {
      label: 'Cancel',
      action: handleCancel,
      icon: <ClearIcon />,
      color: 'inherit',
      variant: '',
    },
    {
      label: 'Save',
      action: handleSave,
      icon: <SaveIcon />,
      color: 'primary',
      variant: '',
      size: 'small'
    },
  ];

  return (
    <CustomDrawer
      open={open}
      onClose={handleCancel} // Use handleCancel for consistent behavior on close
      position="left"
      size="medium"
      title={drawerTitle}
      hasBackdrop={true}
      footerActionButton={drawerActions}
    >
      <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        <Box sx={monacoEditorSx}>
        <SystemConfigForm 
          schema={GEMINI_SYSTEM_CONFIG.schema} 
          initialData={GEMINI_SYSTEM_CONFIG.json}
          //onFormChange={handleCancel}
          level={0}
          />
        </Box>
        
      </Box>
    </CustomDrawer>
  );
};

export default InstructionEditorDrawer;
