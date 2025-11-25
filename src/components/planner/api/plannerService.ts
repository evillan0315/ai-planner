// FilePath: src/api/plannerService.ts
// Title: plannerService - client wrapper for plan generation and plan operations
// Reason: Fix generatePlan to correctly call geminiService, extract text from Gemini response shapes, and return a single JSON string. Improve axios typing and error handling.

import axios from 'axios';
import { getAuthHeaders, API_BASE_URL } from '@/api/authService';
import { authStore } from '@/stores/authStore';
import type {
  IApplyPlanResult,
  IGeneratePlanResponse,
  ILlmInput,
  IPlan,
  IPaginatedPlansResponse,
} from '../types';
import { geminiService } from '@/api/geminiService';
import type { GenerateContentRequest, GenerateContentResponse, Content, Part } from '@/types/gemini';

function safeJsonParse<T = any>(text: string | undefined | null): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Try to extract the most-likely text payload from a Gemini/Vertex style response.
 * Handles several common shapes:
 * - { candidates: [{ content: { parts: [{ text }] } }] }
 * - { response: { candidates: [...] } }
 * - { output: [{ content: [{ parts: [{ text }] }] }] }
 * - fallback to `.text` or stringifying the object
 */
function extractTextFromGenerateResponse(resp: GenerateContentResponse | any): string | null {
  try {
    if (!resp) return null;

    // 1) candidates -> content.parts
    if (Array.isArray(resp.candidates) && resp.candidates.length > 0) {
      const texts: string[] = [];
      for (const cand of resp.candidates) {
        const content = cand?.content ?? cand;
        const parts = content?.parts ?? (Array.isArray(content) ? content : undefined);
        if (Array.isArray(parts)) {
          for (const p of parts) {
            if (typeof p?.text === 'string' && p.text) texts.push(p.text);
          }
        } else if (typeof content?.text === 'string' && content.text) {
          texts.push(content.text);
        }
      }
      if (texts.length) return texts.join('');
    }

    // 2) resp.response.candidates
    if (resp?.response?.candidates && Array.isArray(resp.response.candidates)) {
      const texts: string[] = [];
      for (const cand of resp.response.candidates) {
        const parts = cand?.content?.parts ?? cand?.content;
        if (Array.isArray(parts)) {
          for (const p of parts) {
            if (typeof p?.text === 'string' && p.text) texts.push(p.text);
          }
        } else if (typeof cand?.text === 'string' && cand.text) {
          texts.push(cand.text);
        }
      }
      if (texts.length) return texts.join('');
    }

    // 3) vertex-like output arrays
    if (Array.isArray(resp.output)) {
      const texts: string[] = [];
      for (const out of resp.output) {
        const contentArr = out?.content;
        if (Array.isArray(contentArr)) {
          for (const c of contentArr) {
            const parts = c?.parts;
            if (Array.isArray(parts)) {
              for (const p of parts) {
                if (typeof p?.text === 'string' && p.text) texts.push(p.text);
              }
            } else if (typeof c?.text === 'string' && c.text) {
              texts.push(c.text);
            }
          }
        }
      }
      if (texts.length) return texts.join('');
    }

    // 4) direct text field
    if (typeof resp?.text === 'string' && resp.text.trim()) return resp.text;

    return null;
  } catch {
    return null;
  }
}

