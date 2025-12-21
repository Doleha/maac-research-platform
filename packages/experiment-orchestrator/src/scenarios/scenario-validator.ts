/**
 * Scenario Validator Middleware
 *
 * Integrates complexity validation into the scenario generation pipeline.
 * Ensures all scenarios pass validation before being accepted.
 *
 * Key features:
 * - Validates generated scenarios using the complexity-analyzer
 * - Automatically regenerates failing scenarios with enhanced prompts
 * - Parallel-safe for concurrent generation workflows
 * - Emits progress events for real-time feedback
 * - Stores complexity metrics with each scenario
 */

import type {
  ComplexityScore,
  ScenarioValidationResult,
  ValidationBatchStats,
  ComplexityValidationConfig,
  ValidationProgressCallback,
} from '@maac/types';

import {
  validateScenario,
  type ScenarioInput,
  analyzeComplexity,
} from '@maac/complexity-analyzer';

import type { GeneratedLLMScenario, ProgressCallback } from './llm-scenario-generator';

/**
 * Extended scenario with validation data
 */
export interface ValidatedScenario extends GeneratedLLMScenario {
  /** Whether the scenario passed validation */
  validationPassed: boolean;

  /** Full complexity score breakdown */
  complexityScore: ComplexityScore;

  /** Validation timestamp */
  validationTimestamp: Date;

  /** Validation duration in milliseconds */
  validationDurationMs: number;

  /** Number of regeneration attempts */
  regenerationAttempts: number;
}

/**
 * Validation middleware options
 */
export interface ValidationMiddlewareOptions {
  /** Validation configuration (thresholds, weights, etc.) */
  config?: ComplexityValidationConfig;

  /** Maximum regeneration attempts per scenario */
  maxRegenerationAttempts?: number;

  /** Whether to fail fast on validation errors */
  failFast?: boolean;

  /** Progress callback for validation events */
  onProgress?: ValidationProgressCallback;

  /** Generator progress callback for regeneration events */
  onGeneratorProgress?: ProgressCallback;

  /** Whether to run validation in parallel with generation */
  parallelValidation?: boolean;
}

/**
 * Result of batch validation
 */
export interface ValidationBatchResult {
  /** All validated scenarios (passed validation) */
  validatedScenarios: ValidatedScenario[];

  /** Scenarios that failed validation after max retries */
  failedScenarios: Array<{
    scenario: GeneratedLLMScenario;
    validationResult: ScenarioValidationResult;
    attempts: number;
  }>;

  /** Batch statistics */
  stats: ValidationBatchStats;

  /** Total time for validation in milliseconds */
  totalValidationTimeMs: number;
}

/**
 * Default validation configuration with reasonable thresholds
 */
const DEFAULT_VALIDATION_OPTIONS: Required<Omit<ValidationMiddlewareOptions, 'config' | 'onProgress' | 'onGeneratorProgress'>> = {
  maxRegenerationAttempts: 3,
  failFast: false,
  parallelValidation: true,
};

/**
 * Converts a generated scenario to validation input format
 */
function scenarioToValidationInput(
  scenario: GeneratedLLMScenario,
  regenerationAttempts: number = 0
): ScenarioInput {
  // Extract calculation steps from scenario
  const calculationSteps = scenario.domain_specific_data?.calculations_required || [];

  // Extract variables from data elements
  const dataElements = scenario.domain_specific_data?.data_elements || [];
  const variables = dataElements.map((element, index) => ({
    name: `element_${index}`,
    type: inferVariableType(element),
    dependsOn: index > 0 ? [`element_${index - 1}`] : undefined,
  }));

  // Build relationships from expected calculations
  const relationships: Array<{ from: string; to: string; type: string }> = [];
  const expectedCalcs = scenario.control_expectations?.expected_calculations || {};
  const calcNames = Object.keys(expectedCalcs);
  for (let i = 1; i < calcNames.length; i++) {
    relationships.push({
      from: calcNames[i - 1],
      to: calcNames[i],
      type: 'depends-on',
    });
  }

  return {
    id: scenario.scenarioId,
    intendedTier: scenario.complexity_level,
    content: buildScenarioContent(scenario),
    calculationSteps,
    variables,
    relationships,
    domain: scenario.metadata?.business_domain || scenario.domain_specific_data?.business_function,
    regenerationAttempts,
  };
}

