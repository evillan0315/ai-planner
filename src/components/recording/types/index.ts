import { IBaseEntity } from "../../../../types";

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
