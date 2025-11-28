import React, { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import { useStore } from '@nanostores/react';
import { plannerStore } from '@/components/planner/stores/plannerStore';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import MonacoEditor from '@/components/editor/monaco/MonacoEditor';

interface InstructionPreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  type: 'ai' | 'expected';
}

// Style for Monaco Editor to ensure it fills available space
const monacoEditorSx = {
  flexGrow: 1,
  height: '100%',
  minHeight: '200px',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  overflow: 'hidden',
};

const InstructionPreviewDrawer: React.FC<InstructionPreviewDrawerProps> = ({
  open,
  onClose,
  type,
}) => {
  const store = useStore(plannerStore);
  const { additionalInstructions, expectedOutputFormat } = store;

  const content = useMemo(() => {
    return type === 'ai' ? additionalInstructions : expectedOutputFormat;
  }, [type, additionalInstructions, expectedOutputFormat]);

  const drawerTitle = type === 'ai' ? 'AI Instructions Preview' : 'Expected Output Preview';

  const monacoLanguage = useMemo(() => (type === 'ai' ? 'markdown' : 'json'), [type]);

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      position="left"
      size="medium"
      title={drawerTitle}
      hasBackdrop={true}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {type === 'ai'
            ? 'Preview of the AI instructions. Read-only view of the system prompt content.'
            : 'Preview of the expected output format or JSON schema. Read-only view.'}
        </Typography>
        <Box sx={monacoEditorSx}>
          <MonacoEditor
            value={content}
            language={monacoLanguage}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              wordWrap: 'on',
            }}
          />
        </Box>
      </Box>
    </CustomDrawer>
  );
};

export default InstructionPreviewDrawer;
