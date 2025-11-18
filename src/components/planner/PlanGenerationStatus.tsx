import React from 'react';
import { Box, Typography } from '@mui/material';
import Loading from '@/components/Loading';
import PlanDisplay from './PlanDisplay';
import type { IFileChange, IPlan } from './types';

interface PlanGenerationStatusProps {
  isLoading: boolean;
  plan: IPlan | null;
  onEditPlanMetadata: () => void;
  onEditFileChange: (changeIndex: number, fileChange: IFileChange) => void;
}

export const PlanGenerationStatus: React.FC<PlanGenerationStatusProps> = ({
  isLoading,
  plan,
  onEditPlanMetadata,
  onEditFileChange,
}) => {
  if (isLoading) {
    return (
      <Box className="flex-grow flex items-center justify-center">
        <Loading type="circular" message="Generating Plan..." />
      </Box>
    );
  } else if (plan) {
    return (
      <Box className="flex-grow overflow-y-auto pt-4">
        <PlanDisplay
          plan={plan}
          onEditPlanMetadata={onEditPlanMetadata}
          onEditFileChange={onEditFileChange}
        />
      </Box>
    );
  } else {
    return (
      <Box className="flex-grow flex items-center justify-center pt-4">
        <Typography variant="h6" color="text.secondary">
          Enter a prompt and click "Generate Plan" to begin.
        </Typography>
      </Box>
    );
  }
};
