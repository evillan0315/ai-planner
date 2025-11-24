import React, { useMemo } from 'react';
import { Box, Typography, Alert, useTheme, SxProps } from '@mui/material';
import MonacoEditor from '@/components/editor/monaco/MonacoEditor';
import type { IPlan } from '@/components/planner/types';

// ---------------------------
// 1. Interfaces & Types
// ---------------------------

interface ErrorDetailsDrawerContentProps {
  plan: IPlan | null;
  /** The error string from the planner store (often containing stringified JSON error response). */
  error: string | null;
}

// ---------------------------
// 2. SX Prop Definitions
// ---------------------------

const containerSx: SxProps = {
  p: 2,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const monacoEditorSx: SxProps = {
  flexGrow: 1,
  height: '100%',
  minHeight: '200px',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  overflow: 'hidden',
};

// ---------------------------
// 3. Component Implementation
// ---------------------------

/**
 * Displays detailed error information or the raw plan data for debugging.
 * It prioritizes showing the error string (which may be stringified JSON from Axios/Backend)
 * and falls back to showing the entire IPlan object if an internal plan error exists.
 */
const ErrorDetailsDrawerContent: React.FC<ErrorDetailsDrawerContentProps> = ({ plan, error }) => {
  
  const editorContent = useMemo(() => {
    // Priority 1: Global error message (usually raw backend response stringified)
    if (error) {
      return error;
    }
    
    // Priority 2: Plan exists but contains an internal LLM generation error field
    if (plan && plan.error) {
      // Show the entire plan object for context if it failed internal validation
      return JSON.stringify(plan, null, 2);
    }
    
    // Fallback: If no error, show the current plan (if present)
    if (plan) {
        return JSON.stringify(plan, null, 2);
    }

    return 'No error details or plan data available.';
  }, [plan, error]);
  
  const isJsonContent = useMemo(() => {
      if (!editorContent) return false;
      // Simple check: Attempt to parse content if it starts with { or [ 
      // (This heuristic avoids parsing massive binary payloads that might be accidentally stringified)
      const trimmed = editorContent.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;

      try {
          JSON.parse(editorContent);
          return true;
      } catch {
          return false;
      }
  }, [editorContent]);
  
  const language = isJsonContent ? 'json' : 'text';
  const titleText = isJsonContent ? 'Raw Response JSON / Plan Data' : 'Raw Error Message';
  const severity = error ? 'error' : (plan && plan.error) ? 'warning' : 'info';


  return (
    <Box sx={containerSx}>
      <Alert severity={severity}>
        {error 
            ? 'A critical error occurred during communication or initial generation. See raw details below.' 
            : plan && plan.error 
            ? `LLM returned a plan structure but reported an internal error: ${plan.error}`
            : 'Displaying current plan object (no recent error).'
        }
      </Alert>

      <Typography variant="h6" className="font-semibold text-text-primary">
        {titleText}
      </Typography>
      
      <Box sx={monacoEditorSx}>
        <MonacoEditor
          value={editorContent}
          onChange={() => {}} // Read-only
          language={language}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            wordWrap: 'on',
          }}
        />
      </Box>
    </Box>
  );
};

export default ErrorDetailsDrawerContent;