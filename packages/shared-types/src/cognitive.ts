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
  execute(query: string, config: ToolConfiguration): Promise<CognitiveResponse>;
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

// ============================================================================
// MIMIC MANDATORY OUTPUT SCHEMA
// Extracted from n8n-workflow-analysis.md lines 245-288
// CRITICAL: Failure to include this structure will break the experimental pipeline
// ============================================================================

/**
 * Experiment metadata for tracking and analysis
 */
export interface ExperimentMetadata {
  trial_id: string;
  experiment_id: string;
  model_id: string;
  domain: 'analytical' | 'planning' | 'communication' | 'problem_solving';
  tier: 'simple' | 'moderate' | 'complex';
  config_id: string; // 12-character binary string e.g., "111111111111"
  scenario_number: number;
  maac_framework_version: string; // e.g., "nine_dimensional_v1.0"
}

/**
 * Goal progress tracking for cognitive processing
 */
export interface GoalProgressIndicator {
  goal_id: string;
  processing_stage: 'goal_setting' | 'planning' | 'validation' | 'execution';
  tools_applied: string[];
}

/**
 * Meta-tools execution status tracking
 */
export interface MetaToolsExecutionStatus {
  memory_query: 'completed' | 'failed' | 'not_used';
  evaluation_engine: 'completed' | 'failed' | 'not_used';
  reflection_engine: 'completed' | 'failed' | 'not_used';
  memory_store: 'completed' | 'failed' | 'not_used';
}

/**
 * Memory actions taken during processing
 */
export interface MemoryActions {
  stored_insights: string[];
  storage_trigger: 'automatic' | 'human_invoked';
}

/**
 * Processing metadata - MANDATORY for MIMIC responses
 * Documents the cognitive processing approach and tool usage
 */
export interface ProcessingMetadata {
  method: 'natural_reasoning' | 'selective_enhancement';
  complexity: 'simple' | 'moderate' | 'complex';
  enhancement_tools_invoked: string[];
  memory_tools_used: (
    | 'Context_Memory_Query'
    | 'Reflection_Memory_Query'
    | 'Evaluation_Memory_Query'
  )[];
  active_goals_tracked: string[]; // Mixed array of UUIDs and semantic descriptions
  goal_progress_indicators: GoalProgressIndicator[];
  meta_tools_execution_status: MetaToolsExecutionStatus;
  routing_sequence: string[];
  decision_reasoning: string;
  processing_sequence: string; // e.g., "memory query → natural reasoning → selective enhancements → mandatory meta-processing → final synthesis"
  memory_actions: MemoryActions;
}

/**
 * MANDATORY MIMIC Output Structure
 *
 * This is the exact JSON structure that MIMIC must always include in responses.
 * CRITICAL: Failure to include this will break the experimental pipeline.
 *
 * @see n8n-workflow-analysis.md lines 245-288
 */
export interface MIMICOutputSchema {
  sessionId: string;
  experiment_metadata: ExperimentMetadata;
  processing_metadata: ProcessingMetadata;
}

/**
 * Enhanced cognitive response that includes the MANDATORY MIMIC output
 */
export interface EnhancedCognitiveResponse extends CognitiveResponse {
  mimicOutput: MIMICOutputSchema;
}

export * from './index';
