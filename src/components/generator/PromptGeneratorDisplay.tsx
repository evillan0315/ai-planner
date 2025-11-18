import React from 'react';
import { Box, Typography, Card, CardContent, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MonacoEditor from '@/components/editor/monaco/MonacoEditor';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';
import { useStore } from '@nanostores/react';
import { promptGeneratorStore } from './stores/promptGeneratorStore';
/**
 * SX prop definitions for consistent styling.
 */
const sectionTitleSx = {
  fontWeight: 'bold',
  color: 'primary.main',
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};
const cardSx = {
  marginBottom: 4,
  borderRadius: '12px',
  boxShadow: 'lg',
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
};
const monacoEditorSx = {
  flexGrow: 1, // Allow editor to grow and fill available vertical space
  minHeight: '200px', // Ensure a minimum visible height for the editor
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  overflow: 'hidden',
};
const markdownRendererSx = {
  py: 0, // Remove default vertical padding from MarkdownRenderer
  px: 0, // Remove default horizontal padding from MarkdownRenderer
  // Custom styles for MarkdownRenderer's output within this display component
  '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 2, mb: 1, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 },
  '& p': { mb: 1.5 },
  '& pre': { my: 1.5, p: 1.5, borderRadius: '6px' },
  '& code:not(pre > code)': { p: '2px 4px', borderRadius: '4px' },
};
/**
 * React component to display the generated LLM system prompt and JSON schema.
 */
const PromptGeneratorDisplay: React.FC = () => {
  const { output, isLoading, error } = useStore(promptGeneratorStore);
  if (isLoading) {
    return (
      <Box className="flex flex-grow items-center justify-center p-8">
        <Typography variant="h6" color="text.secondary">
          Generating prompt and schema...
        </Typography>
      </Box>
    );
  }
  if (!output) {
    return (
      <Box className="flex flex-grow items-center justify-center p-8">
        <Typography variant="h6" color="text.secondary">
          Generate a prompt to see the output here.
        </Typography>
      </Box>
    );
  }
  return (
    <Box className="flex flex-col space-y-6 flex-grow">
    
      <Card sx={cardSx}>
        <CardContent className="p-6">
          <Accordion defaultExpanded className="rounded-lg shadow-none border-none bg-transparent">
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="generated-prompt-content" id="generated-prompt-header">
              <Typography variant="h6" sx={sectionTitleSx}>Generated LLM System Prompt</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, py: 0 }}> {/* Remove padding to let MarkdownRenderer control it */}
              {output.generatedSystemPrompt ? (
                <MarkdownRenderer content={output.generatedSystemPrompt} sx={markdownRendererSx} />
              ) : (
                <Typography variant="body2" color="text.secondary">No system prompt generated.</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
      <Card sx={cardSx}>
        <CardContent className="p-6">
          <Accordion defaultExpanded className="rounded-lg shadow-none border-none bg-transparent">
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="generated-schema-content" id="generated-schema-header">
              <Typography variant="h6" sx={sectionTitleSx}>Expected JSON Schema Output</Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ px: 0, py: 0, display: 'flex', flexDirection: 'column', height: 'auto' }}>
              {output.generatedJsonSchema ? (
                <MonacoEditor
                  value={output.generatedJsonSchema}
                  onChange={() => {}}
                  language="json"
                  height={`300px`}
                  options={{ readOnly: true, minimap: { enabled: false }, wordWrap: 'on' }}
                  sx={monacoEditorSx}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">No JSON schema output generated.</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
      {error && (
        <Box className="mt-4">
          <Typography color="error">Error: {error}</Typography>
        </Box>
      )}
    </Box>
  );
};
export default PromptGeneratorDisplay;
