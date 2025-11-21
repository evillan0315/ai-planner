export const setPlan = (planId: string | null, plan: IPlan | null) => {
  plannerStore.set({
    ...plannerStore.get(),
    currentPlanId: planId,
    plan: plan,
    isLoading: false,
    error: null, // Clear error on successful plan load/generation
    applyStatus: 'idle', // Ensure apply status is reset when a new plan is generated or loaded.
    applyError: null,
  });
};