/**
 * Infers variable type from a data element string
 */
function inferVariableType(element: string): string {
  const lowerElement = element.toLowerCase();

  if (/\$|cost|price|revenue|expense|profit|margin|value/i.test(lowerElement)) {
    return 'monetary';
  }
  if (/%|percent|rate|ratio/i.test(lowerElement)) {
    return 'percentage';
  }
  if (/time|hours?|days?|weeks?|months?|years?|duration/i.test(lowerElement)) {
    return 'temporal';
  }
  if (/count|number|quantity|units?|items?/i.test(lowerElement)) {
    return 'count';
  }
  if (/score|rating|rank/i.test(lowerElement)) {
    return 'ordinal';
  }

  return 'numeric';
}

/**
 * Builds the full content string for validation from a scenario
 */
function buildScenarioContent(scenario: GeneratedLLMScenario): string {
  const parts: string[] = [];

  // Title and description
  parts.push(scenario.task_title);
  parts.push(scenario.task_description);
  parts.push(scenario.business_context);

  // Requirements
  if (scenario.requirements?.length) {
    parts.push('Requirements: ' + scenario.requirements.join('. '));
  }

  // Success criteria
  if (scenario.success_criteria?.length) {
    parts.push('Success Criteria: ' + scenario.success_criteria.join('. '));
  }

  // Domain-specific data
  if (scenario.domain_specific_data) {
    if (scenario.domain_specific_data.data_elements?.length) {
      parts.push('Data Elements: ' + scenario.domain_specific_data.data_elements.join('. '));
    }
    if (scenario.domain_specific_data.calculations_required?.length) {
      parts.push('Calculations: ' + scenario.domain_specific_data.calculations_required.join('. '));
    }
  }

  // MAAC cognitive requirements
  if (scenario.MAAC_cognitive_requirements) {
    if (scenario.MAAC_cognitive_requirements.primary_dimensions_tested?.length) {
      parts.push('Cognitive Dimensions: ' + scenario.MAAC_cognitive_requirements.primary_dimensions_tested.join(', '));
    }
    if (scenario.MAAC_cognitive_requirements.memory_integration_opportunities?.length) {
      parts.push('Memory Integration: ' + scenario.MAAC_cognitive_requirements.memory_integration_opportunities.join('. '));
    }
  }

  // Complexity justification
  if (scenario.metadata?.complexity_justification) {
    parts.push('Complexity Justification: ' + scenario.metadata.complexity_justification);
  }

  return parts.join('\n\n');
}

/**
 * Generates prompt enhancements for regeneration based on validation failures
 */
function generatePromptEnhancements(
  scenario: GeneratedLLMScenario,
  validationResult: ScenarioValidationResult
): string[] {
  const enhancements: string[] = [];
  const score = validationResult.complexityScore;
  const tier = scenario.complexity_level;

  // Use rejection reasons as base for enhancements
  if (validationResult.promptEnhancements?.length) {
    enhancements.push(...validationResult.promptEnhancements);
  }

  // Add tier-specific guidance if missing required complexity
  if (tier === 'simple' && score.predictedTier !== 'simple') {
    enhancements.push('IMPORTANT: Simplify the scenario - reduce calculation steps, remove trade-offs, make dependencies sequential');
    enhancements.push('For SIMPLE tier: Use only 2-3 straightforward calculation steps with clear, single-path solution');
  } else if (tier === 'moderate' && score.predictedTier === 'simple') {
    enhancements.push('IMPORTANT: Add more complexity - include alternative approaches, some interdependencies between calculations');
    enhancements.push('For MODERATE tier: Include 4-5 calculation steps with some interdependencies and at least one trade-off consideration');
  } else if (tier === 'complex' && score.predictedTier !== 'complex') {
    enhancements.push('IMPORTANT: Increase complexity significantly - add multiple objectives, trade-offs, uncertainty, and networked dependencies');
    enhancements.push('For COMPLEX tier: Include 5+ calculation steps with conflicting objectives, high uncertainty, and feedback loops');
  }

  // Add specific dimension guidance
  if (score.woodMetrics.distinctActs < 4 && tier !== 'simple') {
    enhancements.push(`Add more distinct calculation/analysis steps (current: ${score.woodMetrics.distinctActs}, target: ${tier === 'moderate' ? '4-5' : '5+'})`);
  }

  if (!score.campbellAttributes.multiplePaths && tier !== 'simple') {
    enhancements.push('Include multiple valid solution approaches (e.g., "Method A: ... alternatively, Method B: ...")');
  }

  if (!score.campbellAttributes.conflictingInterdependence && tier === 'complex') {
    enhancements.push('Add explicit trade-offs between objectives (e.g., "maximizing X comes at the expense of Y")');
  }

  return enhancements.slice(0, 5); // Limit to 5 enhancements
}

