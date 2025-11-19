import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import {
  plannerStore,
  loadPlanById,
  setCurrentPlanId,
  resetPlannerState,
} from '@/components/planner/stores/plannerStore';
import { isRightSidebarVisible, toggleRightSidebar } from '@/stores/uiStore';

/**
 * This page handles the routing logic for plan loading and ensures the right sidebar
 * (which contains the PlanGenerator component in Layout.tsx) is visible.
 * The main content area acts as a minimal coordinator/placeholder.
 */
function PlannerDedicatedPage() {
  const { planId } = useParams<{ planId?: string }>();
  const { currentPlanId: storedPlanId, plan } = useStore(plannerStore); 
  
  // UI state for sidebar control
  const rightVisible = useStore(isRightSidebarVisible);
  
  // --- Plan Loading and Reset Logic ---
  useEffect(() => {
    // 1. Handle Plan Loading/Reset based on URL
    if (planId) {
      if (planId !== storedPlanId || !plan || plan.id !== planId) {
        console.log(`Route: Loading plan with ID: ${planId}`);
        setCurrentPlanId(planId); 
        loadPlanById(planId); 
      } else {
        console.log(`Route: Plan ${planId} already loaded and matches URL.`);
      }
    } else if (!planId && storedPlanId) {
      // Navigating to /planner-generator without an ID
      console.log('Route: Navigated without ID, resetting planner state.');
      resetPlannerState();
    }
  }, [planId, storedPlanId, plan]); 
  
  // --- Sidebar Visibility Control ---
  useEffect(() => {
    // Ensure the right sidebar is visible when navigating to the dedicated planner route
    if (!rightVisible) {
      toggleRightSidebar();
    }
    
    // Note: We don't implement cleanup here to hide the sidebar, as the user might want to keep it open.
  }, [rightVisible]);


  return (
    <Box className="h-full w-full flex items-center justify-center p-8">
      <Typography variant="h6" color="text.secondary">
        {planId 
          ? `Loading Plan ${planId}... (UI is in the right sidebar)`
          : `AI Planner is active. Use the form in the right sidebar to generate a plan.`
        }
      </Typography>
    </Box>
  );
}

export default PlannerDedicatedPage;
