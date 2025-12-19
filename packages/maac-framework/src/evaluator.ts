/**
 * MAAC Evaluator - Core Assessment Engine
 *
 * Multi-dimensional AI Assessment and Cognition (MAAC) Framework
 *
 * This is the primary entry point for evaluating cognitive AI systems
 * across all 9 MAAC dimensions. Designed to work independently of any
 * specific cognitive architecture (MIMIC, etc.).
 *
 * @packageDocumentation
 * @module MAACEvaluator
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
  createAllAssessors,
  BaseAssessor,
} from './dimensions';

// ============================================================
// MAAC EVALUATOR CONFIGURATION
// ============================================================

export interface MAACEvaluatorConfig {
  /** Minimum confidence threshold to report score (0-1) */
  confidenceThreshold: number;

  /** Assess dimensions in parallel (faster) or sequentially (reasoning chain) */
  parallelAssessment: boolean;

  /** Include detailed reasoning chains in output */
  includeReasoningChains: boolean;

  /** Verify calculations match expected formulas */
  formulaValidation: boolean;

  /** Include extra metadata for statistical research */
  statisticalMode: boolean;

  /** LLM provider for dimension assessments */
  llmProvider: LLMProvider;

  /** Model identifier (e.g., 'claude-sonnet-4-5') */
  model: string;

  /** Assessor-specific configuration */
  assessorConfig?: Partial<AssessorConfig>;
}

// ============================================================
// MAAC ASSESSMENT OUTPUT
// ============================================================

export interface MAACAssessmentResult {
  // 9 Dimensional Scores (0-10 scale, normalized from 1-5)
  cognitiveLoad: number;
  toolExecution: number;
  contentQuality: number;
  memoryIntegration: number;
  complexityHandling: number;
  hallucinationControl: number;
  knowledgeTransfer: number;
  processingEfficiency: number;
  constructValidity: number;

  // Aggregate Metrics
  overallScore: number;
  confidence: number;

  // Assessment Reasoning
  assessmentReasoning: string;
  dimensionReasonings: {
    cognitiveLoad: string;
    toolExecution: string;
    contentQuality: string;
    memoryIntegration: string;
    complexityHandling: string;
    hallucinationControl: string;
    knowledgeTransfer: string;
    processingEfficiency: string;
    constructValidity: string;
  };

  // Detailed Scores (optional - when includeReasoningChains is true)
  detailedScores?: Map<MAACDimension, MAACScore>;

  // Statistical Metadata (optional - when statisticalMode is true)
  statisticalMetadata?: {
    assessmentTimestamp: Date;
    processingTimeMs: number;
    formulaValidationPassed: boolean;
    dimensionCompleteness: number;
    assessorVersion: string;
  };
}

// ============================================================
// SCENARIO CONTEXT (for evaluation)
// ============================================================

export interface ScenarioContext {
  domain: Domain;
  tier: Tier;
  configId: string;
  modelId: ModelId;

  // Task definition
  taskTitle: string;
  taskDescription: string;
  businessContext: string;

  // Success criteria (BLIND - not given to cognitive system)
  successCriteria: SuccessCriterion[];
  expectedCalculations: string[];
  expectedInsights: string[];
  scenarioRequirements: string[];
  dataElements?: string[];

  // Tool configuration
  enabledTools: string[];
  memoryToolsEnabled: string[];
}

// ============================================================
// MAAC EVALUATOR CLASS
// ============================================================

export class MAACEvaluator {
  private assessors: Map<MAACDimension, BaseAssessor>;
  private config: MAACEvaluatorConfig;

  constructor(config: MAACEvaluatorConfig) {
    this.config = config;

    // Initialize all 9 dimension assessors
    this.assessors = createAllAssessors(config.llmProvider, config.assessorConfig);
  }

