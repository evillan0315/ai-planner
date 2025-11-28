const PlanSectionAccordion: React.FC<PlanSectionAccordionProps> = ({
  title,
  children,
  defaultExpanded = false,
  titleIcon,
  className = '',
}) => {
  return (
    <Accordion
      //defaultExpanded={defaultExpanded}
      className={`rounded-xl shadow-lg border border-solid border-gray-700/20 bg-background-paper/80 backdrop-blur-md p-0 ${className}`}
    >
      <AccordionSummary
        className="p-0"
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${title.toLowerCase().replace(/\s/g, '-')}-content`}
        id={`${title.toLowerCase().replace(/\s/g, '-')}-header`}
      >
        <Typography variant="h6" sx={sectionTitleSx}>
          {titleIcon}
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails 
        className="p-0"
        sx={{ 
            maxHeight: '200px', // NEW: Set height to 200px
            overflowY: 'auto', // NEW: Ensure vertical scroll
            overflowX: 'hidden' // Optional: Prevent horizontal scroll unless content explicitly demands it
        }}
      >{children}</AccordionDetails>
    </Accordion>
  );
};
export default PlanSectionAccordion;