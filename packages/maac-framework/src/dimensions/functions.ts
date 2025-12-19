/**
 * MAAC Dimension Assessment Functions
 * 
 * Functional interface for assessing cognitive responses across all 9 MAAC dimensions.
 * These functions wrap the class-based assessors and add Zod schema validation
 * for consistent output structure.
 * 
 * @packageDocumentation
 * @module MAACFunctions
 */

import {
  CognitiveResponse,
  ExecutionMetadata,
  SuccessCriterion,
  Domain,
  Tier,
  ModelId,
} from '@maac/types';

import {
  MAACDimension,
  MAACScore,
  LLMProvider,
  AssessorConfig,
  AssessmentContext,
  DerivedMetrics,
} from './types';

import { CognitiveLoadAssessor } from './cognitive-load';
import { ToolExecutionAssessor } from './tool-execution';
import { ContentQualityAssessor } from './content-quality';
import { MemoryIntegrationAssessor } from './memory-integration';
import { ComplexityHandlingAssessor } from './complexity-handling';
import { HallucinationControlAssessor } from './hallucination-control';
import { KnowledgeTransferAssessor } from './knowledge-transfer';
import { ProcessingEfficiencyAssessor } from './processing-efficiency';
import { ConstructValidityAssessor } from './construct-validity';

import {
  CognitiveLoadOutputSchema,
  ToolExecutionOutputSchema,
  ContentQualityOutputSchema,
  MemoryIntegrationOutputSchema,
  ComplexityHandlingOutputSchema,
  HallucinationControlOutputSchema,
  KnowledgeTransferOutputSchema,
  ProcessingEfficiencyOutputSchema,
  ConstructValidityOutputSchema,
  calculateDimensionScore,
  calculateConfidence,
} from './schemas';

// ============================================================
// ASSESSMENT INPUT INTERFACE
// ============================================================

export interface AssessmentInput {
  response: CognitiveResponse;
  successCriteria: SuccessCriterion[];
  metadata: ExecutionMetadata;
  domain: Domain;
  tier: Tier;
  configId: string;
  modelId: ModelId;
  enabledTools: string[];
  expectedCalculations: string[];
  expectedInsights: string[];
  scenarioRequirements: string[];
  businessContext: string;
  dataElements?: string[];
}

export interface FunctionalMAACScore extends MAACScore {
  /** Formula used for calculation */
  formula: string;
  /** Whether the formula calculation was validated */
  formulaValidated: boolean;
  /** Component values extracted from response */
  components: Record<string, number>;
}

// ============================================================
// HELPER: BUILD ASSESSMENT CONTEXT
// ============================================================

function buildContext(input: AssessmentInput): AssessmentContext {
  return {
    responseText: input.response.content,
    wordCount: input.metadata.wordCount,
    processingTime: input.metadata.processingTime,
    cognitiveCyclesCount: input.metadata.cognitiveCyclesCount,
    memoryOperationsCount: input.metadata.memoryOperationsCount,
    toolsInvokedCount: input.metadata.toolsInvokedCount,
    toolsInvoked: input.metadata.toolsInvoked,
    configId: input.configId,
    modelId: input.modelId,
    domain: input.domain,
    tier: input.tier,
    enabledTools: input.enabledTools,
    memoryToolsEnabled: input.enabledTools.filter(t => t.includes('memory')),
    memoryStoreEnabled: input.enabledTools.includes('memoryStore'),
    successCriteria: input.successCriteria,
    expectedCalculations: input.expectedCalculations,
    expectedInsights: input.expectedInsights,
    scenarioRequirements: input.scenarioRequirements,
    businessContext: input.businessContext,
    dataElements: input.dataElements,
    successThresholds: {},
  };
}

// ============================================================
// DIMENSION 1: COGNITIVE LOAD
// ============================================================

/**
 * Assess Cognitive Load dimension
 * 
 * Measures: Information processing capacity, task comprehension,
 * problem decomposition effectiveness, working memory utilization.
 * 
 * Formula: cognitive_load = average of 6 component scores
 * - concepts_per_segment (Miller's 7±2 rule)
 * - primary_allocation (>60% to high-importance)
 * - information_density (appropriate for complexity)
 * - overload_indicators (absence of fragmentation)
 * - processing_efficiency (aligned with tier)
 * - resource_optimization (vs tool usage)
 * 
 * @param input - Assessment input with response and criteria
 * @param llm - LLM provider for assessment
 * @param config - Optional assessor configuration
 */
