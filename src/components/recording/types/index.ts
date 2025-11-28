import { IBaseEntity } from "../../../types";

// --- Existing Types ---
export interface IRecording extends IBaseEntity {
  id: string;
  startTime: Date;
  endTime?: Date;
  durationMs: number;
  status: 'PENDING' | 'RECORDING' | 'COMPLETED' | 'FAILED';
  metadata: Record<string, any>;
}

export interface CreateRecordingDto {
  startTime: Date;
  metadata?: Record<string, any>;
}

export interface UpdateRecordingStatusDto {
  status: 'PENDING' | 'RECORDING' | 'COMPLETED' | 'FAILED';
}

// --- New Types inferred from Backend DTOs/Responses ---

// Corresponds to StartRecordingDto in backend
export interface IStartScreenRecordingDto {
  name?: string;
  enableAudio?: boolean;
  audioDevice?: string;
}

// Corresponds to ScreenshotDto in backend
export interface IScreenshotDto {
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

// Corresponds to ScreenshotResponseDto in backend
export interface IScreenshotResponseDto {
  id: string;
  path: string;
  message: string;
}

// Corresponds to StartCameraRecordingDto in backend
export interface IStartCameraRecordingDto {
  cameraDevice: string;
  resolution?: string;
  fps?: number;
  audioDevice?: string;
  duration?: number; // Duration in seconds, defaults handled on backend
}

// Corresponds to CameraRecordingResponseDto in backend
export interface ICameraRecordingResponseDto {
  id: string;
  path: string;
  message: string;
  pid?: string;
}