/**
 * Validates a single generated scenario
 */
export async function validateGeneratedScenario(
  scenario: GeneratedLLMScenario,
  options?: ValidationMiddlewareOptions
): Promise<ValidatedScenario> {
  const startTime = Date.now();
  const config = options?.config;

  // Convert scenario to validation input
  const validationInput = scenarioToValidationInput(scenario, 0);

  // Run validation
  const validationResult = await validateScenario(validationInput, { config });

  // Emit progress
  options?.onProgress?.({
    type: 'validation_complete',
    current: 1,
    total: 1,
    percentage: 100,
    scenarioId: scenario.scenarioId,
    validationResult: {
      isValid: validationResult.isValid,
      tierMatch: validationResult.complexityScore.tierMatch,
      predictedTier: validationResult.complexityScore.predictedTier,
      intendedTier: validationResult.complexityScore.intendedTier,
      confidenceScore: validationResult.complexityScore.confidenceScore,
      overallScore: validationResult.complexityScore.overallScore,
    },
    message: validationResult.isValid
      ? `✓ Scenario ${scenario.scenarioId} passed validation`
      : `✗ Scenario ${scenario.scenarioId} failed: ${validationResult.complexityScore.rejectionReasons[0]}`,
    elapsedMs: Date.now() - startTime,
  });

  return {
    ...scenario,
    validationPassed: validationResult.isValid,
    complexityScore: validationResult.complexityScore,
    validationTimestamp: validationResult.validationTimestamp,
    validationDurationMs: validationResult.validationDurationMs,
    regenerationAttempts: 0,
  };
}

/**
 * Validates a batch of scenarios with parallel support
 */
