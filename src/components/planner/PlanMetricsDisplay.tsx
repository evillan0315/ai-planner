import React from 'react';
import { Box, Card, CardContent, Typography, SxProps } from '@mui/material';

interface PlanMetricsDisplayProps {
  confidence?: number;
  estimatedEffortMinutes?: number;
}

const sectionTitleSx: SxProps = {
  marginBottom: 0,
  color: 'primary.main',
  fontWeight: 'bold',
};

const PlanMetricsDisplay: React.FC<PlanMetricsDisplayProps> = ({
  confidence,
  estimatedEffortMinutes,
}) => {
  const showMetrics =
    (confidence !== undefined && confidence !== null) ||
    (estimatedEffortMinutes !== undefined && estimatedEffortMinutes !== null);

  if (!showMetrics) {
    return null;
  }

  return (
    <Box className="flex space-x-2">
      {confidence !== undefined && confidence !== null && (
        <Card className="rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md flex-1">
          <CardContent>
            <Typography variant="h6" sx={sectionTitleSx} className="mb-0">
              Confidence
            </Typography>
            <Typography variant="body1" color="text.primary">
              {`${(confidence * 100).toFixed(0)}%`}
            </Typography>
          </CardContent>
        </Card>
      )}

      {estimatedEffortMinutes !== undefined && estimatedEffortMinutes !== null && (
        <Card className="rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md flex-1">
          <CardContent>
            <Typography variant="h6" sx={sectionTitleSx} className="mb-0">
              Estimated Effort
            </Typography>
            <Typography variant="body1" color="text.primary">
              {`${estimatedEffortMinutes} minutes`}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PlanMetricsDisplay;
