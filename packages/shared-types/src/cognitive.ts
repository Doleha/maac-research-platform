/**
 * Core interface that all cognitive systems must implement
 * This allows MAAC to evaluate any AI system, not just MIMIC
 */
export interface CognitiveSystem {
  /**
   * Execute a cognitive task with given configuration
   * @param query - The task/question to process
   * @param config - Tool configuration for this execution
   * @returns Response with content and execution metadata
   */
  execute(
    query: string,
    config: ToolConfiguration
  ): Promise<CognitiveResponse>;
}

export interface ToolConfiguration {
  // Core capabilities
  memoryAccess: boolean;
  externalSearch: boolean;
  structuredReasoning: boolean;

  // Specific tools (for MIMIC)
  goalEngine?: boolean;
  planningEngine?: boolean;
  validationEngine?: boolean;
  clarificationEngine?: boolean;
  reflectionEngine?: boolean;
  evaluationEngine?: boolean;

  // Memory subsystems
  contextMemory?: boolean;
  reflectionMemory?: boolean;
  evaluationMemory?: boolean;
  memoryStore?: boolean;

  // Configuration ID for experiments
  configId: string; // e.g., "000000000000" for baseline
}

export interface CognitiveResponse {
  content: string;
  metadata: ExecutionMetadata;
}

export interface ExecutionMetadata {
  // Timing
  processingTime: number; // milliseconds
  startedAt: Date;
  completedAt: Date;

  // Cognitive metrics
  cognitiveCyclesCount: number;
  memoryOperationsCount: number;
  toolsInvokedCount: number;
  toolsInvoked: string[];

  // Processing details
  processingMethod: 'direct' | 'iterative' | 'reflective';
  complexityAssessment: 'simple' | 'moderate' | 'complex';

  // Model info
  modelId: string; // e.g., 'deepseek_v3'
  modelName: string;

  // Session tracking
  sessionId: string;
  trialId: string;

  // Additional context
  wordCount: number;
  responseText: string;
}

// Legacy types for backward compatibility
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
