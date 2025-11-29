import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { Typography, Container, Box, useTheme, lighten, darken, Paper } from '@mui/material';
import { twMerge } from 'tailwind-merge';

// Define the API endpoint URL
const SWAGGER_URL = `${import.meta.env.VITE_BACKEND}/api-json`;

/**
 * Custom React component to display Swagger documentation.
 * Uses the React.FC type definition for TypeScript compatibility.
 */
const SwaggerApiDocs: React.FC = () => {
  const theme = useTheme();

  // Determine if the current theme mode is 'dark'
  const isDarkMode = theme.palette.mode === 'dark';

  // --- Theme Color Definitions ---
  // The desired text color for high-contrast on a dark background (usually white)
  const contrastTextColor = theme.palette.text.primary; // This should already be white/light grey in dark mode per your theme config
  // Use the secondary text color for less important elements
  const secondaryTextColor = theme.palette.text.secondary;

  // Helper function to adjust colors based on theme mode
  const backgroundColor = theme.palette.background.default;
  const dividerColor = theme.palette.divider;

  // Define lighter/darker shades of the main semantic colors for use as background
  const getOpBlockBg = (mainColor: string) =>
    isDarkMode ? darken(mainColor, 0.5) : lighten(mainColor, 0.4);

  // Define border colors for better contrast in opblocks
  const getOpBlockBorder = (mainColor: string) =>
    isDarkMode ? darken(mainColor, 0.9) : lighten(mainColor, 0.7);

  // Custom styles to integrate Swagger UI with MUI Theme
  const swaggerThemeSx = {
    // Target the main Swagger UI container
    '& .swagger-ui': {
      backgroundColor: theme.palette.background.default,
      fontFamily: theme.typography.fontFamily,

      // 1. Override general text color for the entire Swagger UI block
      // This is the most effective way to change most text
      color: contrastTextColor,

      // Topbar styling
      '& .swagger-ui .topbar': {
        //backgroundColor: theme.palette.background.paper, 
        borderBottom: `1px solid ${dividerColor}`,
        boxShadow: 'none',
        // Text inside topbar (like the version number)
        '& .link': {
          // 2. Ensure Topbar links are the primary contrast color
          color: contrastTextColor,
        },
      },
      // 3. General links and buttons (like Authorize, Explore, Try it out)
      '& .info, .scheme-container': {
        p: 0,
        m: 0,
        mb: 3,
      },
           
      // 4. Headers (API titles)
      '& .scheme-container, & h4, & h5, .description': {
        color: contrastTextColor, // Explicitly set headers to primary contrast color
      },
      '& .opblock-summary-path': {
        color: `${contrastTextColor} !important`,
        // backgroundColor: theme.palette.action.hover, 
      },
      // Operations (POST, GET, etc.) backgrounds and borders
      '& .opblock-tag-section': {
        borderBottom: `1px solid ${dividerColor}`,
        backgroundColor: theme.palette.action.hover,
      },

      // Opblock coloring using semantic palette colors
      '& .opblock.opblock-get': {
        backgroundColor: getOpBlockBg(theme.palette.info.dark),
        border: `1px solid ${getOpBlockBorder(theme.palette.info.main)}`,
        // 5. Ensure text inside opblocks uses contrast text color
        color: theme.palette.text.primary,
      },
      '& .opblock.opblock-post': {
        backgroundColor: getOpBlockBg(theme.palette.success.dark),
        border: `1px solid ${getOpBlockBorder(theme.palette.success.main)}`,
        color: theme.palette.text.primary,
      },
      '& .opblock.opblock-delete': {
        backgroundColor: getOpBlockBg(theme.palette.error.dark),
        border: `1px solid ${getOpBlockBorder(theme.palette.error.main)}`,
        color: theme.palette.text.primary,
      },
      '& .opblock.opblock-put': {
        backgroundColor: getOpBlockBg(theme.palette.primary.dark),
        border: `1px solid ${getOpBlockBorder(theme.palette.primary.main)}`,
        color: theme.palette.text.primary,
      },
      '& .opblock.opblock-patch': {
        backgroundColor: getOpBlockBg(theme.palette.warning.dark),
        border: `1px solid ${getOpBlockBorder(theme.palette.primary.main)}`,
        //color: theme.palette., 
      },
      // Model/Schema styling (Code blocks)
      '& .model-box, & .parameter__name, & code, & pre': {
        backgroundColor: theme.palette.action.hover,
        //color: contrastTextColor, // Explicitly set code text color
        //border: `1px solid ${dividerColor}`, 
      },

      // 6. Response samples (JSON/XML output descriptions)
      '& .response-col_description, & .response-col_links': {
        color: secondaryTextColor, // Use secondary text for descriptions
      },

      // 7. Status code styling
      '& .response > .response-col_status, .opblock .opblock-section-header h4, .opblock-description-wrapper p,  .response-col_status, table thead tr td,  table thead tr th': {
        color: contrastTextColor,
      },
      '& .opblock-tag, .opblock-title': {
        //background: `none !important`, 
        color: `${contrastTextColor} !important`,
      },
      '& .opblock .opblock-summary-description': {
        //background: `none !important`, 
        color: `${secondaryTextColor} !important`,
      },
      '& .scheme-container, .wrapper': {
        background: `none !important`,
        borderRadius: '0px',
      },
      '& .opblock-tag-section': {
        backgroundColor: `${getOpBlockBg(theme.palette.background.paper)}`,
        border: `1px solid ${dividerColor}`,
        borderRadius: '10px',
        //borderColor: 'divider',
        mb: 1,
        px: 2
      },
      '& .operation-tag-content': {
        borderRadius: '10px !important',
        //backgroundColor: `${theme.palette.background.paper}`,
        border: `0px !important`,
      },

      '& .opblock': {
        //backgroundColor: `${theme.palette.divider}`,
        //backgroundColor: `${getOpBlockBg(theme.palette.primary.main)}`,
        backgroundColor: `${getOpBlockBg(theme.palette.action.selected)} !important`,
        border: `0px !important`,
        color: `${contrastTextColor} !important`,
        //p: 2
      },
      '& .opblock .opblock-summary': {

        borderColor: `${getOpBlockBorder(theme.palette.action.hover)} !important`,
        //px:2,
        p: 1
      },
      '& .opblock-section-header': {
        backgroundColor: `${getOpBlockBg(theme.palette.action.hover)} !important`,
        borderBottom: `1px solid ${theme.palette.divider} !important`,
        color: contrastTextColor,
      },

      '& .opblock-control-arrow, .try-out > .btn, .tab li button.tablinks,  .response-control-media-type__accept-message': {
        color: `${contrastTextColor} !important`,
        //backgroundColor: `${getOpBlockBg(theme.palette.action.selected)} !important`,
        //borderColor: `${getOpBlockBg(theme.palette.primary.light)} !important`,
      },
      '& .operation-tag-content .opblock-tag-section,  input[disabled],  select[disabled], textarea[disabled],  .parameters-col_description input, .response-control-media-type--accept-controller select, select': {

        border: `1px solid ${dividerColor} !important`,
        backgroundColor: `${getOpBlockBg(theme.palette.action.selected)}`,

        color: contrastTextColor,
        //border: `1px solid ${dividerColor} !important`,
      },
      '& .responses-inner, .table-container': {
        p: 0,
        //border: `1px solid ${dividerColor} !important`,

      },
      '& .responses-inner .response-col_status, .parameters-col_name, .response-col_links': {
        py: 1,
        px: 2,
        minWidth: '50px'
      },
      '& table thead': {
        borderBottom: `1px solid ${dividerColor}`,
        backgroundColor: `${getOpBlockBg(theme.palette.action.selected)}`,
      },
      // 8. Overriding specific internal components that may inherit dark colors
      '& .operation-tag-content > h3 > span, .model-box, .parameter__name, pre, .parameter__type': {
        background: `transparent`,
        color: contrastTextColor,
      },
      '& .highlight-code > pre, textarea': {
        backgroundColor: `${getOpBlockBg(theme.palette.background.default)}`,
        border: `1px solid ${dividerColor} !important`,
        color: getOpBlockBg(contrastTextColor),
        my: 2,
      },
      '& code ': {
        background: `none !important`,
        color: getOpBlockBg(contrastTextColor),
        border: `0px !important`,
      },


    },
  };

  return (
    // Applied Paper component for background coloring consistency
    <Box 
      className= { twMerge('min-h-screen py-2', 'w-full mx-auto') }
  sx = {{
    bgcolor: theme.palette.background.default,
      borderColor: theme.palette.divider,
        color: contrastTextColor // Ensure the main container text is correct
  }
}
    >
  <Container maxWidth="100%" className = "!p-0" >


    {/* The main Swagger UI component with custom styling applied */ }
    <Box sx = {{ ...swaggerThemeSx }} className = "p-0 rounded-lg overflow-hidden" >
	  <SwaggerUI
	    url={ SWAGGER_URL }
	    // Configuration options for Swagger UI
	    docExpansion = "list"
	    deepLinking = { true}
	    defaultModelExpandDepth = { 1}
	    layout = "BaseLayout"
	  />
  </Box>

  < Box className = "mt-6 text-center text-sm" >
    {/* Use MUI color for better dark mode handling */ }
    < Typography variant = "caption" color = "secondary" >
      Specification served from: <code style={
        {
          backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.primary // Ensure code text is visible
        }
} className = "p-1 rounded" > { SWAGGER_URL } < /code>
  </Typography>
  </Box>
  </Container>
  </Box>
  );
};

export default SwaggerApiDocs;
