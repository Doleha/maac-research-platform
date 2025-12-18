/**
 * MAAC Dimension Types - Extracted from n8n Tier 1b Workflow
 * Multi-dimensional Assessment of A.I. Cognition
 * Version: 4.0
 */

import { CognitiveResponse, LLMProvider } from '@maac/types';
import { SuccessCriterion, Tier, Domain, ModelId } from '@maac/types/experiment';

// ============================================================
// MAAC DIMENSION IDENTIFIERS
// ============================================================

export type MAACDimension =
  | 'cognitive_load'
  | 'tool_execution'
  | 'content_quality'
  | 'memory_integration'
  | 'complexity_handling'
  | 'hallucination_control'
  | 'knowledge_transfer'
  | 'processing_efficiency'
  | 'construct_validity';

export const MAAC_DIMENSIONS: MAACDimension[] = [
  'cognitive_load',
  'tool_execution',
  'content_quality',
  'memory_integration',
  'complexity_handling',
  'hallucination_control',
  'knowledge_transfer',
  'processing_efficiency',
  'construct_validity',
];

// ============================================================
// ASSESSMENT INPUT CONTEXT
// ============================================================

export interface AssessmentContext {
  // Core response data
  responseText: string;
  wordCount: number;
  processingTime: number; // milliseconds

  // Cognitive metrics
  cognitiveCyclesCount: number;
  memoryOperationsCount: number;
  toolsInvokedCount: number;
  toolsInvoked: string[];

  // Configuration context
  configId: string;
  modelId: ModelId;
  domain: Domain;
  tier: Tier;

  // Tool configuration
  enabledTools: string[];
  memoryToolsEnabled: string[];
  memoryStoreEnabled: boolean;

  // Success criteria (blind to LLM during processing)
  successCriteria: SuccessCriterion[];
  expectedCalculations: string[];
  expectedInsights: string[];
  scenarioRequirements: string[];
  businessContext: string;
  dataElements?: string[];

  // Success thresholds per dimension
  successThresholds: Partial<Record<MAACDimension, number>>;

  // Processing metadata
  routingSequence?: string;
  processingMetadata?: Record<string, unknown>;
}

export interface DerivedMetrics {
  expectedInsightsCount: number;
  expectedCalculationsCount: number;
  successCriteriaCount: number;
  totalSuccessCriteria: number;

  // Complexity analysis
  problemComponents: string;
  complexityComponents: number;
  solutionStepsCount: number;

  // Hallucination metrics
  factualClaimsMade: number;
  verifiableStatements: number;
  baselineAccuracy: number;

  // Quality metrics
  qualityScore: number;
  successCriteriaAchieved: number;

  // Tool efficiency
  cognitiveCyclesWithTools: number;
  toolEnhancedProcessing: number;
  baselineProcessingCapability: number;
  complexityFactor: number;
}

// ============================================================
// COMPONENT SCORE OUTPUT
// ============================================================

export interface ComponentScore {
  score: number; // 1-5 Likert scale
  calculation: string; // Shows the formula used
  evidence: string; // Specific text evidence
  reasoning: string; // Why this score was assigned
  // Additional optional fields for specific dimensions
  [key: string]: unknown;
}

export interface MAACScore {
  dimension: MAACDimension;

  // Assessment context
  assessmentContext: {
    model: ModelId;
    configuration: string;
    complexity: Tier;
    processingTimeMs: number;
    validationStatus: 'complete' | 'partial' | 'error';
    missingVariables: string[];
    calculationNotes: string[];
  };

  // Component scores (6 per dimension)
  componentScores: Record<string, ComponentScore>;

  // Final scores
  dimensionScore: number; // 1-5, average of components
  confidence: number; // 0-1, bounded

  // Observations
  keyObservations: string[];

  // Statistical metadata for Tier 2 analysis
  statisticalMetadata: {
    statisticalSignificanceP: string;
    effectSizeCohenD: string;
    confidenceIntervalLower: string;
    confidenceIntervalUpper: string;
    sampleAdequacyScore: string;
    analysisRequired: string[];
    comparisonGroupId: string;
    experimentalCondition: 'control_baseline' | 'treatment_tools_enabled';
  };

  // Cognitive emergence indicators
  cognitiveEmergenceIndicators: Record<string, unknown>;

  // Processing metadata
  processingMetadata: {
    scenarioType: Domain;
    cognitiveArchitectureType: 'mimic';
    assessmentFramework: 'maac_nine_dimensional_v1.0';
    methodologyApproach: 'hybrid_classical_modern';
    dimensionMethod: string;
    dataSchemaVersion: '4.0';
    validationTimestamp: string;
    evaluationTimestamp: string;
  };

  // Readiness flags
  readinessFlags: {
    tier2ComparativeReady: boolean;
    architectureBaseline: 'tools_disabled' | 'tools_enabled';
    maacAssessmentCompleted: boolean;
    dimensionAssessmentComplete: boolean;
    dataValidationPassed: boolean;
    statisticalReady: boolean;
  };

  // Assessment criteria used
  assessmentCriteria: {
    successCriteria: string;
    successThresholds: string;
    expectedCalculations: string;
    scenarioRequirements: string;
    dataElements: string;
  };

  // Experimental design
  experimentalDesign: {
    group: 'control' | 'treatment';
    condition: 'tools_disabled' | 'tools_enabled' | 'memory_disabled' | 'memory_enabled';
    toolsAvailableCount: number;
    toolsUtilized: string[];
    memoryEnabled?: boolean;
    sessionId: string;
    trialId: string;
  };