export async function assessCognitiveLoad(
  input: AssessmentInput,
  llm: LLMProvider,
  config?: Partial<AssessorConfig>
): Promise<FunctionalMAACScore> {
  const assessor = new CognitiveLoadAssessor(llm, config);
  const context = buildContext(input);
  const score = await assessor.assess(context);
  
  // Extract component scores for validation
  const componentScores = extractComponentScores(score);
  const { score: calculatedScore, isValid } = calculateDimensionScore(componentScores);
  
  // Validate formula
  const formulaValidated = Math.abs(calculatedScore - score.dimensionScore) < 0.5;
  if (!formulaValidated && config?.validateFormulas !== false) {
    console.warn(
      `[cognitive_load] Formula mismatch: calculated ${calculatedScore.toFixed(2)}, ` +
      `reported ${score.dimensionScore.toFixed(2)}`
    );
  }
  
  return {
    ...score,
    formula: 'cognitive_load = avg(concepts_per_segment, primary_allocation, information_density, overload_indicators, processing_efficiency, resource_optimization)',
    formulaValidated: formulaValidated && isValid,
    components: flattenComponents(componentScores),
  };
}

// ============================================================
// DIMENSION 2: TOOL EXECUTION
// ============================================================

/**
 * Assess Tool Execution dimension
 * 
 * Measures: Effective utilization of available tools,
 * proper configuration, integration of outputs.
 * 
 * Formula: tool_execution = average of 6 component scores
 * - tool_appropriateness
 * - execution_quality
 * - integration_rate
 * - efficiency_rate
 * - success_achievement_through_tools
 * - tool_optimization
 */
export async function assessToolExecution(
  input: AssessmentInput,
  llm: LLMProvider,
  config?: Partial<AssessorConfig>
): Promise<FunctionalMAACScore> {
  const assessor = new ToolExecutionAssessor(llm, config);
  const context = buildContext(input);
  const score = await assessor.assess(context);
  
  const componentScores = extractComponentScores(score);
  const { score: calculatedScore, isValid } = calculateDimensionScore(componentScores);
  const formulaValidated = Math.abs(calculatedScore - score.dimensionScore) < 0.5;
  
  return {
    ...score,
    formula: 'tool_execution = avg(tool_appropriateness, execution_quality, integration_rate, efficiency_rate, success_achievement, tool_optimization)',
    formulaValidated: formulaValidated && isValid,
    components: flattenComponents(componentScores),
  };
}

// ============================================================
// DIMENSION 3: CONTENT QUALITY
// ============================================================

/**
 * Assess Content Quality dimension
 * 
 * Measures: Accuracy, completeness, clarity, relevance,
 * structure, and actionability of response.
 */
export async function assessContentQuality(
  input: AssessmentInput,
  llm: LLMProvider,
  config?: Partial<AssessorConfig>
): Promise<FunctionalMAACScore> {
  const assessor = new ContentQualityAssessor(llm, config);
  const context = buildContext(input);
  const score = await assessor.assess(context);
  
  const componentScores = extractComponentScores(score);
  const { score: calculatedScore, isValid } = calculateDimensionScore(componentScores);
  const formulaValidated = Math.abs(calculatedScore - score.dimensionScore) < 0.5;
  
  return {
    ...score,
    formula: 'content_quality = avg(accuracy, completeness, clarity, relevance, structure, actionability)',
    formulaValidated: formulaValidated && isValid,
    components: flattenComponents(componentScores),
  };
}

// ============================================================
// DIMENSION 4: MEMORY INTEGRATION
// ============================================================

/**
 * Assess Memory Integration dimension
 * 
 * Measures: Context retention, reference accuracy,
 * synthesis quality, and adaptive recall.
 */
export async function assessMemoryIntegration(
  input: AssessmentInput,
  llm: LLMProvider,
  config?: Partial<AssessorConfig>
): Promise<FunctionalMAACScore> {
  const assessor = new MemoryIntegrationAssessor(llm, config);
  const context = buildContext(input);
  const score = await assessor.assess(context);
  
  const componentScores = extractComponentScores(score);
  const { score: calculatedScore, isValid } = calculateDimensionScore(componentScores);
  const formulaValidated = Math.abs(calculatedScore - score.dimensionScore) < 0.5;
  
  return {
    ...score,
    formula: 'memory_integration = avg(context_retention, reference_accuracy, synthesis_quality, continuity_score, memory_utilization, adaptive_recall)',
    formulaValidated: formulaValidated && isValid,
    components: flattenComponents(componentScores),
  };
}