export const plannerService = {
  /**
   * Calls Gemini generateContent and returns the extracted text (expected to be a single JSON object string).
   * Throws an error when generation fails or returned payload cannot be parsed into a useful string.
   */
  async generatePlan(llmInput: ILlmInput, prompt: string): Promise<string> {
    
    const inputPrompt: GenerateContentRequest = {
      model: 'gemini-2.5-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `
              ${llmInput.additionalInstructions || ''}\m
              The response MUST be a single JSON object that validates against the schema: \n

              ${llmInput.expectedOutputFormat} \n

              ${prompt  || ''}\m
              `,
            },
          ],
        }
      ],
    };

    try {
      const resp = await geminiService.generateContent(':generateContent', inputPrompt);

      // Try to extract text from common Gemini shapes
      const extracted = extractTextFromGenerateResponse(resp);
      if (extracted) {
        // Trim whitespace and return
        return extracted.trim();
      }

      // If the service returned as a string in unexpected property, try to coerce:
      if (typeof resp === 'string' && resp.trim()) return resp.trim();

      // as a last resort, attempt to find JSON inside the response by stringifying
      const asString = JSON.stringify(resp);
      if (asString && asString !== '{}') return asString;

      throw new Error('Received empty or unrecognized response from Gemini.');
    } catch (err: any) {
      // Normalize axios/ApiError shapes if present
      if (axios.isAxiosError(err) && err.response) {
        const body = err.response.data ?? err.response;
        const msg = typeof body === 'object' ? (body.message ?? JSON.stringify(body)) : String(body);
        throw new Error(`Failed to generate plan: ${msg}`);
      }

      // If geminiService throws an ApiError-like object
      if (err?.message) {
        throw new Error(`Failed to generate plan: ${err.message}`);
      }

      throw new Error(`Failed to generate plan: ${String(err)}`);
    }
  },

  async createPlan(plan: IPlan): Promise<IGeneratePlanResponse> {
    try {
      const response = await axios.post<IGeneratePlanResponse>(`${API_BASE_URL}/plan/create`, plan, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message ?? JSON.stringify(error.response.data) ?? 'Failed to create plan.');
      }
      throw new Error(error?.message ?? 'An unexpected error occurred during plan creation.');
    }
  },

  async getPlan(planId: string): Promise<{ plan: IPlan }> {
    try {
      const response = await axios.get<{ plan: IPlan }>(`${API_BASE_URL}/plan/${planId}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message ?? `Failed to fetch plan ${planId}.`);
      }
      throw new Error(`An unexpected error occurred while fetching plan ${planId}.`);
    }
  },

  /**
   * Fetches a paginated list of AI plans.
   */
  async getPaginatedPlans(page: number, pageSize: number): Promise<IPaginatedPlansResponse> {
    try {
      const response = await axios.get<IPaginatedPlansResponse>(
        `${API_BASE_URL}/planner/paginated?page=${encodeURIComponent(String(page))}&pageSize=${encodeURIComponent(String(pageSize))}`,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message ?? 'Failed to fetch paginated plans.');
      }
      throw new Error('An unexpected error occurred while fetching plans.');
    }
  },

  async applyPlan(plan: IPlan, projectRoot?: string): Promise<IApplyPlanResult> {
    try {
      const response = await axios.post<{ result: IApplyPlanResult }>(
        `${API_BASE_URL}/plan/apply`,
        { planId: plan.id, projectRoot },
        { headers: getAuthHeaders() },
      );
      return response.data.result;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message ?? 'Failed to apply plan.');
      }
      throw new Error('An unexpected error occurred during plan application.');
    }
  },

  async applyFileChange(planId: string, changeIndex: number, projectRoot?: string): Promise<IApplyPlanResult> {
    try {
      const response = await axios.post<{ result: IApplyPlanResult }>(
        `${API_BASE_URL}/plan/${planId}/apply-chunk/${changeIndex}`,
        { projectRoot },
        { headers: getAuthHeaders() },
      );
      return response.data.result;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message ?? 'Failed to apply single file change.');
      }
      throw new Error('An unexpected error occurred during single file change application.');
    }
  },

  async getProjectStructure(projectRoot?: string): Promise<string> {
    try {
      const qp = projectRoot ? `?projectRoot=${encodeURIComponent(projectRoot)}` : '';
      const response = await axios.get<string>(`${API_BASE_URL}/llm/project-structure${qp}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message ?? 'Failed to get project structure.');
      }
      throw new Error('An unexpected error occurred during getProjectStructure.');
    }
  },
};
