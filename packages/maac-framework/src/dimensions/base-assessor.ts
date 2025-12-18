/**
 * Base Dimension Assessor - Abstract class for MAAC dimension assessment
 * Provides common functionality for all 9 dimension assessors
 */

import { LLMProvider } from '@maac/types';
import {
  MAACDimension,
  AssessmentContext,
  DerivedMetrics,
  MAACScore,
  ComponentScore,
  DimensionAssessor,
  calculateDimensionScore,
  calculateConfidence,
  calculateDerivedMetrics,
  MAACScoreSchema,
} from './types';

export abstract class BaseDimensionAssessor implements DimensionAssessor {
  abstract readonly dimension: MAACDimension;
  abstract readonly version: string;
  abstract readonly methodName: string;

  /**
   * Generate the full system prompt for LLM assessment
   * Must be implemented by each dimension assessor with exact n8n prompts
   */
  abstract generateSystemPrompt(context: AssessmentContext, derived: DerivedMetrics): string;

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
  async assess(context: AssessmentContext, llm: LLMProvider): Promise<MAACScore> {
    const derived = calculateDerivedMetrics(context);
    const systemPrompt = this.generateSystemPrompt(context, derived);
    const userPrompt = this.generateUserPrompt(context);

    try {
      // Invoke LLM with structured output
      const response = await llm.invoke({
        system: systemPrompt,
        prompt: userPrompt,
        responseFormat: {
          type: 'json_schema',
          schema: MAACScoreSchema,
        },
      });

      // Parse the response
      const rawScore = typeof response === 'string' ? JSON.parse(response) : response;

      // Validate and transform to MAACScore
      return this.transformToMAACScore(rawScore, context, derived);
    } catch (error) {
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
    derived: DerivedMetrics,
  ): MAACScore {
    const componentScores = (raw.component_scores as Record<string, ComponentScore>) || {};
    const dimensionScore = calculateDimensionScore(componentScores);
    const confidence = calculateConfidence(componentScores);

    // Validate the score matches formula
    const validatedScore = this.validateFormulaCalculation(
      Object.fromEntries(Object.entries(componentScores).map(([k, v]) => [k, v.score])),
      (raw.dimension_score as number) || dimensionScore,
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
