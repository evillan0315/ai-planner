import React, { useMemo } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css'; // Import Swagger UI styles
import { Box, Typography } from '@mui/material';
import { ContentLayout } from '@/components/ui/layouts/ContentLayout'; // Assuming ContentLayout path
import SwaggerApiDocs from '@/components/swagger/SwaggerApiDocs';
import { GlobalAction } from '@/components/ui/GlobalActionButton'; // Import the type for GlobalAction
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import { useTheme } from '@mui/material/styles';

/**
 * Dummy OpenAPI specification URL for demonstration.
 * Replace this with the actual URL to your OpenAPI spec (JSON or YAML).
 */

const SwaggerUIPage: React.FC = () => {
  const theme = useTheme();

  // Define Header Content
  const headerContent = useMemo(
    () => (
      <Typography variant="h6" component="div">
        API Documentation (UI)
      </Typography>
    ),
    [],
  );

  // Define Right Actions
  const headerRightActions: GlobalAction[] = useMemo(
    () => [
      {
        id: 'refresh',
        label: 'Refresh Spec',
        icon: <RefreshIcon />,
        onClick: () => {
          alert('Refreshing API specification...');
          // Add logic to re-fetch the spec here
        },
        tooltip: 'Refresh the loaded OpenAPI specification',
      },
      {
        id: 'download',
        label: 'Download Spec',
        icon: <DownloadIcon />,
        onClick: () => {
          alert('Downloading API specification...');
          // Add logic to download the spec file
        },
        tooltip: 'Download the OpenAPI specification file',
      },
    ],
    [],
  );

  // Define Left Actions (Example)
  const headerLeftActions: GlobalAction[] = useMemo(
    () => [
      {
        id: 'spec-url',
        label: 'View Spec URL',
        icon: <LinkIcon />,
        onClick: () => {
          alert(`Current Spec URL: ${OPENAPI_SPEC_URL}`);
        },
        tooltip: 'View the source URL for the OpenAPI specification',
      },
    ],
    [],
  );

  // Define Footer Content
  const footerContent = useMemo(
    () => (
      <Typography variant="caption" color="textSecondary">
        Api Documentation
      </Typography>
    ),
    [],
  );

  // Custom CSS to style the Swagger UI container to match the theme/layout
  // Note: SwaggerUI creates its own internal scrolling, so we rely on the
  // contentWrapperSx to define the area for the main content.
  const swaggerUISx = {
    // Override the default background color of the Swagger UI to match the app's background
    // Target the main container element created by SwaggerUI
    '& .swagger-ui': {
      // Use the background color from your MUI theme
      backgroundColor: theme.palette.background.default,
      minHeight: '100%',
      color: 'text.primary !important',
    },
    // The main wrapper Box inside ContentLayout should handle 100% height,
    // and the SwaggerUI component inside should also fill that area.
    height: '100%',
    width: '100%',
    overflow: 'auto', // Important for Swagger UI to handle its internal scrolling
  };

  return (
    <ContentLayout
      headerContent={headerContent}
      headerLeftActions={headerLeftActions}
      headerRightActions={headerRightActions}
      footerContent={footerContent}
      // Apply padding/styling to the content wrapper if needed,
      // but for full-bleed Swagger UI, we often don't want padding here.
      contentWrapperSx={{ padding: 0 }}
    >
      <Box sx={swaggerUISx}>
        {/* The main Swagger UI component */}
        <SwaggerApiDocs />
      </Box>
    </ContentLayout>
  );
};

export default SwaggerUIPage;
