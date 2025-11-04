import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import PlanGenerator from '@/components/planner/PlanGenerator';
import { useParams } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { plannerStore, loadPlanById, setCurrentPlanId, resetPlannerState } from '@/components/planner/stores/plannerStore';

export const PlannerPage: React.FC = () => {
  const { planId } = useParams<{ planId?: string }>();
  const { currentPlanId: storedPlanId, plan } = useStore(plannerStore); // Destructure plan from store

  useEffect(() => {
    if (planId) {
      // If a planId is in the URL, check if it's already loaded or needs to be loaded/reloaded.
      // We only load if the ID from the URL is different from the one in the store,
      // or if there's no plan object in the store, or if the plan's ID doesn't match.
      if (planId !== storedPlanId || !plan || plan.id !== planId) {
        console.log(`Loading plan with ID: ${planId}`);
        setCurrentPlanId(planId); // Set the currentPlanId in the store immediately
        loadPlanById(planId); // Then trigger the fetch
      } else {
        console.log(`Plan ${planId} already loaded and matches URL.`);
        // No action needed, plan is already correctly in state
      }
    } else if (!planId && storedPlanId) {
      // If navigating to /planner-generator without an ID, but a plan was previously loaded,
      // reset the state to ensure a fresh generation experience.
      console.log('Navigated to plan generator without ID, resetting planner state.');
      resetPlannerState();
    }
  }, [planId, storedPlanId, plan]); // Add 'plan' to dependency array to react to plan object changes

  return (
    <Box className="h-full w-full max-w-7xl mx-auto overflow-hidden">
      <PlanGenerator />
    </Box>
  );
};
