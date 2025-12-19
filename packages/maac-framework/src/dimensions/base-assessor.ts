/**
 * Base Dimension Assessor - Abstract class for MAAC dimension assessment
 * Provides common functionality for all 9 dimension assessors
 */

import {
  MAACDimension,
  AssessmentContext,
  DerivedMetrics,
  MAACScore,
  ComponentScore,
  DimensionAssessor,
  LLMProvider,
  AssessorConfig,
  calculateDimensionScore,
  calculateConfidence,
  calculateDerivedMetrics,
  MAACScoreSchema,
} from './types';

export class BaseAssessor implements DimensionAssessor {
  readonly dimension: MAACDimension;
  readonly version: string = '4.0';
  readonly methodName: string = 'base_assessor';

  protected readonly llmProvider: LLMProvider;
  protected readonly config: Partial<AssessorConfig>;

  constructor(
    dimension: MAACDimension,
    llmProvider: LLMProvider,
    config?: Partial<AssessorConfig>,
  ) {
    this.dimension = dimension;
    this.llmProvider = llmProvider;
    this.config = config || {};
  }

  /**
   * Generate the full system prompt for LLM assessment
   * Override in each dimension assessor with exact n8n prompts
   */
  generateSystemPrompt(_context: AssessmentContext, _derived: DerivedMetrics): string {
    throw new Error('generateSystemPrompt must be implemented by subclass');
  }

  /**
   * Generate the user prompt (response text to assess)
   */
  generateUserPrompt(context: AssessmentContext): string {
    return `**AI Response for Assessment:**

${context.responseText}`;
  }

  /**
   * Generate the combined prompt for external use
   */
  generatePrompt(context: AssessmentContext, derivedMetrics: DerivedMetrics): string {
    const systemPrompt = this.generateSystemPrompt(context, derivedMetrics);
    const userPrompt = this.generateUserPrompt(context);
    return `${systemPrompt}\n\n---\n\n${userPrompt}`;
  }

  /**
   * Assess a cognitive response for this dimension
   */
  async assess(context: AssessmentContext): Promise<MAACScore> {
    const derived = calculateDerivedMetrics(context);
    const systemPrompt = this.generateSystemPrompt(context, derived);
    const userPrompt = this.generateUserPrompt(context);

    try {
      // Invoke LLM with structured output
      const rawScore = await this.llmProvider.invoke({
        systemPrompt,
        userMessage: userPrompt,
        responseSchema: MAACScoreSchema,
      });

      // Debug: log the raw response
      if (process.env.DEBUG_MAAC) {
        console.log(`[${this.dimension}] Raw LLM response:`, JSON.stringify(rawScore, null, 2));
      }

      // Validate and transform to MAACScore
      return this.transformToMAACScore(rawScore as Record<string, unknown>, context, derived);
    } catch (error) {
      // Log errors for debugging
      console.error(`[${this.dimension}] Assessment failed:`, error);
      // Return error score if assessment fails
      return this.createErrorScore(context, derived, error);
    }
  }

