// Title: promptService - client wrapper for text revision operations
// Reason: Provides a strongly-typed client for the /prompt/revise endpoint.

import axios from 'axios';
import { getAuthHeaders, API_BASE_URL } from '@/api/authService';

// --- DTOs (Data Transfer Objects) based on the NestJS Controller ---

/**
 * Request payload for the text revision API.
 */
export interface ReviseRequestDto {
  text: string;
  tone: string; // e.g., 'playful', 'professional', 'romantic', 'angry', 'chill', 'bold'
}

/**
 * Response payload containing the revised text.
 */
export interface ReviseResponseDto {
  revisedText: string;
}

// --- API Service ---

/**
 * Service for interacting with the Prompt/Revision related backend endpoints.
 */
export const promptService = {
  /**
   * Calls the backend to revise a piece of text for grammar, spelling, and tone.
   * @param payload The text and desired tone for revision.
   * @returns A promise resolving to the ReviseResponseDto containing the revised text.
   */
  async reviseText(payload: ReviseRequestDto): Promise<ReviseResponseDto> {
    console.log(payload, 'payload');
    try {
      const response = await axios.post<ReviseResponseDto>(
        // The endpoint should match the controller path: /prompt + /revise
        `${API_BASE_URL}/prompt/revise`,
        payload,
        { 
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        // Extract a meaningful error message from the backend response body
        const message = error.response.data?.message 
          ?? error.response.data?.error 
          ?? JSON.stringify(error.response.data);

        throw new Error(message || 'Failed to revise text.');
      }
      throw new Error(error?.message ?? 'An unexpected network error occurred during text revision.');
    }
  },
};