// ============================================================
// DIMENSION 5: COMPLEXITY HANDLING
// ============================================================

/**
 * Assess Complexity Handling dimension
 * 
 * Measures: Problem decomposition, step sequencing,
 * dependency management, and integration quality.
 */
export async function assessComplexityHandling(
  input: AssessmentInput,
  llm: LLMProvider,
  config?: Partial<AssessorConfig>
): Promise<FunctionalMAACScore> {
  const assessor = new ComplexityHandlingAssessor(llm, config);
  const context = buildContext(input);
  const score = await assessor.assess(context);
  
  const componentScores = extractComponentScores(score);
  const { score: calculatedScore, isValid } = calculateDimensionScore(componentScores);
  const formulaValidated = Math.abs(calculatedScore - score.dimensionScore) < 0.5;
  
  return {
    ...score,
    formula: 'complexity_handling = avg(decomposition_quality, step_sequencing, dependency_management, abstraction_level, integration_quality, scalability_approach)',
    formulaValidated: formulaValidated && isValid,
    components: flattenComponents(componentScores),
  };
}

// ============================================================
// DIMENSION 6: HALLUCINATION CONTROL
// ============================================================

/**
 * Assess Hallucination Control dimension
 * 
 * Measures: Factual accuracy, source grounding,
 * claim hedging, consistency, and knowledge boundaries.
 */
export async function assessHallucinationControl(
  input: AssessmentInput,
  llm: LLMProvider,
  config?: Partial<AssessorConfig>
): Promise<FunctionalMAACScore> {
  const assessor = new HallucinationControlAssessor(llm, config);
  const context = buildContext(input);
  const score = await assessor.assess(context);
  
  const componentScores = extractComponentScores(score);
  const { score: calculatedScore, isValid } = calculateDimensionScore(componentScores);
  const formulaValidated = Math.abs(calculatedScore - score.dimensionScore) < 0.5;
  
  return {
    ...score,
    formula: 'hallucination_control = avg(factual_accuracy, source_grounding, claim_hedging, consistency_check, knowledge_boundaries, verification_signals)',
    formulaValidated: formulaValidated && isValid,
    components: flattenComponents(componentScores),
  };
}

// ============================================================
// DIMENSION 7: KNOWLEDGE TRANSFER
// ============================================================

/**
 * Assess Knowledge Transfer dimension
 * 
 * Measures: Domain application, cross-domain synthesis,
 * explanation quality, and contextual adaptation.
 */
export async function assessKnowledgeTransfer(
  input: AssessmentInput,
  llm: LLMProvider,
  config?: Partial<AssessorConfig>
): Promise<FunctionalMAACScore> {
  const assessor = new KnowledgeTransferAssessor(llm, config);
  const context = buildContext(input);
  const score = await assessor.assess(context);
  
  const componentScores = extractComponentScores(score);
  const { score: calculatedScore, isValid } = calculateDimensionScore(componentScores);
  const formulaValidated = Math.abs(calculatedScore - score.dimensionScore) < 0.5;
  
  return {
    ...score,
    formula: 'knowledge_transfer = avg(domain_application, cross_domain_synthesis, explanation_quality, generalization_ability, contextual_adaptation, transfer_efficiency)',
    formulaValidated: formulaValidated && isValid,
    components: flattenComponents(componentScores),
  };
}

// ============================================================
// DIMENSION 8: PROCESSING EFFICIENCY
// ============================================================

/**
 * Assess Processing Efficiency dimension
 * 
 * Measures: Response conciseness, computation efficiency,
 * resource utilization, and output density.
 */