  /**
   * Transform raw LLM response to typed MAACScore
   */
  protected transformToMAACScore(
    raw: Record<string, unknown>,
    context: AssessmentContext,
    _derived: DerivedMetrics,
  ): MAACScore {
    // Handle case where component_scores is not provided
    const rawComponentScores = raw.component_scores as Record<string, ComponentScore> | undefined;
    const llmDimensionScore = raw.dimension_score as number;
    const llmConfidence = raw.confidence as number;

    // If component_scores is provided, use them; otherwise create synthetic ones from dimension_score
    let componentScores: Record<string, ComponentScore>;
    let dimensionScore: number;
    let confidence: number;

    if (rawComponentScores && Object.keys(rawComponentScores).length > 0) {
      componentScores = rawComponentScores;
      dimensionScore = calculateDimensionScore(componentScores);
      confidence = calculateConfidence(componentScores);
    } else {
      // Create synthetic component scores from the LLM's dimension score
      const syntheticReasoning = (raw.reasoning as string) || 'Aggregated assessment';
      componentScores = {
        q1: {
          score: llmDimensionScore,
          calculation: 'Synthetic from dimension_score',
          evidence: 'N/A - synthetic component',
          reasoning: syntheticReasoning,
        },
        q2: {
          score: llmDimensionScore,
          calculation: 'Synthetic from dimension_score',
          evidence: 'N/A - synthetic component',
          reasoning: syntheticReasoning,
        },
        q3: {
          score: llmDimensionScore,
          calculation: 'Synthetic from dimension_score',
          evidence: 'N/A - synthetic component',
          reasoning: syntheticReasoning,
        },
        q4: {
          score: llmDimensionScore,
          calculation: 'Synthetic from dimension_score',
          evidence: 'N/A - synthetic component',
          reasoning: syntheticReasoning,
        },
        q5: {
          score: llmDimensionScore,
          calculation: 'Synthetic from dimension_score',
          evidence: 'N/A - synthetic component',
          reasoning: syntheticReasoning,
        },
        q6: {
          score: llmDimensionScore,
          calculation: 'Synthetic from dimension_score',
          evidence: 'N/A - synthetic component',
          reasoning: syntheticReasoning,
        },
      };
      dimensionScore = llmDimensionScore;
      confidence = llmConfidence;
    }

    // Validate the score matches formula
    const validatedScore = this.validateFormulaCalculation(
      Object.fromEntries(Object.entries(componentScores).map(([k, v]) => [k, v.score])),
      llmDimensionScore || dimensionScore,
    );

    const isToolsEnabled = context.configId !== '000000000000';
    const timestamp = new Date().toISOString();

    return {
      dimension: this.dimension,
      assessmentContext: {
        model: context.modelId,
        configuration: context.configId,
        complexity: context.tier,
        processingTimeMs: context.processingTime,
        validationStatus: 'complete',
        missingVariables: [],
        calculationNotes: [],
      },
      componentScores,
      dimensionScore: validatedScore,
      confidence: Math.max(0, Math.min(1, confidence)),
      keyObservations: (raw.key_observations as string[]) || [],
      statisticalMetadata: {
        statisticalSignificanceP: 'pending_analysis',
        effectSizeCohenD: 'pending_analysis',
        confidenceIntervalLower: 'pending_analysis',
        confidenceIntervalUpper: 'pending_analysis',
        sampleAdequacyScore: 'pending_analysis',
        analysisRequired: ['t_test', 'effect_size', 'confidence_intervals', 'reliability_analysis'],
        comparisonGroupId: isToolsEnabled
          ? `control_${context.domain}_${context.tier}`
          : 'self_baseline',
        experimentalCondition: isToolsEnabled ? 'treatment_tools_enabled' : 'control_baseline',
      },
      cognitiveEmergenceIndicators:
        (raw.cognitive_emergence_indicators as Record<string, unknown>) || {},
      processingMetadata: {
        scenarioType: context.domain,
        cognitiveArchitectureType: 'mimic',
        assessmentFramework: 'maac_nine_dimensional_v1.0',
        methodologyApproach: 'hybrid_classical_modern',
        dimensionMethod: this.methodName,
        dataSchemaVersion: '4.0',
        validationTimestamp: timestamp,
        evaluationTimestamp: timestamp,
      },
      readinessFlags: {
        tier2ComparativeReady: true,
        architectureBaseline: isToolsEnabled ? 'tools_enabled' : 'tools_disabled',
        maacAssessmentCompleted: true,
        dimensionAssessmentComplete: true,
        dataValidationPassed: true,
        statisticalReady: true,
      },
      assessmentCriteria: {
        successCriteria: context.successCriteria.map((c) => c.criterion).join(', '),
        successThresholds: String(context.successThresholds[this.dimension] || 'N/A'),
        expectedCalculations: context.expectedCalculations.join(', '),
        scenarioRequirements: context.scenarioRequirements.join(', '),
        dataElements: context.dataElements?.join(', ') || 'N/A',
      },
      experimentalDesign: {
        group: isToolsEnabled ? 'treatment' : 'control',
        condition: isToolsEnabled ? 'tools_enabled' : 'tools_disabled',
        toolsAvailableCount: context.toolsInvokedCount,
        toolsUtilized: context.toolsInvoked,
        memoryEnabled: context.memoryOperationsCount > 0,
        sessionId: (context.processingMetadata?.sessionId as string) || 'unknown',
        trialId: (context.processingMetadata?.trialId as string) || 'unknown',
      },
    };
  }

