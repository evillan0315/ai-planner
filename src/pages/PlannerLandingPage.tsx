import React from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import ListAltIcon from '@mui/icons-material/ListAlt'; // New icon for plan list

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
  color: 'secondary.main',
};

export const PlannerLandingPage: React.FC = () => {
  return (
    <Box className="flex flex-col items-center justify-center p-6 max-w-3xl mx-auto min-h-[calc(100vh-128px)]">
      <Paper sx={paperSx}>
        <Stack direction="column" alignItems="center" spacing={3}>
          <AddRoadIcon sx={iconSx} />
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            className="font-bold text-secondary-main"
          >
            AI Code Planner
          </Typography>
          <Typography variant="body1" className="text-text-secondary mb-4 max-w-xl">
            Empower your development workflow with intelligent code planning. Describe your desired
            code changes in natural language, and let our AI generate a structured plan of file
            modifications.
          </Typography>
          <Typography variant="body2" className="text-text-secondary mb-6">
            Review detailed plans including file additions, modifications, deletions, and refactors,
            then apply them directly to your local project with confidence.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', justifyContent: 'center' }}>
            <Button
              component={RouterLink}
              to="/planner-generator"
              variant="contained"
              color="secondary"
              size="large"
              className="py-3 px-8 text-lg font-bold"
              startIcon={<AddRoadIcon />} // Optional: Add icon to button
            >
              Start New Plan
            </Button>
            <Button
              component={RouterLink}
              to="/planner/list"
              variant="outlined"
              color="secondary"
              size="large"
              className="py-3 px-8 text-lg font-bold"
              startIcon={<ListAltIcon />} // Optional: Add icon to button
            >
              Browse Existing Plans
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