export async function assessProcessingEfficiency(
  input: AssessmentInput,
  llm: LLMProvider,
  config?: Partial<AssessorConfig>
): Promise<FunctionalMAACScore> {
  const assessor = new ProcessingEfficiencyAssessor(llm, config);
  const context = buildContext(input);
  const score = await assessor.assess(context);
  
  const componentScores = extractComponentScores(score);
  const { score: calculatedScore, isValid } = calculateDimensionScore(componentScores);
  const formulaValidated = Math.abs(calculatedScore - score.dimensionScore) < 0.5;
  
  return {
    ...score,
    formula: 'processing_efficiency = avg(response_conciseness, computation_efficiency, resource_utilization, time_optimization, iteration_efficiency, output_density)',
    formulaValidated: formulaValidated && isValid,
    components: flattenComponents(componentScores),
  };
}

// ============================================================
// DIMENSION 9: CONSTRUCT VALIDITY
// ============================================================

/**
 * Assess Construct Validity dimension
 * 
 * Measures: Task alignment, criterion satisfaction,
 * methodology appropriateness, and practical applicability.
 */
export async function assessConstructValidity(
  input: AssessmentInput,
  llm: LLMProvider,
  config?: Partial<AssessorConfig>
): Promise<FunctionalMAACScore> {
  const assessor = new ConstructValidityAssessor(llm, config);
  const context = buildContext(input);
  const score = await assessor.assess(context);
  
  const componentScores = extractComponentScores(score);
  const { score: calculatedScore, isValid } = calculateDimensionScore(componentScores);
  const formulaValidated = Math.abs(calculatedScore - score.dimensionScore) < 0.5;
  
  return {
    ...score,
    formula: 'construct_validity = avg(task_alignment, criterion_satisfaction, methodology_appropriateness, output_format_compliance, stakeholder_relevance, practical_applicability)',
    formulaValidated: formulaValidated && isValid,
    components: flattenComponents(componentScores),
  };
}

// ============================================================
// ASSESS ALL DIMENSIONS
// ============================================================

/**
 * Assess all 9 MAAC dimensions
 * 
 * @param input - Assessment input
 * @param llm - LLM provider
 * @param config - Optional config
 * @param parallel - Run assessments in parallel (default: true)
 */
export async function assessAllDimensions(
  input: AssessmentInput,
  llm: LLMProvider,
  config?: Partial<AssessorConfig>,
  parallel: boolean = true
): Promise<Map<MAACDimension, FunctionalMAACScore>> {
  const results = new Map<MAACDimension, FunctionalMAACScore>();
  
  const assessFunctions = [
    { dimension: MAACDimension.COGNITIVE_LOAD, fn: assessCognitiveLoad },
    { dimension: MAACDimension.TOOL_EXECUTION, fn: assessToolExecution },
    { dimension: MAACDimension.CONTENT_QUALITY, fn: assessContentQuality },
    { dimension: MAACDimension.MEMORY_INTEGRATION, fn: assessMemoryIntegration },
    { dimension: MAACDimension.COMPLEXITY_HANDLING, fn: assessComplexityHandling },
    { dimension: MAACDimension.HALLUCINATION_CONTROL, fn: assessHallucinationControl },
    { dimension: MAACDimension.KNOWLEDGE_TRANSFER, fn: assessKnowledgeTransfer },
    { dimension: MAACDimension.PROCESSING_EFFICIENCY, fn: assessProcessingEfficiency },
    { dimension: MAACDimension.CONSTRUCT_VALIDITY, fn: assessConstructValidity },
  ];
  
  if (parallel) {
    const promises = assessFunctions.map(async ({ dimension, fn }) => {
      const score = await fn(input, llm, config);
      return { dimension, score };
    });
    
    const scores = await Promise.all(promises);
    scores.forEach(({ dimension, score }) => results.set(dimension, score));
  } else {
    for (const { dimension, fn } of assessFunctions) {
      const score = await fn(input, llm, config);
      results.set(dimension, score);
    }
  }
  
  return results;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function extractComponentScores(
  score: MAACScore
): Record<string, { score: number }> {
  const components: Record<string, { score: number }> = {};
  
  if (score.componentScores) {
    for (const [key, value] of Object.entries(score.componentScores)) {
      if (typeof value === 'object' && value !== null && 'score' in value) {
        components[key] = { score: (value as { score: number }).score };
      }
    }
  }
  
  return components;
}

function flattenComponents(
  componentScores: Record<string, { score: number }>
): Record<string, number> {
  const flat: Record<string, number> = {};
  
  for (const [key, value] of Object.entries(componentScores)) {
    flat[key] = value.score;
  }
  
  return flat;
}
