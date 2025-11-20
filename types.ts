export enum Position {
  GK = 'Goalkeeper',
  CB = 'Center Back',
  LB = 'Left Back',
  RB = 'Right Back',
  CDM = 'Defensive Midfielder',
  CM = 'Center Midfielder',
  CAM = 'Attacking Midfielder',
  LW = 'Left Winger',
  RW = 'Right Winger',
  ST = 'Striker'
}

export interface Player {
  id: string;
  name: string;
  country: string;
  dob: string; // YYYY-MM-DD
  team: string;
  position: Position;
  marketValue: number; // In millions
  photoUrl?: string;
}

export interface ScoutingReport {
  playerId: string;
  system: string;
  fitScore: number; // 0-100
  summary: string;
  strengths: string[];
  weaknesses: string[];
  tacticalVerdict: string;
}

export interface Recommendation {
  playerId: string;
  matchScore: number; // 0-100
  reasoning: string;
  keyAttribute: string;
}

// For Gemini Response Schema
export interface AIAnalysisResponse {
  fitScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  tacticalVerdict: string;
}

export interface AIScoutingResponse {
  recommendations: Recommendation[];
}