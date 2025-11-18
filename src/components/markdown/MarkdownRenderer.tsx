import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Typography, Link, List as MuiList, ListItem, useTheme, SxProps } from '@mui/material';

/**
 * Props for the MarkdownRenderer component.
 */
interface MarkdownRendererProps {
  /** The Markdown content to render. */
  content: string;
  /** Optional class name for the root Box. */
  className?: string;
  /** Optional Material UI sx prop for advanced styling of the root Box. */
  sx?: SxProps;
}

// ================================================
// Styled Components / SX Prop Definitions
// ================================================

const markdownContainerSx: SxProps = {
  // Default padding and responsive adjustments
  py: 2,
  px: { xs: 1, sm: 2, md: 3 },
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  // Styling for the root element of the Markdown content
  '& h1, & h2, & h3, & h4, & h5, & h6': { mb: 1, mt: 3, fontWeight: 600 },
  '& p': { mb: 1.5, lineHeight: 1.75 },
  '& a': { textDecoration: 'underline', '&:hover': { textDecoration: 'none' } },
  '& ul, & ol': { mb: 1.5, pl: 2 },
  '& li': { mb: 0.5 },
  '& blockquote': {
    borderLeft: (theme) => `4px solid ${theme.palette.divider}`,
    ml: 0,
    pl: 2,
    pr: 1,
    py: 0.5,
    my: 2,
    color: 'text.secondary',
  },
  '& hr': {
    borderColor: (theme) => theme.palette.divider,
    my: 3,
  },
  // Basic inline code styling
  '& code:not(pre > code)': {
    backgroundColor: (theme) => theme.palette.action.hover,
    borderRadius: '4px',
    p: '2px 6px',
    fontFamily: 'monospace',
    fontSize: '0.9em',
  },
  // Image styling
  '& img': {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
    boxShadow: (theme) => `0 4px 8px rgba(0, 0, 0, 0.1)${theme.palette.mode === 'dark' ? ' darken(black, 0.5)' : ''}`,
    my: 2,
  }
};

const codeBlockSx = (theme: ReturnType<typeof useTheme>): SxProps => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
  borderRadius: '8px',
  p: 2,
  my: 2,
  overflowX: 'auto', // Enable horizontal scrolling for long code lines
  fontFamily: 'monospace',
  fontSize: '0.9em',
  '& code': {
    display: 'block', // Ensures the code element respects padding and overflow
    color: theme.palette.text.primary,
    whiteSpace: 'pre-wrap', // Preserve whitespace and wrap text
    wordBreak: 'break-all', // Break long words if necessary
  },
});

/**
 * A React component to render Markdown content using `react-markdown`.
 * It provides a consistent look and feel with Material UI components and styling.
 * Supports GitHub Flavored Markdown (GFM) via `remark-gfm`.
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className, sx }) => {
  const theme = useTheme();

  return (
    <Box className={className} sx={{ ...markdownContainerSx, ...sx }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <Typography variant="h4" component="h1" {...props} />,
          h2: ({ node, ...props }) => <Typography variant="h5" component="h2" {...props} />,
          h3: ({ node, ...props }) => <Typography variant="h6" component="h3" {...props} />,
          h4: ({ node, ...props }) => <Typography variant="subtitle1" component="h4" {...props} />,
          h5: ({ node, ...props }) => <Typography variant="subtitle2" component="h5" {...props} />,
          h6: ({ node, ...props }) => <Typography variant="caption" component="h6" {...props} />,
          p: ({ node, ...props }) => <Typography variant="body1" component="p" {...props} />,
          a: ({ node, ...props }) => <Link color="primary" {...props} />,
          ul: ({ node, ...props }) => <MuiList disablePadding sx={{ listStyleType: 'disc', pl: 2 }} {...props} />,
          ol: ({ node, ...props }) => <MuiList disablePadding sx={{ listStyleType: 'decimal', pl: 2 }} {...props} />,
          li: ({ node, ...props }) => <ListItem disablePadding sx={{ display: 'list-item' }} {...props} />,
          // Code blocks: wrap `code` in a `pre` tag, styled as a Box
          pre: ({ children }) => (
            <Box sx={codeBlockSx(theme)}>
              <code className="block whitespace-pre-wrap">
                {Array.isArray(children) ? children.join('') : children}
              </code>
            </Box>
          ),
          // Inline code. Note: `code` component only receives string children, `pre > code` receives array.
          code: ({ inline, className, children, ...props }) => {
            // Ensure children are always a string for rendering inside <span> or directly
            const content = Array.isArray(children) ? children.join('') : children;
            if (inline) {
              return (
                <Typography
                  component="span"
                  sx={{
                    backgroundColor: (theme) => theme.palette.action.hover,
                    borderRadius: '4px',
                    p: '2px 6px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                  }}
                  {...props}
                >
                  {content}
                </Typography>
              );
            }
            // For block code, the `pre` component already handles the wrapping and styling.
            // We just render the raw children here, which will be the code string.
            return <>{content}</>; // Render children directly, `pre` will style the container
          },
          blockquote: ({ node, ...props }) => <Box component="blockquote" {...props} />,
          img: ({ node, ...props }) => <Box component="img" {...props} sx={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', my: 2 }} />,
          // Add other custom components as needed
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;
