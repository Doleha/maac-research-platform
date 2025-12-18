// Experiment configuration types
export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  providers: Array<{
    name: string;
    apiKey: string;
    baseUrl?: string;
  }>;
  parameters?: Record<string, unknown>;
}

export interface ExperimentRun {
  id: string;
  configId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  results?: unknown;
}

export interface ExperimentResult {
  runId: string;
  data: Record<string, unknown>;
  metrics: Record<string, number>;
  timestamp: Date;
}

export * from './index';