  /**
   * Evaluate a cognitive system's response across all 9 MAAC dimensions
   *
   * @param response - The cognitive system's response to evaluate
   * @param scenario - Scenario context including success criteria
   * @param metadata - Execution metadata from cognitive system
   * @returns Complete 9-dimensional MAAC assessment
   *
   * @example
   * ```typescript
   * const evaluator = new MAACEvaluator({
   *   confidenceThreshold: 0.7,
   *   parallelAssessment: true,
   *   includeReasoningChains: true,
   *   formulaValidation: true,
   *   statisticalMode: true,
   *   llmProvider: anthropicProvider,
   *   model: 'claude-sonnet-4-5'
   * });
   *
   * const assessment = await evaluator.evaluate(
   *   cognitiveResponse,
   *   scenarioContext,
   *   executionMetadata
   * );
   *
   * console.log(`Overall Score: ${assessment.overallScore}/10`);
   * ```
   */
  async evaluate(
    response: CognitiveResponse,
    scenario: ScenarioContext,
    metadata: ExecutionMetadata,
  ): Promise<MAACAssessmentResult> {
    const startTime = Date.now();

    // Build assessment context from inputs
    const context = this.buildAssessmentContext(response, scenario, metadata);

    // Assess all 9 dimensions (derived metrics calculated internally by each assessor)
    const dimensionScores = await this.assessAllDimensions(context);

    // Normalize scores to 0-10 scale (from 1-5 Likert)
    const normalizedScores = this.normalizeScores(dimensionScores);

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore(normalizedScores);

    // Calculate aggregate confidence
    const confidence = this.calculateAggregateConfidence(dimensionScores);

    // Generate synthesis reasoning
    const assessmentReasoning = this.synthesizeReasoning(normalizedScores, dimensionScores);

    // Extract dimension reasonings
    const dimensionReasonings = this.extractDimensionReasonings(dimensionScores);

    // Build result
    const result: MAACAssessmentResult = {
      cognitiveLoad: normalizedScores.get(MAACDimension.COGNITIVE_LOAD) || 0,
      toolExecution: normalizedScores.get(MAACDimension.TOOL_EXECUTION) || 0,
      contentQuality: normalizedScores.get(MAACDimension.CONTENT_QUALITY) || 0,
      memoryIntegration: normalizedScores.get(MAACDimension.MEMORY_INTEGRATION) || 0,
      complexityHandling: normalizedScores.get(MAACDimension.COMPLEXITY_HANDLING) || 0,
      hallucinationControl: normalizedScores.get(MAACDimension.HALLUCINATION_CONTROL) || 0,
      knowledgeTransfer: normalizedScores.get(MAACDimension.KNOWLEDGE_TRANSFER) || 0,
      processingEfficiency: normalizedScores.get(MAACDimension.PROCESSING_EFFICIENCY) || 0,
      constructValidity: normalizedScores.get(MAACDimension.CONSTRUCT_VALIDITY) || 0,
      overallScore,
      confidence,
      assessmentReasoning,
      dimensionReasonings,
    };

    // Add detailed scores if requested
    if (this.config.includeReasoningChains) {
      result.detailedScores = dimensionScores;
    }

    // Add statistical metadata if in research mode
    if (this.config.statisticalMode) {
      result.statisticalMetadata = {
        assessmentTimestamp: new Date(),
        processingTimeMs: Date.now() - startTime,
        formulaValidationPassed: this.validateFormulas(dimensionScores),
        dimensionCompleteness: this.calculateCompleteness(dimensionScores),
        assessorVersion: '4.0.0',
      };
    }

    return result;
  }

