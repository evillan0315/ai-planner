import React, { ReactNode } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  SxProps,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface PlanSectionAccordionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  titleIcon?: ReactNode;
  className?: string;
}

const sectionTitleSx: SxProps = {
  marginBottom: 0,
  color: 'primary.main',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

const PlanSectionAccordion: React.FC<PlanSectionAccordionProps> = ({
  title,
  children,
  defaultExpanded = false,
  titleIcon,
  className = '',
}) => {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      className={`rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md ${className}`}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${title.toLowerCase().replace(/\s/g, '-')}-content`}
        id={`${title.toLowerCase().replace(/\s/g, '-')}-header`}
      >
        <Typography variant="h6" sx={sectionTitleSx}>
          {titleIcon}
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};

export default PlanSectionAccordion;
