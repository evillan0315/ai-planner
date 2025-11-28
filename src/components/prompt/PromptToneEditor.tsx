import React, { useState, useEffect, useMemo } from 'react';
import { Box, Tooltip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import FloatingIconTextField from '@/components/ui/FloatingIconTextField';
import type { Tone } from './types';

export interface PromptToneEditorProps {
  initialText?: string;
  onTextRevised?: (text: string) => void;
  floatingActionGroupsByCorner?: any; // extend FloatingIconTextField actions
}

// Simulated tone adjustment
const fakeAIResponse = (text: string, tone: Tone) => {
  switch (tone) {
    case 'Kinky':
      return text.replace(/\byou\b/gi, 'you naughty thing').replace(/\bI\b/g, 'I can’t resist');
    case 'Playful':
      return text.replace(/\byou\b/gi, 'you silly goose').replace(/\bI\b/g, 'I happily');
    case 'Professional':
      return text.replace(/\blike\b/gi, 'prefer').replace(/\breally\b/gi, 'truly');
    default:
      return text;
  }
};

// Grammar / spelling fix
const spellAndGrammarFix = (text: string) =>
  text.replace(/\s+/g, ' ').replace(/([.!?])\s*(?=[A-Z])/g, '$1 ').replace(/\bi\b/g, 'I').trim();

// Generate highlighted output
const getColoredHighlight = (original: string, fixed: string, toned: string) => {
  const origWords = original.split(/\s+/);
  const fixedWords = fixed.split(/\s+/);
  const tonedWords = toned.split(/\s+/);

  return tonedWords.map((word, idx) => {
    const origWord = origWords[idx] || '';
    const fixedWord = fixedWords[idx] || '';

    if (word === fixedWord && fixedWord !== origWord) {
      return (
        <Tooltip key={idx} title="Grammar/Spelling fix" arrow>
          <span style={{ backgroundColor: '#a5d6a7', borderRadius: 3, padding: '0 2px' }}>{word} </span>
        </Tooltip>
      );
    }

    if (word !== fixedWord) {
      return (
        <Tooltip key={idx} title="Tone adjustment" arrow>
          <span style={{ backgroundColor: '#fff59d', borderRadius: 3, padding: '0 2px' }}>{word} </span>
        </Tooltip>
      );
    }

    return word + ' ';
  });
};

const PromptToneEditor: React.FC<PromptToneEditorProps> = ({
  initialText = '',
  onTextRevised,
  floatingActionGroupsByCorner,
}) => {
  const [input, setInput] = useState(initialText);
  const [tone, setTone] = useState<Tone>('Professional');
  const [output, setOutput] = useState('');
  const [fixed, setFixed] = useState('');

  useEffect(() => {
    const fixedText = spellAndGrammarFix(input);
    const tonedText = fakeAIResponse(fixedText, tone);
    setFixed(fixedText);
    setOutput(tonedText);
    onTextRevised?.(tonedText);
  }, [input, tone, onTextRevised]);

  const highlightedOutput = useMemo(() => getColoredHighlight(input, fixed, output), [input, fixed, output]);

  return (
    <Box position="relative" width="100%">
      <Box mb={1}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Tone</InputLabel>
          <Select
            value={tone}
            label="Tone"
            onChange={(e) => setTone(e.target.value as Tone)}
          >
            <MenuItem value="Professional">Professional</MenuItem>
            <MenuItem value="Playful">Playful</MenuItem>
            <MenuItem value="Kinky">Kinky</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <FloatingIconTextField
        label="Enter your prompt"
        multiline
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        floatingActionGroupsByCorner={floatingActionGroupsByCorner}
        InputProps={{
          //sx: { minHeight: 120, backgroundColor: '#fff' },
        }}
      />

      <Box
        sx={{
          mt: 1,
          p: 1,
          borderRadius: 1,
          minHeight: 80,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {highlightedOutput}
      </Box>
    </Box>
  );
};

export default PromptToneEditor;

