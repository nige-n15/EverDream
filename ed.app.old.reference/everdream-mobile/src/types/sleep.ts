export type SleepSource = "wearable" | "manual";
export type SleepStage = "awake" | "light" | "deep" | "rem";

export interface SleepSession {
  id: string;
  userId: string;
  date: string;
  score: number; // 0-100
  remMinutes: number;
  deepMinutes: number;
  lightMinutes: number;
  awakeMinutes: number;
  totalSleepMinutes: number;
  source: SleepSource;
  wearableDevice?: string;
  rawData: Record<string, unknown>;
  createdAt: string;
}

export interface SleepStageData {
  stage: SleepStage;
  durationMinutes: number;
  startTime: string;
  endTime: string;
}

export interface SleepTrackingData {
  sessionId: string;
  stages: SleepStageData[];
  heartRate?: number[];
  movement?: number[];
  temperature?: number[];
}

export interface SleepIntent {
  id: string;
  userId: string;
  date: string;
  intent: string;
  tags?: string[];
  createdAt: string;
}