import React from 'react';
import type { GlobalAction } from '@/components/ui/GlobalActionButton';

interface PlanHeaderProps {
  headerContent: React.ReactNode;
  headerLeftActions?: GlobalAction[];
  headerRightActions?: GlobalAction[];
}

const PlanHeader: React.FC<PlanHeaderProps> = ({ headerContent }) => {
  return <div>{headerContent}</div>;
};

export default PlanHeader;