export async function validateScenarioBatch(
  scenarios: GeneratedLLMScenario[],
  options?: ValidationMiddlewareOptions
): Promise<ValidationBatchResult> {
  const startTime = Date.now();
  const mergedOptions = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const config = options?.config;

  const validatedScenarios: ValidatedScenario[] = [];
  const failedScenarios: ValidationBatchResult['failedScenarios'] = [];

  // Emit batch start
  options?.onProgress?.({
    type: 'validation_start',
    current: 0,
    total: scenarios.length,
    percentage: 0,
    message: `Starting validation of ${scenarios.length} scenarios...`,
  });

  if (mergedOptions.parallelValidation) {
    // Parallel validation
    const validationPromises = scenarios.map(async (scenario, index) => {
      const validationInput = scenarioToValidationInput(scenario, 0);
      const result = await validateScenario(validationInput, { config });

      options?.onProgress?.({
        type: 'validation_progress',
        current: index + 1,
        total: scenarios.length,
        percentage: Math.round(((index + 1) / scenarios.length) * 100),
        scenarioId: scenario.scenarioId,
        validationResult: {
          isValid: result.isValid,
          tierMatch: result.complexityScore.tierMatch,
          predictedTier: result.complexityScore.predictedTier,
          intendedTier: result.complexityScore.intendedTier,
          confidenceScore: result.complexityScore.confidenceScore,
          overallScore: result.complexityScore.overallScore,
        },
        message: result.isValid
          ? `✓ ${index + 1}/${scenarios.length} passed`
          : `✗ ${index + 1}/${scenarios.length} failed`,
        elapsedMs: Date.now() - startTime,
      });

      return { scenario, result };
    });

    const results = await Promise.all(validationPromises);

    for (const { scenario, result } of results) {
      if (result.isValid) {
        validatedScenarios.push({
          ...scenario,
          validationPassed: true,
          complexityScore: result.complexityScore,
          validationTimestamp: result.validationTimestamp,
          validationDurationMs: result.validationDurationMs,
          regenerationAttempts: 0,
        });
      } else {
        failedScenarios.push({
          scenario,
          validationResult: result,
          attempts: 1,
        });
      }
    }
  } else {
    // Sequential validation
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      const validationInput = scenarioToValidationInput(scenario, 0);
      const result = await validateScenario(validationInput, { config });

      options?.onProgress?.({
        type: 'validation_progress',
        current: i + 1,
        total: scenarios.length,
        percentage: Math.round(((i + 1) / scenarios.length) * 100),
        scenarioId: scenario.scenarioId,
        validationResult: {
          isValid: result.isValid,
          tierMatch: result.complexityScore.tierMatch,
          predictedTier: result.complexityScore.predictedTier,
          intendedTier: result.complexityScore.intendedTier,
          confidenceScore: result.complexityScore.confidenceScore,
          overallScore: result.complexityScore.overallScore,
        },
        message: result.isValid
          ? `✓ ${i + 1}/${scenarios.length} passed`
          : `✗ ${i + 1}/${scenarios.length} failed`,
        elapsedMs: Date.now() - startTime,
      });

      if (result.isValid) {
        validatedScenarios.push({
          ...scenario,
          validationPassed: true,
          complexityScore: result.complexityScore,
          validationTimestamp: result.validationTimestamp,
          validationDurationMs: result.validationDurationMs,
          regenerationAttempts: 0,
        });
      } else {
        failedScenarios.push({
          scenario,
          validationResult: result,
          attempts: 1,
        });

        if (mergedOptions.failFast) {
          break;
        }
      }
    }
  }

  // Calculate stats
  const stats = calculateStats(validatedScenarios, failedScenarios);

  // Emit batch complete
  options?.onProgress?.({
    type: 'batch_complete',
    current: scenarios.length,
    total: scenarios.length,
    percentage: 100,
    batchStats: stats,
    message: `Validation complete: ${validatedScenarios.length}/${scenarios.length} passed (${(stats.passRate * 100).toFixed(1)}%)`,
    elapsedMs: Date.now() - startTime,
  });

  return {
    validatedScenarios,
    failedScenarios,
    stats,
    totalValidationTimeMs: Date.now() - startTime,
  };
}

/**
 * Validates scenarios with automatic regeneration for failures
 *
 * This is the main integration point for the generation pipeline.
 * It validates each scenario and triggers regeneration if validation fails.
 */
