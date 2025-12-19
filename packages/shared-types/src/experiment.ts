export type Domain = 'analytical' | 'planning' | 'communication' | 'problem_solving';
export type Tier = 'simple' | 'moderate' | 'complex';
export type ModelId = 'deepseek_v3' | 'sonnet_37' | 'gpt_4o' | 'llama_maverick';

export interface ExperimentConfig {
  experimentId: string;
  name: string;
  description: string;

  // Scenario configuration
  domains: Domain[];
  tiers: Tier[];
  repetitionsPerDomainTier: number;

  // Model configuration
  models: ModelId[];

  // Tool configuration blocks
  toolConfigs: ToolConfigBlock[];

  // Execution settings
  parallelism: number; // How many trials to run concurrently
  timeout: number; // Milliseconds before trial fails
}

export interface ToolConfigBlock {
  configId: string;
  name: string;
  description: string;
  toolConfiguration: import('./cognitive').ToolConfiguration;
  scenarioCount: number;
}

export interface Scenario {
  scenarioId: string;
  experimentId: string;
  domain: Domain;
  tier: Tier;
  repetition: number;

  // Task definition
  taskTitle: string;
  taskDescription: string;
  businessContext: string;

  // Success criteria (BLIND - not given to LLM)
  successCriteria: SuccessCriterion[];
  expectedCalculations: string[];
  expectedInsights: string[];
  scenarioRequirements: string[];
  dataElements?: string[];

  // Configuration
  configId: string;
  modelId: ModelId;
}

export interface SuccessCriterion {
  criterion: string;
  weight: number;
  category: 'accuracy' | 'completeness' | 'reasoning' | 'efficiency';
}

export interface Trial {
  trialId: string;
  experimentId: string;
  scenarioId: string;
  configId: string;
  modelId: ModelId;

  // Execution
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;

  // Results
  cognitiveResponse?: import('./cognitive').CognitiveResponse;
  maacScores?: MAACAssessment;
}

export interface MAACAssessment {
  // 9 dimensional scores (1-5 Likert scale)
  cognitivLoad: number; // 1-5
  toolExecution: number;
  contentQuality: number;
  memoryIntegration: number;
  complexityHandling: number;
  hallucinationControl: number;
  knowledgeTransfer: number;
  processingEfficiency: number;
  constructValidity: number;

  // Metadata
  overallScore: number; // 1-5 (average of dimensional scores)
  confidence: number; // 0-1
  assessmentReasoning: string;
  dimensionReasonings: Record<string, string>;
}

// Legacy types for backward compatibility
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
