import React, { useRef } from 'react';
import { Box, SxProps } from '@mui/material';
import { Editor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useStore } from '@nanostores/react';
import { themeAtom } from '@/stores/themeStore';

// Define interfaces at the top
interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  theme?: 'light' | 'dark'; // Allow explicit theme override or use system theme
  options?: editor.IStandaloneEditorConstructionOptions;
  height?: string | number;
  width?: string | number;
  className?: string;
  sx?: SxProps; // Material UI sx prop for advanced styling
}

// Mapping application themes to Monaco Editor themes
const MONACO_THEME_MAP = {
  light: 'vs-light',
  dark: 'vs-dark',
};

/**
 * A reusable React component that wraps the Monaco Editor.
 * It automatically adapts to the application's global theme (light/dark)
 * and provides props for customization.
 */
const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'typescript',
  theme,
  options = {},
  height = '500px',
  width = '100%',
  className,
  sx,
}) => {
  // Get the current application theme from the nanostore
  const { theme: currentAppTheme } = useStore(themeAtom);

  // Determine Monaco theme: explicit prop takes precedence, otherwise use app theme
  const monacoTheme = theme
    ? MONACO_THEME_MAP[theme]
    : MONACO_THEME_MAP[currentAppTheme || 'light'];

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Callback when the editor mounts
  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    // Can expose the editor instance externally if advanced imperative control is needed.
  };

  // Default editor options, can be overridden by the options prop
  const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    readOnly: false, // Make it editable by default
    fontSize: 14,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true, // Automatically resize with parent container
    tabSize: 2,
    insertSpaces: true,
    // Further options can be added or overridden via the `options` prop
    ...options,
  };

  return (
    <Box className={className} sx={{ height, width, ...sx }}>
      <Editor
        height="100%" // Editor itself takes full height of its container Box
        width="100%" // Editor itself takes full width of its container Box
        language={language}
        theme={monacoTheme}
        value={value}
        options={defaultOptions}
        onChange={(newValue) => onChange(newValue || '')}
        onMount={handleEditorDidMount}
      />
    </Box>
  );
};

export default MonacoEditor;
