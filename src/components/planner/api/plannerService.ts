import axios from 'axios';
import { authStore } from '@/stores/authStore';
import type { IApplyPlanResult, IGeneratePlanResponse, ILlmInput, IPlan, IPaginatedPlansResponse } from '../types'; // Updated imports

const API_BASE_URL = `${import.meta.env.VITE_API_URL}` || '/api';

const getAuthHeaders = () => {
  const token = authStore.get().token; // Corrected from jwtToken to token
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const plannerService = {
  async generatePlan(llmInput: ILlmInput): Promise<IGeneratePlanResponse> {
    try {
      const response = await axios.post<IGeneratePlanResponse>(`${API_BASE_URL}/plan`, llmInput, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to generate plan.');
      }
      throw new Error('An unexpected error occurred during plan generation.');
    }
  },

  async getPlan(planId: string): Promise<{ plan: IPlan }> {
    // Updated return type
    try {
      const response = await axios.get<{ plan: IPlan }>(`${API_BASE_URL}/plan/${planId}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || `Failed to fetch plan ${planId}.`);
      }
      throw new Error(`An unexpected error occurred while fetching plan ${planId}.`);
    }
  },

  /**
   * Fetches a paginated list of AI plans.
   * @param page The page number to retrieve (1-indexed).
   * @param pageSize The number of items per page.
   * @returns A promise that resolves to an IPaginatedPlansResponse.
   */
  async getPaginatedPlans(page: number, pageSize: number): Promise<IPaginatedPlansResponse> {
    try {
      const response = await axios.get<IPaginatedPlansResponse>(
        `${API_BASE_URL}/planner/paginated?page=${page}&pageSize=${pageSize}`,
        {
          headers: getAuthHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch paginated plans.');
      }
      throw new Error('An unexpected error occurred while fetching plans.');
    }
  },

  async applyPlan(plan: IPlan, projectRoot?: string): Promise<IApplyPlanResult> {
    // Updated parameter type
    try {
      // Backend expects { planId: string, projectRoot?: string } in ApplyExistingPlanRequestDto
      const response = await axios.post<{ result: IApplyPlanResult }>(
        `${API_BASE_URL}/plan/apply`,
        { planId: plan.id, projectRoot }, // Corrected payload to match backend DTO
        { headers: getAuthHeaders() },
      );
      return response.data.result; // Backend returns { ok: true, result: ApplyPlanResult }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to apply plan.');
      }
      throw new Error('An unexpected error occurred during plan application.');
    }
  },

  /**
   * Applies a single file change from a plan.
   * Assumes backend has an endpoint to apply a change by its index.
   * @param planId The ID of the plan.
   * @param changeIndex The index of the specific change within the plan's changes array.
   * @param projectRoot Optional project root to override the server's default.
   * @returns A promise that resolves to an IApplyPlanResult.
   */
  async applyFileChange(
    planId: string,
    changeIndex: number,
    projectRoot?: string,
  ): Promise<IApplyPlanResult> {
    try {
      const response = await axios.post<{ result: IApplyPlanResult }>(
        `${API_BASE_URL}/plan/${planId}/apply-chunk/${changeIndex}`,
        { projectRoot }, // Backend expects only projectRoot in the body for apply-chunk
        { headers: getAuthHeaders() },
      );
      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to apply single file change.');
      }
      throw new Error('An unexpected error occurred during single file change application.');
    }
  },
};