  /**
   * Assess a single dimension (useful for targeted evaluation)
   */
  async assessDimension(
    dimension: MAACDimension,
    response: CognitiveResponse,
    scenario: ScenarioContext,
    metadata: ExecutionMetadata,
  ): Promise<MAACScore> {
    const assessor = this.assessors.get(dimension);
    if (!assessor) {
      throw new Error(`No assessor found for dimension: ${dimension}`);
    }

    const context = this.buildAssessmentContext(response, scenario, metadata);

    return assessor.assess(context);
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  private async assessAllDimensions(
    context: AssessmentContext,
  ): Promise<Map<MAACDimension, MAACScore>> {
    const scores = new Map<MAACDimension, MAACScore>();

    if (this.config.parallelAssessment) {
      // Assess all dimensions in parallel (faster, but more API calls at once)
      const assessmentPromises = Array.from(this.assessors.entries()).map(
        async ([dimension, assessor]) => {
          const score = await assessor.assess(context);
          return { dimension, score };
        },
      );

      const results = await Promise.all(assessmentPromises);
      results.forEach(({ dimension, score }) => {
        scores.set(dimension, score);
      });
    } else {
      // Assess sequentially (allows reasoning chain, cheaper)
      for (const [dimension, assessor] of this.assessors.entries()) {
        const score = await assessor.assess(context);
        scores.set(dimension, score);
      }
    }

    return scores;
  }

  private buildAssessmentContext(
    response: CognitiveResponse,
    scenario: ScenarioContext,
    metadata: ExecutionMetadata,
  ): AssessmentContext {
    return {
      // Core response data
      responseText: response.content,
      wordCount: metadata.wordCount,
      processingTime: metadata.processingTime,

      // Cognitive metrics
      cognitiveCyclesCount: metadata.cognitiveCyclesCount,
      memoryOperationsCount: metadata.memoryOperationsCount,
      toolsInvokedCount: metadata.toolsInvokedCount,
      toolsInvoked: metadata.toolsInvoked,

      // Configuration context
      configId: scenario.configId,
      modelId: scenario.modelId as ModelId,
      domain: scenario.domain,
      tier: scenario.tier,

      // Tool configuration
      enabledTools: scenario.enabledTools,
      memoryToolsEnabled: scenario.memoryToolsEnabled,
      memoryStoreEnabled: scenario.enabledTools.includes('memoryStore'),

      // Success criteria (blind to LLM during processing)
      successCriteria: scenario.successCriteria,
      expectedCalculations: scenario.expectedCalculations,
      expectedInsights: scenario.expectedInsights,
      scenarioRequirements: scenario.scenarioRequirements,
      businessContext: scenario.businessContext,
      dataElements: scenario.dataElements,

      // Success thresholds per dimension
      successThresholds: this.getDefaultThresholds(scenario.tier),

      // Processing metadata
      processingMetadata: {
        modelName: metadata.modelName,
        processingMethod: metadata.processingMethod,
        complexityAssessment: metadata.complexityAssessment,
      },
    };
  }

  /**
   * Calculate derived metrics for external use or analysis
   * Note: Assessors calculate these internally, this is for inspection
   */
  calculateDerivedMetrics(
    response: CognitiveResponse,
    scenario: ScenarioContext,
    metadata: ExecutionMetadata,
  ): DerivedMetrics {
    const text = response.content;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Count factual claims (sentences with numbers, percentages, or definitive statements)
    const factualClaims = sentences.filter(
      (s) => /\d+/.test(s) || /%/.test(s) || /\b(is|are|was|were|will be|has been)\b/.test(s),
    ).length;

    // Count verifiable statements
    const verifiableStatements = sentences.filter((s) =>
      /\b(according to|based on|research shows|data indicates|studies suggest)\b/i.test(s),
    ).length;

    // Estimate solution steps from structured indicators
    const solutionSteps = (text.match(/\b(step|first|second|third|finally|then|next)\b/gi) || [])
      .length;

    // Assess quality based on success criteria mentions
    const criteriaMatches = scenario.successCriteria.filter((c) =>
      text.toLowerCase().includes(c.criterion.toLowerCase().split(' ')[0]),
    ).length;

    const qualityScore = criteriaMatches / Math.max(scenario.successCriteria.length, 1);

    // Determine complexity factor based on tier
    const complexityFactor =
      {
        simple: 1.0,
        moderate: 1.5,
        complex: 2.0,
      }[scenario.tier] || 1.0;

    return {
      // Counts
      expectedInsightsCount: scenario.expectedInsights.length,
      expectedCalculationsCount: scenario.expectedCalculations.length,
      successCriteriaCount: scenario.successCriteria.length,
      totalSuccessCriteria: scenario.successCriteria.length,

      // Complexity analysis
      problemComponents: this.assessProblemComponents(scenario),
      complexityComponents: this.countComplexityComponents(scenario, metadata),
      solutionStepsCount: solutionSteps,

      // Hallucination metrics
      factualClaimsMade: factualClaims,
      verifiableStatements: verifiableStatements,
      baselineAccuracy: 0.75, // Conservative baseline

      // Quality metrics
      qualityScore: qualityScore,
      successCriteriaAchieved: criteriaMatches,

      // Tool efficiency
      cognitiveCyclesWithTools:
        metadata.toolsInvokedCount > 0 ? Math.floor(metadata.cognitiveCyclesCount * 0.7) : 0,
      toolEnhancedProcessing:
        metadata.toolsInvokedCount > 0 ? metadata.processingTime * 0.8 : metadata.processingTime,
      baselineProcessingCapability: 1.0,
      complexityFactor: complexityFactor,
    };
  }

  private assessProblemComponents(scenario: ScenarioContext): string {
    const components: string[] = [];

    if (scenario.expectedCalculations.length > 0) components.push('calculations');
    if (scenario.expectedInsights.length > 0) components.push('insights');
    if (scenario.scenarioRequirements.length > 0) components.push('requirements');
    if (scenario.dataElements && scenario.dataElements.length > 0) components.push('data_analysis');

    return components.join(', ') || 'general';
  }

  private countComplexityComponents(
    scenario: ScenarioContext,
    metadata: ExecutionMetadata,
  ): number {
    let count = 0;

    count += scenario.successCriteria.length;
    count += scenario.expectedCalculations.length;
    count += scenario.expectedInsights.length;
    count += scenario.scenarioRequirements.length;
    count += metadata.toolsInvokedCount > 0 ? 1 : 0;
    count += metadata.memoryOperationsCount > 0 ? 1 : 0;

    return count;
  }

  private getDefaultThresholds(tier: Tier): Partial<Record<MAACDimension, number>> {
    // Thresholds adjusted by tier complexity
    const baseThresholds: Record<MAACDimension, number> = {
      [MAACDimension.COGNITIVE_LOAD]: 3.5,
      [MAACDimension.TOOL_EXECUTION]: 3.0,
      [MAACDimension.CONTENT_QUALITY]: 3.5,
      [MAACDimension.MEMORY_INTEGRATION]: 3.0,
      [MAACDimension.COMPLEXITY_HANDLING]: 3.5,
      [MAACDimension.HALLUCINATION_CONTROL]: 4.0,
      [MAACDimension.KNOWLEDGE_TRANSFER]: 3.5,
      [MAACDimension.PROCESSING_EFFICIENCY]: 3.0,
      [MAACDimension.CONSTRUCT_VALIDITY]: 3.5,
    };

    // Adjust thresholds based on tier
    const multiplier =
      {
        simple: 0.9,
        moderate: 1.0,
        complex: 1.1,
      }[tier] || 1.0;

    const adjusted: Partial<Record<MAACDimension, number>> = {};
    for (const [dim, threshold] of Object.entries(baseThresholds)) {
      adjusted[dim as MAACDimension] = Math.min(threshold * multiplier, 5.0);
    }

    return adjusted;
  }

  private normalizeScores(scores: Map<MAACDimension, MAACScore>): Map<MAACDimension, number> {
    // Convert 1-5 Likert scale to 0-10 scale
    const normalized = new Map<MAACDimension, number>();

    for (const [dimension, score] of scores.entries()) {
      // Formula: (score - 1) / 4 * 10 = normalized 0-10
      const normalizedScore = ((score.dimensionScore - 1) / 4) * 10;
      normalized.set(dimension, Math.round(normalizedScore * 100) / 100);
    }

    return normalized;
  }

  private calculateOverallScore(scores: Map<MAACDimension, number>): number {
    // Equal weighting for all dimensions
    const values = Array.from(scores.values());
    if (values.length === 0) return 0;

    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 100) / 100;
  }

