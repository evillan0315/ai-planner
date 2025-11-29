import axios from 'axios';
import { getAuthHeaders, API_BASE_URL } from '@/api/authService';
import {
  IRecording,
  CreateRecordingDto,
  UpdateRecordingStatusDto,
  IStartScreenRecordingDto,
  IScreenshotDto,
  IScreenshotResponseDto,
  ICameraRecordingResponseDto,
  IStartCameraRecordingDto,
} from '../types';

const API_ENDPOINT = `${API_BASE_URL}/recording`;

/**
 * Recording API Service
 * Handles communication with the backend for recording management operations.
 */
export const recordingApiService = {
  // --- Basic CRUD (Existing) ---
  async getAllRecordings(): Promise<IRecording[]> {
    const response = await axios.get<IRecording[]>(`${API_ENDPOINT}/paginated
`, { headers: getAuthHeaders() });
    return response.data;
  },

  async getRecordingById(id: string): Promise<IRecording> {
    const response = await axios.get<IRecording>(`${API_ENDPOINT}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  },

  async createRecording(dto: CreateRecordingDto): Promise<IRecording> {
    const response = await axios.post<IRecording>(API_ENDPOINT, dto, { headers: getAuthHeaders() });
    return response.data;
  },

  async updateRecordingStatus(id: string, dto: UpdateRecordingStatusDto): Promise<IRecording> {
    const response = await axios.patch<IRecording>(`${API_ENDPOINT}/${id}/status`, dto, { headers: getAuthHeaders() });
    return response.data;
  },

  async deleteRecording(id: string): Promise<void> {
    await axios.delete(`${API_ENDPOINT}/${id}`, { headers: getAuthHeaders() });
  },

  // --- Screen Recording & Screenshot ---

  /**
   * Starts a screen recording session.
   */
  async startScreenRecording(
    dto: IStartScreenRecordingDto,
  ): Promise<{ path: string; id: string }> {
    const response = await axios.post<{
      path: string;
      id: string;
    }>(`${API_ENDPOINT}/record-start`, dto, { headers: getAuthHeaders() });
    return response.data;
  },

  /**
   * Stops an active screen recording session.
   */
  async stopScreenRecording(id: string): Promise<{ id: string; status: string; path: string }> {
    const response = await axios.post(
      `${API_ENDPOINT}/record-stop?id=${id}`,
      {}, // No body required for stop via query param
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  /**
   * Captures a screenshot of the desktop.
   */
  async captureScreenshot(
    dto: IScreenshotDto,
  ): Promise<IScreenshotResponseDto> {
    const response = await axios.post<IScreenshotResponseDto>(
      `${API_ENDPOINT}/screenshot`,
      dto,
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  // --- Camera Recording ---

  /**
   * Starts a camera recording session.
   */
  async startCameraRecording(
    dto: IStartCameraRecordingDto,
  ): Promise<ICameraRecordingResponseDto> {
    const response = await axios.post<ICameraRecordingResponseDto>(
      `${API_ENDPOINT}/camera-record-start`,
      dto,
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  /**
   * Stops an active camera recording session.
   */
  async stopCameraRecording(id: string): Promise<ICameraRecordingResponseDto> {
    const response = await axios.post<ICameraRecordingResponseDto>(
      `${API_ENDPOINT}/camera-record-stop?id=${id}`,
      {}, // No body required for stop via query param
      { headers: getAuthHeaders() },
    );
    return response.data;
  },
};