  /**
   * Create an error score when assessment fails
   */
  protected createErrorScore(
    context: AssessmentContext,
    _derived: DerivedMetrics,
    error: unknown,
  ): MAACScore {
    const isToolsEnabled = context.configId !== '000000000000';
    const timestamp = new Date().toISOString();

    return {
      dimension: this.dimension,
      assessmentContext: {
        model: context.modelId,
        configuration: context.configId,
        complexity: context.tier,
        processingTimeMs: context.processingTime,
        validationStatus: 'error',
        missingVariables: [],
        calculationNotes: [`Assessment failed: ${String(error)}`],
      },
      componentScores: {},
      dimensionScore: 0,
      confidence: 0,
      keyObservations: ['Assessment failed due to error'],
      statisticalMetadata: {
        statisticalSignificanceP: 'error',
        effectSizeCohenD: 'error',
        confidenceIntervalLower: 'error',
        confidenceIntervalUpper: 'error',
        sampleAdequacyScore: 'error',
        analysisRequired: [],
        comparisonGroupId: 'error',
        experimentalCondition: isToolsEnabled ? 'treatment_tools_enabled' : 'control_baseline',
      },
      cognitiveEmergenceIndicators: {},
      processingMetadata: {
        scenarioType: context.domain,
        cognitiveArchitectureType: 'mimic',
        assessmentFramework: 'maac_nine_dimensional_v1.0',
        methodologyApproach: 'hybrid_classical_modern',
        dimensionMethod: this.methodName,
        dataSchemaVersion: '4.0',
        validationTimestamp: timestamp,
        evaluationTimestamp: timestamp,
      },
      readinessFlags: {
        tier2ComparativeReady: false,
        architectureBaseline: isToolsEnabled ? 'tools_enabled' : 'tools_disabled',
        maacAssessmentCompleted: false,
        dimensionAssessmentComplete: false,
        dataValidationPassed: false,
        statisticalReady: false,
      },
      assessmentCriteria: {
        successCriteria: '',
        successThresholds: '',
        expectedCalculations: '',
        scenarioRequirements: '',
        dataElements: '',
      },
      experimentalDesign: {
        group: isToolsEnabled ? 'treatment' : 'control',
        condition: isToolsEnabled ? 'tools_enabled' : 'tools_disabled',
        toolsAvailableCount: 0,
        toolsUtilized: [],
        sessionId: 'error',
        trialId: 'error',
      },
    };
  }

  /**
   * Validate that a reported score matches the formula calculation
   * Formula: average of component scores, rounded to nearest integer
   */
  validateFormulaCalculation(components: Record<string, number>, reportedScore: number): number {
    const scores = Object.values(components);
    if (scores.length === 0) return reportedScore;

    const calculatedScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

    // Validate within tolerance
    if (Math.abs(calculatedScore - reportedScore) > 0.5) {
      console.warn(
        `[${this.dimension}] Formula mismatch: calculated ${calculatedScore}, reported ${reportedScore}`,
      );
    }

    return calculatedScore;
  }

  /**
   * Helper to format arrays for prompt injection
   */
  protected formatArray(arr: string[] | undefined, fallback = 'N/A'): string {
    if (!arr || arr.length === 0) return fallback;
    return arr.map((item, i) => `${i + 1}. ${item}`).join('\n');
  }

  /**
   * Helper to get tier benchmark
   */
  protected getTierBenchmark(
    tier: string,
    benchmarks: { simple: number; moderate: number; complex: number },
  ): number {
    switch (tier) {
      case 'simple':
        return benchmarks.simple;
      case 'moderate':
        return benchmarks.moderate;
      case 'complex':
        return benchmarks.complex;
      default:
        return benchmarks.moderate;
    }
  }
}