  private calculateAggregateConfidence(scores: Map<MAACDimension, MAACScore>): number {
    // Harmonic mean of confidences (conservative aggregation)
    const confidences = Array.from(scores.values()).map((s) => s.confidence);
    if (confidences.length === 0) return 0;

    // Filter out zero confidences to avoid division by zero
    const nonZero = confidences.filter((c) => c > 0);
    if (nonZero.length === 0) return 0;

    const reciprocalSum = nonZero.reduce((acc, c) => acc + 1 / c, 0);
    return Math.round((nonZero.length / reciprocalSum) * 100) / 100;
  }

  private synthesizeReasoning(
    normalizedScores: Map<MAACDimension, number>,
    detailedScores: Map<MAACDimension, MAACScore>,
  ): string {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const observations: string[] = [];

    const dimensionNames: Record<MAACDimension, string> = {
      [MAACDimension.COGNITIVE_LOAD]: 'Cognitive Load Management',
      [MAACDimension.TOOL_EXECUTION]: 'Tool Execution',
      [MAACDimension.CONTENT_QUALITY]: 'Content Quality',
      [MAACDimension.MEMORY_INTEGRATION]: 'Memory Integration',
      [MAACDimension.COMPLEXITY_HANDLING]: 'Complexity Handling',
      [MAACDimension.HALLUCINATION_CONTROL]: 'Hallucination Control',
      [MAACDimension.KNOWLEDGE_TRANSFER]: 'Knowledge Transfer',
      [MAACDimension.PROCESSING_EFFICIENCY]: 'Processing Efficiency',
      [MAACDimension.CONSTRUCT_VALIDITY]: 'Construct Validity',
    };

    for (const [dimension, score] of normalizedScores.entries()) {
      const name = dimensionNames[dimension];

      if (score >= 7.5) {
        strengths.push(name);
      } else if (score < 5.0) {
        weaknesses.push(name);
      }

      // Extract key observations
      const detailed = detailedScores.get(dimension);
      if (detailed && detailed.keyObservations.length > 0) {
        observations.push(...detailed.keyObservations.slice(0, 1));
      }
    }

    const overallScore = this.calculateOverallScore(normalizedScores);
    const performanceLevel = this.interpretScore(overallScore);

    return `MAAC Assessment Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Performance: ${performanceLevel} (${overallScore.toFixed(1)}/10)

Strengths: ${strengths.length > 0 ? strengths.join(', ') : 'None identified above threshold'}

Areas for Improvement: ${weaknesses.length > 0 ? weaknesses.join(', ') : 'None identified below threshold'}

Key Observations:
${observations.length > 0 ? observations.map((o) => `• ${o}`).join('\n') : '• Assessment completed successfully'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  private interpretScore(score: number): string {
    if (score >= 9.0) return 'Exceptional';
    if (score >= 8.0) return 'Excellent';
    if (score >= 7.0) return 'Good';
    if (score >= 6.0) return 'Satisfactory';
    if (score >= 5.0) return 'Adequate';
    if (score >= 4.0) return 'Below Expectations';
    return 'Needs Improvement';
  }

  private extractDimensionReasonings(
    scores: Map<MAACDimension, MAACScore>,
  ): MAACAssessmentResult['dimensionReasonings'] {
    const extractReasoning = (dimension: MAACDimension): string => {
      const score = scores.get(dimension);
      if (!score) return 'Assessment not completed';

      // Combine key observations into reasoning
      return (
        score.keyObservations.join('. ') ||
        `Dimension scored ${score.dimensionScore.toFixed(2)}/5 with ${(score.confidence * 100).toFixed(0)}% confidence.`
      );
    };

    return {
      cognitiveLoad: extractReasoning(MAACDimension.COGNITIVE_LOAD),
      toolExecution: extractReasoning(MAACDimension.TOOL_EXECUTION),
      contentQuality: extractReasoning(MAACDimension.CONTENT_QUALITY),
      memoryIntegration: extractReasoning(MAACDimension.MEMORY_INTEGRATION),
      complexityHandling: extractReasoning(MAACDimension.COMPLEXITY_HANDLING),
      hallucinationControl: extractReasoning(MAACDimension.HALLUCINATION_CONTROL),
      knowledgeTransfer: extractReasoning(MAACDimension.KNOWLEDGE_TRANSFER),
      processingEfficiency: extractReasoning(MAACDimension.PROCESSING_EFFICIENCY),
      constructValidity: extractReasoning(MAACDimension.CONSTRUCT_VALIDITY),
    };
  }

  private validateFormulas(scores: Map<MAACDimension, MAACScore>): boolean {
    if (!this.config.formulaValidation) return true;

    // Check that all dimensions passed their internal formula validation
    for (const score of scores.values()) {
      if (score.assessmentContext.validationStatus === 'error') {
        return false;
      }
    }

    return true;
  }

  private calculateCompleteness(scores: Map<MAACDimension, MAACScore>): number {
    const total = 9; // Total MAAC dimensions

    // Check for partial completions
    let partialCount = 0;
    for (const score of scores.values()) {
      if (score.assessmentContext.validationStatus === 'complete') {
        partialCount += 1;
      } else if (score.assessmentContext.validationStatus === 'partial') {
        partialCount += 0.5;
      }
    }

    return partialCount / total;
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

/**
 * Create a pre-configured MAACEvaluator for common use cases
 */
export function createMAACEvaluator(
  llmProvider: LLMProvider,
  options?: Partial<MAACEvaluatorConfig>,
): MAACEvaluator {
  const defaultConfig: MAACEvaluatorConfig = {
    confidenceThreshold: 0.7,
    parallelAssessment: true,
    includeReasoningChains: true,
    formulaValidation: true,
    statisticalMode: false,
    llmProvider,
    model: llmProvider.modelName || 'claude-sonnet-4-5',
  };

  return new MAACEvaluator({
    ...defaultConfig,
    ...options,
  });
}

/**
 * Create a research-focused MAACEvaluator with full statistical metadata
 */
export function createResearchMAACEvaluator(
  llmProvider: LLMProvider,
  options?: Partial<MAACEvaluatorConfig>,
): MAACEvaluator {
  return new MAACEvaluator({
    confidenceThreshold: 0.6,
    parallelAssessment: false, // Sequential for reasoning chains
    includeReasoningChains: true,
    formulaValidation: true,
    statisticalMode: true,
    llmProvider,
    model: llmProvider.modelName || 'claude-sonnet-4-5',
    assessorConfig: {
      validateFormulas: true,
      toleranceThreshold: 0.05,
      throwOnMismatch: false,
      enableCaching: true,
      debugMode: false,
    },
    ...options,
  });
}