export async function validateWithRegeneration(
  scenarios: GeneratedLLMScenario[],
  regenerateScenario: (
    scenario: GeneratedLLMScenario,
    enhancements: string[]
  ) => Promise<GeneratedLLMScenario>,
  options?: ValidationMiddlewareOptions
): Promise<ValidationBatchResult> {
  const startTime = Date.now();
  const mergedOptions = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const config = options?.config;

  const validatedScenarios: ValidatedScenario[] = [];
  const failedScenarios: ValidationBatchResult['failedScenarios'] = [];

  let totalRegenerations = 0;

  options?.onProgress?.({
    type: 'validation_start',
    current: 0,
    total: scenarios.length,
    percentage: 0,
    message: `Starting validation with regeneration for ${scenarios.length} scenarios...`,
  });

  for (let i = 0; i < scenarios.length; i++) {
    let currentScenario = scenarios[i];
    let attempts = 0;
    let isValid = false;
    let lastResult: ScenarioValidationResult | null = null;

    while (attempts < mergedOptions.maxRegenerationAttempts + 1) {
      const validationInput = scenarioToValidationInput(currentScenario, attempts);
      const result = await validateScenario(validationInput, { config });
      lastResult = result;

      if (result.isValid) {
        isValid = true;
        validatedScenarios.push({
          ...currentScenario,
          validationPassed: true,
          complexityScore: result.complexityScore,
          validationTimestamp: result.validationTimestamp,
          validationDurationMs: result.validationDurationMs,
          regenerationAttempts: attempts,
        });

        options?.onProgress?.({
          type: 'validation_complete',
          current: i + 1,
          total: scenarios.length,
          percentage: Math.round(((i + 1) / scenarios.length) * 100),
          scenarioId: currentScenario.scenarioId,
          validationResult: {
            isValid: true,
            tierMatch: result.complexityScore.tierMatch,
            predictedTier: result.complexityScore.predictedTier,
            intendedTier: result.complexityScore.intendedTier,
            confidenceScore: result.complexityScore.confidenceScore,
            overallScore: result.complexityScore.overallScore,
          },
          message: attempts > 0
            ? `✓ Scenario passed after ${attempts} regeneration(s)`
            : `✓ Scenario passed on first attempt`,
          elapsedMs: Date.now() - startTime,
        });

        break;
      }

      attempts++;

      if (attempts <= mergedOptions.maxRegenerationAttempts) {
        // Generate prompt enhancements
        const enhancements = generatePromptEnhancements(currentScenario, result);

        options?.onProgress?.({
          type: 'regeneration_start',
          current: i + 1,
          total: scenarios.length,
          percentage: Math.round(((i + 0.5) / scenarios.length) * 100),
          scenarioId: currentScenario.scenarioId,
          message: `🔄 Regenerating scenario (attempt ${attempts}/${mergedOptions.maxRegenerationAttempts}): ${result.complexityScore.rejectionReasons[0]}`,
          elapsedMs: Date.now() - startTime,
        });

        // Regenerate the scenario
        try {
          currentScenario = await regenerateScenario(currentScenario, enhancements);
          totalRegenerations++;

          options?.onProgress?.({
            type: 'regeneration_complete',
            current: i + 1,
            total: scenarios.length,
            percentage: Math.round(((i + 0.75) / scenarios.length) * 100),
            scenarioId: currentScenario.scenarioId,
            message: `✓ Regenerated scenario, validating...`,
            elapsedMs: Date.now() - startTime,
          });
        } catch (error) {
          // Regeneration failed, record as failure
          options?.onProgress?.({
            type: 'validation_complete',
            current: i + 1,
            total: scenarios.length,
            percentage: Math.round(((i + 1) / scenarios.length) * 100),
            scenarioId: currentScenario.scenarioId,
            message: `✗ Regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            elapsedMs: Date.now() - startTime,
          });
          break;
        }
      }
    }

    if (!isValid && lastResult) {
      failedScenarios.push({
        scenario: currentScenario,
        validationResult: lastResult,
        attempts,
      });

      options?.onProgress?.({
        type: 'validation_complete',
        current: i + 1,
        total: scenarios.length,
        percentage: Math.round(((i + 1) / scenarios.length) * 100),
        scenarioId: currentScenario.scenarioId,
        validationResult: {
          isValid: false,
          tierMatch: lastResult.complexityScore.tierMatch,
          predictedTier: lastResult.complexityScore.predictedTier,
          intendedTier: lastResult.complexityScore.intendedTier,
          confidenceScore: lastResult.complexityScore.confidenceScore,
          overallScore: lastResult.complexityScore.overallScore,
        },
        message: `✗ Scenario failed after ${attempts} attempts: ${lastResult.complexityScore.rejectionReasons[0]}`,
        elapsedMs: Date.now() - startTime,
      });

      if (mergedOptions.failFast) {
        break;
      }
    }
  }

  const stats = calculateStats(validatedScenarios, failedScenarios);
  stats.totalRegenerationAttempts = totalRegenerations;

  options?.onProgress?.({
    type: 'batch_complete',
    current: scenarios.length,
    total: scenarios.length,
    percentage: 100,
    batchStats: stats,
    message: `Validation complete: ${validatedScenarios.length}/${scenarios.length} passed, ${totalRegenerations} regenerations`,
    elapsedMs: Date.now() - startTime,
  });

  return {
    validatedScenarios,
    failedScenarios,
    stats,
    totalValidationTimeMs: Date.now() - startTime,
  };
}

/**
 * Quick validation check - returns true if scenario would pass
 */
export function wouldPassValidation(
  scenario: GeneratedLLMScenario,
  config?: ComplexityValidationConfig
): boolean {
  const content = buildScenarioContent(scenario);
  const score = analyzeComplexity({
    content,
    intendedTier: scenario.complexity_level,
  });

  // Check if predicted matches intended within tolerance
  const tierOrder = ['simple', 'moderate', 'complex'];
  const intendedIndex = tierOrder.indexOf(scenario.complexity_level);
  const predictedIndex = tierOrder.indexOf(score.predictedTier);

  const allowedDeviation = config?.allowedTierDeviation ?? 1;
  const minimumConfidence = config?.minimumConfidence ?? 0.6;

  return (
    Math.abs(intendedIndex - predictedIndex) <= allowedDeviation &&
    score.confidenceScore >= minimumConfidence
  );
}

/**
 * Calculates batch statistics from validation results
 */
function calculateStats(
  passed: ValidatedScenario[],
  failed: ValidationBatchResult['failedScenarios']
): ValidationBatchStats {
  const total = passed.length + failed.length;
  const passRate = total > 0 ? passed.length / total : 0;

  const intendedTierDistribution: Record<string, number> = {};
  const predictedTierDistribution: Record<string, number> = {};
  const tierMatchCounts: Record<string, { matched: number; total: number }> = {};

  let totalConfidence = 0;
  let totalValidationTime = 0;
  let totalRegenerations = 0;

  // Process passed scenarios
  for (const scenario of passed) {
    const intended = scenario.complexityScore.intendedTier;
    const predicted = scenario.complexityScore.predictedTier;

    intendedTierDistribution[intended] = (intendedTierDistribution[intended] || 0) + 1;
    predictedTierDistribution[predicted] = (predictedTierDistribution[predicted] || 0) + 1;

    if (!tierMatchCounts[intended]) {
      tierMatchCounts[intended] = { matched: 0, total: 0 };
    }
    tierMatchCounts[intended].total++;
    if (scenario.complexityScore.tierMatch) {
      tierMatchCounts[intended].matched++;
    }

    totalConfidence += scenario.complexityScore.confidenceScore;
    totalValidationTime += scenario.validationDurationMs;
    totalRegenerations += scenario.regenerationAttempts;
  }

  // Process failed scenarios
  for (const { validationResult } of failed) {
    const intended = validationResult.complexityScore.intendedTier;
    const predicted = validationResult.complexityScore.predictedTier;

    intendedTierDistribution[intended] = (intendedTierDistribution[intended] || 0) + 1;
    predictedTierDistribution[predicted] = (predictedTierDistribution[predicted] || 0) + 1;

    if (!tierMatchCounts[intended]) {
      tierMatchCounts[intended] = { matched: 0, total: 0 };
    }
    tierMatchCounts[intended].total++;

    totalConfidence += validationResult.complexityScore.confidenceScore;
    totalValidationTime += validationResult.validationDurationMs;
  }

  const tierMatchRate: Record<string, number> = {};
  for (const [tier, counts] of Object.entries(tierMatchCounts)) {
    tierMatchRate[tier] = counts.total > 0 ? counts.matched / counts.total : 0;
  }

  return {
    totalValidated: total,
    passed: passed.length,
    failed: failed.length,
    passRate,
    avgConfidenceScore: total > 0 ? totalConfidence / total : 0,
    intendedTierDistribution,
    predictedTierDistribution,
    tierMatchRate,
    avgValidationTimeMs: total > 0 ? totalValidationTime / total : 0,
    totalRegenerationAttempts: totalRegenerations,
  };
}

export default {
  validateGeneratedScenario,
  validateScenarioBatch,
  validateWithRegeneration,
  wouldPassValidation,
};
