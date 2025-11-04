import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AddRoadIcon from '@mui/icons-material/AddRoad';

const cardSx = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  p: 3,
  borderRadius: 3,
  boxShadow: 6,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: 10,
  },
};

export const HomePage: React.FC = () => {
  return (
    <Box className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-128px)]">
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        className="font-bold text-primary-main text-center mb-8"
      >
        Welcome to AI Planner
      </Typography>

      <Typography
        variant="h6"
        component="p"
        className="text-text-secondary text-center mb-10 max-w-2xl"
      >
        Explore powerful AI capabilities for intelligent code planning and modification.
      </Typography>

      <Box className="grid grid-cols-1 gap-8 w-full max-w-2xl"> {/* Simplified grid */}
        <Card sx={cardSx}> 
          <CardContent className="flex flex-col items-center text-center">
            <AddRoadIcon sx={{ fontSize: 60, mb: 2, color: 'secondary.dark' }} />
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              className="font-semibold text-text-primary"
            >
              AI Code Planner
            </Typography>
            <Typography variant="body1" className="text-text-secondary mb-4">
              Articulate desired code changes in natural language, receive a structured plan, and
              apply modifications directly to your local project.
            </Typography>
            <Button
              component={RouterLink}
              to="/planner"
              variant="contained"
              color="secondary"
              size="large"
              className="mt-auto py-3 px-6 text-lg font-bold"
            >
              Learn More & Plan Code
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
