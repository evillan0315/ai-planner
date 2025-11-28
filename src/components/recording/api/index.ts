import axios from 'axios';
import { getAuthHeaders, API_BASE_URL } from '../../../api/authService';
import { IRecording, CreateRecordingDto, UpdateRecordingStatusDto } from '../types';

const API_ENDPOINT = `${API_BASE_URL}/recording`;

/**
 * Recording API Service
 * Handles communication with the backend for recording management operations.
 */
export const recordingApiService = {
  async getAllRecordings(): Promise<IRecording[]> {
    const response = await axios.get<IRecording[]>(API_ENDPOINT, { headers: getAuthHeaders() });
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
};
