// Shared type definitions for MAAC Research Platform

export interface CognitiveEvaluation {
  id: string;
  timestamp: Date;
  metrics: Record<string, number>;
}

export interface LLMProvider {
  name: string;
  apiKey: string;
  baseUrl?: string;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  providers: LLMProvider[];
}
