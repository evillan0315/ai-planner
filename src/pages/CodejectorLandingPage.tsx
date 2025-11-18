import React from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CodeIcon from '@mui/icons-material/Code';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

const paperSx = {
  p: 4,
  mb: 3,
  borderRadius: 3,
  boxShadow: 6,
  bgcolor: 'background.paper',
  textAlign: 'center',
};

const iconSx = {
  fontSize: 80,
  mb: 3,
  color: 'primary.main',
};

function CodejectorLandingPage() {
  return (
    <Box className="flex flex-col items-center justify-center p-6 max-w-3xl mx-auto min-h-[calc(100vh-128px)]">
      <Paper sx={paperSx}>
        <Stack direction="column" alignItems="center" spacing={3}>
          <CodeIcon sx={iconSx} />
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            className="font-bold text-primary-main"
          >
            Codejector Workspace
          </Typography>
          <Typography
            variant="body1"
            className="text-text-secondary mb-4 max-w-xl"
          >
            Access a dedicated, split-view workspace featuring a persistent file explorer and code editor for deep context integration and rapid file modification.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ width: '100%', justifyContent: 'center' }}
          >
            <Button
              component={RouterLink}
              to="/codejector/editor"
              variant="contained"
              color="primary"
              size="large"
              className="py-3 px-8 text-lg font-bold"
              startIcon={<FolderOpenIcon />}
            >
              Open Workspace
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

export default CodejectorLandingPage;
