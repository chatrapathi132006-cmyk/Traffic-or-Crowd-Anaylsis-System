
export enum DensityLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum TrafficFlow {
  SMOOTH = 'Smooth',
  MODERATE = 'Moderate',
  CONGESTED = 'Congested',
  STALLED = 'Stalled'
}

export interface AnalysisResult {
  peopleCount: number;
  vehicleCount: number;
  density: DensityLevel;
  flow: TrafficFlow;
  riskScore: number; // 0-100
  summary: string;
  timestamp: number;
  prediction: string;
}

export interface Alert {
  id: string;
  timestamp: number;
  type: 'CONGESTION' | 'OVERCROWDING' | 'SAFETY_RISK';
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  zone: string;
}

export interface ZoneData {
  id: string;
  name: string;
  history: AnalysisResult[];
}
