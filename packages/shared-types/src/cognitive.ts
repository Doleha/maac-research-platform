// Cognitive evaluation types
export interface CognitiveEvaluation {
  id: string;
  timestamp: Date;
  metrics: Record<string, number>;
}

export interface CognitiveMetrics {
  coherence: number;
  relevance: number;
  factuality: number;
  reasoning: number;
}

export interface LLMProvider {
  name: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export * from './index';