  // Raw formula for validation
  formula?: string;
}

// ============================================================
// ASSESSOR INTERFACE
// ============================================================

export interface DimensionAssessor {
  dimension: MAACDimension;
  version: string;

  /**
   * Generate the assessment prompt with context
   */
  generatePrompt(context: AssessmentContext, derivedMetrics: DerivedMetrics): string;

  /**
   * Assess a cognitive response for this dimension
   */
  assess(context: AssessmentContext, llm: LLMProvider): Promise<MAACScore>;

  /**
   * Validate that a reported score matches the formula calculation
   */
  validateFormulaCalculation(components: Record<string, number>, reportedScore: number): number;
}

// ============================================================
// SCORING UTILITIES
// ============================================================

/**
 * Calculate dimension score from component scores
 * Formula: average of all component scores, rounded to nearest integer
 */
export function calculateDimensionScore(components: Record<string, ComponentScore>): number {
  const scores = Object.values(components).map((c) => c.score);
  if (scores.length === 0) return 0;
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(avg);
}

/**
 * Calculate confidence from component score standard deviation
 * Formula: 1 - (std_dev / sqrt(n)), bounded between 0 and 1
 */
export function calculateConfidence(components: Record<string, ComponentScore>): number {
  const scores = Object.values(components).map((c) => c.score);
  if (scores.length === 0) return 0;

  const n = scores.length;
  const mean = scores.reduce((sum, s) => sum + s, 0) / n;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const confidence = 1 - stdDev / Math.sqrt(n);
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Calculate derived metrics from assessment context
 */
export function calculateDerivedMetrics(context: AssessmentContext): DerivedMetrics {
  const expectedInsightsCount = context.expectedInsights?.length || 3;
  const expectedCalculationsCount = context.expectedCalculations?.length || 0;
  const successCriteriaCount = context.successCriteria?.length || 0;

  // Calculate problem components from scenario requirements
  const problemComponents = context.scenarioRequirements?.length >= 3 ? 'complex' : 'simple';

  // Calculate complexity components based on tier and tools
  const baseComplexity = context.tier === 'complex' ? 5 : context.tier === 'moderate' ? 3 : 2;
  const toolBonus = context.toolsInvokedCount > 0 ? 1 : 0;
  const complexityComponents = baseComplexity + toolBonus;

  // Calculate solution steps from word count and complexity
  const solutionStepsCount = Math.ceil(context.wordCount / 100) + complexityComponents;

  // Approximate factual claims from response text
  const sentences = context.responseText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const factualClaimsMade = Math.floor(sentences.length * 0.7);
  const verifiableStatements = Math.floor(factualClaimsMade * 0.6);

  // Baseline accuracy based on configuration
  const baselineAccuracy = context.configId === '000000000000' ? 0.75 : 0.85;

  // Quality score placeholder
  const qualityScore = 0.8;

  // Success criteria achieved (estimate 80%)
  const successCriteriaAchieved = Math.floor(successCriteriaCount * 0.8);

  // Tool efficiency metrics
  const cognitiveCyclesWithTools =
    context.toolsInvokedCount > 0 ? Math.floor(context.cognitiveCyclesCount * 0.7) : 0;

  const toolEnhancedProcessing =
    context.toolsInvokedCount > 0 ? context.processingTime * 0.8 : context.processingTime;

  const baselineProcessingCapability =
    context.configId === '000000000000' ? context.processingTime : context.processingTime * 1.2;

  // Complexity factor based on tier
  const complexityFactor =
    context.tier === 'complex' ? 2.0 : context.tier === 'moderate' ? 1.5 : 1.0;

  return {
    expectedInsightsCount,
    expectedCalculationsCount,
    successCriteriaCount,
    totalSuccessCriteria: successCriteriaCount,
    problemComponents,
    complexityComponents,
    solutionStepsCount,
    factualClaimsMade,
    verifiableStatements,
    baselineAccuracy,
    qualityScore,
    successCriteriaAchieved,
    cognitiveCyclesWithTools,
    toolEnhancedProcessing,
    baselineProcessingCapability,
    complexityFactor,
  };
}

// ============================================================
// MAAC SCORE JSON SCHEMA (for structured LLM output)
// ============================================================

export const MAACScoreSchema = {
  type: 'object',
  properties: {
    dimension: { type: 'string', enum: MAAC_DIMENSIONS },
    assessment_context: {
      type: 'object',
      properties: {
        model: { type: 'string' },
        configuration: { type: 'string' },
        complexity: { type: 'string' },
        processing_time_ms: { type: 'number' },
        validation_status: { type: 'string', enum: ['complete', 'partial', 'error'] },
        missing_variables: { type: 'array', items: { type: 'string' } },
        calculation_notes: { type: 'array', items: { type: 'string' } },
      },
      required: ['model', 'configuration', 'complexity', 'validation_status'],
    },
    component_scores: { type: 'object' },
    dimension_score: { type: 'number', minimum: 1, maximum: 5 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    key_observations: { type: 'array', items: { type: 'string' } },
    statistical_metadata: { type: 'object' },
    cognitive_emergence_indicators: { type: 'object' },
    processing_metadata: { type: 'object' },
    readiness_flags: { type: 'object' },
    assessment_criteria: { type: 'object' },
    experimental_design: { type: 'object' },
  },
  required: [
    'dimension',
    'assessment_context',
    'component_scores',
    'dimension_score',
    'confidence',
    'key_observations',
  ],
};
