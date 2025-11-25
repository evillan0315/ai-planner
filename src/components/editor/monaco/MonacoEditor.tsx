import React, { useRef } from 'react';
import { Box, SxProps } from '@mui/material';
import { Editor } from '@monaco-editor/react';
import type { editor, Monaco } from 'monaco-editor';
import { useStore } from '@nanostores/react';
import { themeAtom } from '@/stores/themeStore';

// Define interfaces at the top
interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  theme?: 'light' | 'dark';
  options?: editor.IStandaloneEditorConstructionOptions;
  height?: string | number;
  width?: string | number;
  className?: string;
  sx?: SxProps;
  onSaveShortcut?: () => void;
  onCursorChange?: (line: number, column: number) => void;
  // NEW: Optional URL for tsconfig.json file
  tsConfigUrl?: string; 
}

// Mapping application themes to Monaco Editor themes
const MONACO_THEME_MAP = {
  light: 'vs-light',
  dark: 'vs-dark',
};

/**
 * A reusable React component that wraps the Monaco Editor.
 */
const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'typescript',
  theme,
  options = {},
  height = '100%',
  width = '100%',
  className,
  sx,
  onSaveShortcut, 
  onCursorChange,
  tsConfigUrl = '/media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/tsconfig.json', 
}) => {
  const { theme: currentAppTheme } = useStore(themeAtom);
  const monacoTheme = theme
    ? MONACO_THEME_MAP[theme]
    : MONACO_THEME_MAP[currentAppTheme || 'light'];

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Function to load and apply tsconfig.json
  const loadAndApplyTsConfig = async (monaco: Monaco) => {
    
    if (language !== 'typescript') return;
    const conf = {
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src"]
    }
  }
  
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(JSON.parse(conf));

    
  };


  const handleEditorDidMount =  (editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editorInstance;
    
    // --- NEW LOGIC: Load and apply tsconfig ---
    // Only run this if the language is relevant (typescript/javascript)
    if (language === 'typescript' || language === 'javascript') {
        console.log(language);
        loadAndApplyTsConfig(monaco);
    }

    // 1. Register CTRL+S/CMD+S shortcut
    if (onSaveShortcut) {
        editorInstance.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => {
                onSaveShortcut();
                return true;
            },
        );
    }
    
    // 2. Register Cursor Position Change Listener
    if (onCursorChange) {
        editorInstance.onDidChangeCursorPosition((e) => {
            onCursorChange(e.position.lineNumber, e.position.column);
        });
        
        const position = editorInstance.getPosition();
        if (position) {
            onCursorChange(position.lineNumber, position.column);
        }
    }
  };

  const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    readOnly: false,
    fontSize: 14,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    ...options,
  };

  return (
    <Box className={className} sx={{ height, width, ...sx }}>
      <Editor
        height="100%"
        width="100%"
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

