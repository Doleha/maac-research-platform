/**
 * Complexity Validation Engine
 *
 * Orchestrates the complete validation process:
 * 1. Parse scenario content
 * 2. Run all framework analyzers
 * 3. Calculate composite score
 * 4. Validate against tier requirements
 * 5. Generate regeneration guidance if needed
 */

import type {
  ComplexityScore,
  ScenarioValidationResult,
  ValidationBatchStats,
  ComplexityValidationConfig,
  ValidationProgressCallback,
} from '@maac/types';

import { analyzeWoodMetrics, type WoodAnalysisInput } from './analyzers/wood-analyzer';
import {
  analyzeCampbellAttributes,
  type CampbellAnalysisInput,
} from './analyzers/campbell-analyzer';
import { analyzeLiuLiDimensions, type LiuLiAnalysisInput } from './analyzers/liuli-analyzer';
import {
  analyzeElementInteractivity,
  type ElementInteractivityInput,
} from './analyzers/interactivity-analyzer';
import { calculateCompositeScore, isValidScenario } from './scoring/composite-scorer';

/**
 * Scenario input for validation
 */
export interface ScenarioInput {
  /** Unique scenario identifier */
  id: string;

  /** Intended complexity tier */
  intendedTier: 'simple' | 'moderate' | 'complex';

  /** Scenario content/description */
  content: string;

  /** Pre-parsed calculation steps (optional) */
  calculationSteps?: string[];

  /** Pre-identified variables (optional) */
  variables?: Array<{ name: string; type: string; dependsOn?: string[] }>;

  /** Pre-identified relationships (optional) */
  relationships?: Array<{ from: string; to: string; type: string }>;

  /** Domain for novelty assessment */
  domain?: string;

  /** Current regeneration attempt count */
  regenerationAttempts?: number;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Validation configuration */
  config?: ComplexityValidationConfig;

  /** Progress callback for real-time updates */
  onProgress?: ValidationProgressCallback;

  /** Timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Default configuration loaded from types
 */
const getDefaultConfig = (): ComplexityValidationConfig => ({
  tierThresholds: {
    simple: { min: 0, max: 15 },
    moderate: { min: 15, max: 30 },
    complex: { min: 30, max: Infinity },
  },
  interactivityThresholds: {
    simple: { max: 0.2 },
    moderate: { min: 0.2, max: 0.5 },
    complex: { min: 0.5 },
  },
  weights: {
    woodDistinctActs: 2.0,
    woodInformationCues: 1.5,
    woodCoordinative: 3.0,
    campbellAttribute: 3.0,
    liuLiVariety: 2.0,
    liuLiAmbiguity: 2.5,
    elementInteractivity: 4.0,
  },
  strictMode: false,
  allowedTierDeviation: 1,
  maxRegenerationAttempts: 3,
  validationTimeoutMs: 5000,
  minimumConfidence: 0.6,
});

/**
 * Validates a single scenario
 */
export async function validateScenario(
  scenario: ScenarioInput,
  options?: ValidationOptions,
): Promise<ScenarioValidationResult> {
  const startTime = Date.now();
  const config = options?.config ?? getDefaultConfig();

  try {
    // Run all analyzers
    const complexityScore = await analyzeScenario(scenario, config);

    // Determine validation result
    const isValid = isValidScenario(complexityScore, config);

    // Generate regeneration guidance if needed
    const regenerationGuidance = !isValid
      ? generateRegenerationGuidance(scenario, complexityScore)
      : undefined;

    const validationDurationMs = Date.now() - startTime;

    // Emit progress event
    options?.onProgress?.({
      type: 'validation_complete',
      current: 1,
      total: 1,
      percentage: 100,
      scenarioId: scenario.id,
      validationResult: {
        isValid,
        tierMatch: complexityScore.tierMatch,
        predictedTier: complexityScore.predictedTier,
        intendedTier: complexityScore.intendedTier,
        confidenceScore: complexityScore.confidenceScore,
        overallScore: complexityScore.overallScore,
      },
      message: isValid
        ? `Scenario ${scenario.id} passed validation`
        : `Scenario ${scenario.id} failed validation: ${complexityScore.rejectionReasons[0]}`,
      elapsedMs: validationDurationMs,
    });

    return {
      scenarioId: scenario.id,
      isValid,
      complexityScore,
      validationTimestamp: new Date(),
      validationDurationMs,
      shouldRegenerate:
        !isValid && (scenario.regenerationAttempts ?? 0) < config.maxRegenerationAttempts,
      regenerationReason: !isValid ? complexityScore.rejectionReasons[0] : undefined,
      promptEnhancements: regenerationGuidance?.promptEnhancements,
      regenerationAttempts: scenario.regenerationAttempts ?? 0,
    };
  } catch (error) {
    const validationDurationMs = Date.now() - startTime;

    // Return error result
    return {
      scenarioId: scenario.id,
      isValid: false,
      complexityScore: createErrorComplexityScore(scenario, error),
      validationTimestamp: new Date(),
      validationDurationMs,
      shouldRegenerate: true,
      regenerationReason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      promptEnhancements: ['Ensure scenario has clear calculation steps and requirements'],
      regenerationAttempts: scenario.regenerationAttempts ?? 0,
    };
  }
}

/**
 * Validates a batch of scenarios (parallel-safe)
 */
export async function validateBatch(
  scenarios: ScenarioInput[],
  options?: ValidationOptions,
): Promise<{ results: ScenarioValidationResult[]; stats: ValidationBatchStats }> {
  const startTime = Date.now();
  const results: ScenarioValidationResult[] = [];

  // Emit batch start
  options?.onProgress?.({
    type: 'validation_start',
    current: 0,
    total: scenarios.length,
    percentage: 0,
    message: `Starting validation of ${scenarios.length} scenarios`,
  });

  // Process scenarios (can be parallelized)
  const validationPromises = scenarios.map(async (scenario, index) => {
    const result = await validateScenario(scenario, {
      ...options,
      onProgress: (event) => {
        // Transform individual progress to batch progress
        if (event.type === 'validation_complete') {
          options?.onProgress?.({
            ...event,
            type: 'validation_progress',
            current: index + 1,
            total: scenarios.length,
            percentage: Math.round(((index + 1) / scenarios.length) * 100),
          });
        }
      },
    });

    return result;
  });

  const allResults = await Promise.all(validationPromises);
  results.push(...allResults);

  // Calculate batch statistics
  const stats = calculateBatchStats(results);

  // Emit batch complete
  options?.onProgress?.({
    type: 'batch_complete',
    current: scenarios.length,
    total: scenarios.length,
    percentage: 100,
    batchStats: stats,
    message: `Completed validation: ${stats.passed}/${stats.totalValidated} passed (${(stats.passRate * 100).toFixed(1)}%)`,
    elapsedMs: Date.now() - startTime,
  });

  return { results, stats };
}

/**
 * Analyzes a scenario using all frameworks
 */
async function analyzeScenario(
  scenario: ScenarioInput,
  config: ComplexityValidationConfig,
): Promise<ComplexityScore> {
  // Prepare inputs for each analyzer
  const woodInput: WoodAnalysisInput = {
    content: scenario.content,
    calculationSteps: scenario.calculationSteps,
    variables: scenario.variables?.map((v) => v.name),
    hasConditionals: detectConditionals(scenario.content),
    hasStateChanges: detectStateChanges(scenario.content),
    dependencies: scenario.relationships?.map((r) => ({ from: r.from, to: r.to })),
  };

  const campbellInput: CampbellAnalysisInput = {
    content: scenario.content,
    solutionApproaches: extractApproaches(scenario.content),
    objectives: extractObjectives(scenario.content),
    tradeoffs: extractTradeoffs(scenario.content),
    informationGaps: extractInformationGaps(scenario.content),
  };

  const liuLiInput: LiuLiAnalysisInput = {
    content: scenario.content,
    entityCount: scenario.variables?.length,
    entityTypes: scenario.variables?.map((v) => v.type),
    variables: scenario.variables,
    relationships: scenario.relationships,
    domain: scenario.domain,
    calculationSteps: scenario.calculationSteps?.map((step) => ({ step })),
  };

  // Run analyzers
  const woodMetrics = analyzeWoodMetrics(woodInput);
  const campbellAttributes = analyzeCampbellAttributes(campbellInput);
  const liuLiDimensions = analyzeLiuLiDimensions(liuLiInput);

  // Element interactivity needs Wood's total elements
  const interactivityInput: ElementInteractivityInput = {
    content: scenario.content,
    woodTotalElements: woodMetrics.totalElements,
    variables: scenario.variables,
    steps: scenario.calculationSteps?.map((_step, i) => ({
      id: `step-${i + 1}`,
      dependsOn: i > 0 ? [`step-${i}`] : undefined,
    })),
  };

  const elementInteractivity = analyzeElementInteractivity(interactivityInput);

  // Calculate composite score
  return calculateCompositeScore({
    intendedTier: scenario.intendedTier,
    woodMetrics,
    campbellAttributes,
    liuLiDimensions,
    elementInteractivity,
    config,
  });
}

/**
 * Detects conditional statements in content
 */
function detectConditionals(content: string): boolean {
  const patterns = [
    /if\s+.*then/gi,
    /when\s+.*(?:occurs?|happens?)/gi,
    /in\s+(?:the\s+)?case\s+(?:of|that)/gi,
    /depending\s+on/gi,
    /alternatively/gi,
    /either\s+.*\s+or/gi,
  ];

  return patterns.some((pattern) => pattern.test(content));
}

/**
 * Detects state changes in content
 */
function detectStateChanges(content: string): boolean {
  const patterns = [
    /chang(?:e|es|ed|ing)/gi,
    /updat(?:e|es|ed|ing)/gi,
    /modif(?:y|ies|ied|ying)/gi,
    /adjust(?:s|ed|ing)?/gi,
    /over\s+time/gi,
    /period\s+to\s+period/gi,
  ];

  let matches = 0;
  for (const pattern of patterns) {
    if (pattern.test(content)) matches++;
  }

  return matches >= 2;
}

/**
 * Extracts solution approaches from content
 */
function extractApproaches(content: string): string[] {
  const approaches: string[] = [];
  const patterns = [
    /(?:approach|method|option|alternative)\s*(?:\d+|[a-z])?\s*[:\-]?\s*([^.]+)/gi,
    /(?:can|could)\s+(?:use|apply|employ)\s+([^.]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && approaches.length < 5) {
        approaches.push(match[1].trim());
      }
    }
  }

  return approaches;
}

/**
 * Extracts objectives from content
 */
function extractObjectives(content: string): string[] {
  const objectives: string[] = [];
  const patterns = [
    /(?:objective|goal|target|aim)\s*(?:\d+|[a-z])?\s*[:\-]?\s*([^.]+)/gi,
    /(?:maximize|minimize|optimize)\s+([^.]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && objectives.length < 5) {
        objectives.push(match[1].trim());
      }
    }
  }

  return objectives;
}

/**
 * Extracts trade-offs from content
 */
function extractTradeoffs(content: string): string[] {
  const tradeoffs: string[] = [];
  const patterns = [
    /trade-?off\s*(?:between|of)?\s*([^.]+)/gi,
    /(?:balance|weigh)\s+([^.]+)\s+(?:against|vs\.?)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && tradeoffs.length < 5) {
        tradeoffs.push(match[1].trim());
      }
    }
  }

  return tradeoffs;
}

/**
 * Extracts information gaps from content
 */
function extractInformationGaps(content: string): string[] {
  const gaps: string[] = [];
  const patterns = [
    /(?:unknown|unclear|unspecified|missing)\s+([^.]+)/gi,
    /(?:no|without)\s+(?:information|data)\s+(?:on|about)\s+([^.]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && gaps.length < 5) {
        gaps.push(match[1].trim());
      }
    }
  }

  return gaps;
}

/**
 * Generates regeneration guidance for failed scenarios
 */
function generateRegenerationGuidance(
  scenario: ScenarioInput,
  score: ComplexityScore,
): { promptEnhancements: string[] } {
  const enhancements: string[] = [];
  const tierReq = getTierRequirements(scenario.intendedTier);

  // Check specific failures and generate targeted enhancements
  if (!score.validationFlags.criteriaChecks['wood.distinctActs.min']) {
    enhancements.push(
      `Add more calculation steps (need at least ${tierReq.wood.distinctActs.min} distinct steps)`,
    );
  }

  if (!score.validationFlags.criteriaChecks['wood.coordinativeComplexity']) {
    const required = tierReq.wood.coordinativeComplexity.join(' or ');
    enhancements.push(
      `Make dependencies ${required} (${getCoordinativeGuidance(scenario.intendedTier)})`,
    );
  }

  if (!score.validationFlags.criteriaChecks['campbell.multiplePaths']) {
    if (tierReq.campbell.multiplePaths) {
      enhancements.push('Include multiple valid solution approaches or methods');
    } else {
      enhancements.push('Simplify to a single clear solution path');
    }
  }

  if (!score.validationFlags.criteriaChecks['campbell.conflictingInterdependence']) {
    if (tierReq.campbell.conflictingInterdependence) {
      enhancements.push('Add trade-offs or conflicts between objectives');
    } else {
      enhancements.push('Remove trade-offs to simplify the scenario');
    }
  }

  if (!score.validationFlags.criteriaChecks['liuLi.variety.min']) {
    enhancements.push(
      'Include more diverse calculation types (financial, statistical, operational)',
    );
  }

  if (!score.validationFlags.criteriaChecks['interactivity.min']) {
    enhancements.push('Add more dependencies between calculation elements');
  }

  if (!score.validationFlags.criteriaChecks['interactivity.max']) {
    enhancements.push('Reduce dependencies to make calculations more independent');
  }

  // Add tier-specific general guidance
  if (enhancements.length === 0) {
    enhancements.push(getTierGeneralGuidance(scenario.intendedTier));
  }

  return { promptEnhancements: enhancements.slice(0, 5) };
}

/**
 * Gets coordinative complexity guidance per tier
 */
function getCoordinativeGuidance(tier: 'simple' | 'moderate' | 'complex'): string {
  switch (tier) {
    case 'simple':
      return 'calculations should be sequential, output of one feeds the next';
    case 'moderate':
      return 'some calculations should depend on multiple previous results';
    case 'complex':
      return 'create a network of interdependent calculations with feedback';
    default:
      return '';
  }
}

/**
 * Gets general guidance per tier
 */
function getTierGeneralGuidance(tier: 'simple' | 'moderate' | 'complex'): string {
  switch (tier) {
    case 'simple':
      return 'Keep scenario straightforward with 2-3 sequential calculation steps and clear inputs';
    case 'moderate':
      return 'Add moderate complexity with 4-5 interdependent steps and some ambiguity';
    case 'complex':
      return 'Increase complexity with multiple objectives, trade-offs, and networked dependencies';
    default:
      return 'Adjust scenario complexity to match intended tier';
  }
}

/**
 * Gets tier requirements (inline version to avoid circular imports)
 */
function getTierRequirements(tier: 'simple' | 'moderate' | 'complex') {
  const requirements = {
    simple: {
      wood: {
        distinctActs: { min: 2, max: 3 },
        coordinativeComplexity: ['sequential'] as const,
      },
      campbell: {
        multiplePaths: false,
        conflictingInterdependence: false,
      },
    },
    moderate: {
      wood: {
        distinctActs: { min: 4, max: 5 },
        coordinativeComplexity: ['interdependent'] as const,
      },
      campbell: {
        multiplePaths: true,
        conflictingInterdependence: null,
      },
    },
    complex: {
      wood: {
        distinctActs: { min: 5 },
        coordinativeComplexity: ['interdependent', 'networked'] as const,
      },
      campbell: {
        multiplePaths: true,
        conflictingInterdependence: true,
      },
    },
  };

  return requirements[tier];
}

/**
 * Creates an error complexity score for failed validations
 */
function createErrorComplexityScore(scenario: ScenarioInput, error: unknown): ComplexityScore {
  return {
    overallScore: 0,
    predictedTier: 'simple',
    intendedTier: scenario.intendedTier,
    tierMatch: false,
    confidenceScore: 0,
    woodMetrics: {
      distinctActs: 0,
      informationCuesPerAct: 0,
      totalElements: 0,
      coordinativeComplexity: 'sequential',
      dynamicComplexity: 'static',
      componentComplexityScore: 0,
    },
    campbellAttributes: {
      multiplePaths: false,
      pathCount: 0,
      multipleOutcomes: false,
      outcomeCount: 0,
      conflictingInterdependence: false,
      conflicts: [],
      uncertaintyLevel: 'none',
      uncertaintyIndicators: 0,
      campbellType: 0,
    },
    liuLiDimensions: {
      size: 0,
      variety: 0,
      ambiguity: 0,
      relationships: 0,
      variability: 0,
      unreliability: 0,
      novelty: 'routine',
      incongruity: 0,
      actionComplexity: 0,
      timePressure: 'low',
    },
    elementInteractivity: {
      totalElements: 0,
      simultaneousElements: 0,
      interactivityRatio: 0,
      dependencyDepth: 0,
      dependencyEdges: 0,
    },
    calculationBreakdown: {
      woodScore: 0,
      campbellScore: 0,
      liuLiScore: 0,
      interactivityScore: 0,
    },
    validationFlags: {
      meetsMinimumCriteria: false,
      hasRequiredAttributes: false,
      withinTierBounds: false,
      interactivityMatches: false,
      criteriaChecks: {},
    },
    rejectionReasons: [
      `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    ],
    analyzerVersion: '1.0.0',
  };
}

/**
 * Calculates batch validation statistics
 */
function calculateBatchStats(results: ScenarioValidationResult[]): ValidationBatchStats {
  const passed = results.filter((r) => r.isValid).length;
  const failed = results.length - passed;

  // Tier distributions
  const intendedTierDistribution: Record<string, number> = {};
  const predictedTierDistribution: Record<string, number> = {};
  const tierMatchCounts: Record<string, { matched: number; total: number }> = {};

  let totalConfidence = 0;
  let totalValidationTime = 0;
  let totalRegenerationAttempts = 0;

  for (const result of results) {
    const intended = result.complexityScore.intendedTier;
    const predicted = result.complexityScore.predictedTier;

    intendedTierDistribution[intended] = (intendedTierDistribution[intended] || 0) + 1;
    predictedTierDistribution[predicted] = (predictedTierDistribution[predicted] || 0) + 1;

    if (!tierMatchCounts[intended]) {
      tierMatchCounts[intended] = { matched: 0, total: 0 };
    }
    tierMatchCounts[intended].total++;
    if (result.complexityScore.tierMatch) {
      tierMatchCounts[intended].matched++;
    }

    totalConfidence += result.complexityScore.confidenceScore;
    totalValidationTime += result.validationDurationMs;
    totalRegenerationAttempts += result.regenerationAttempts;
  }

  const tierMatchRate: Record<string, number> = {};
  for (const [tier, counts] of Object.entries(tierMatchCounts)) {
    tierMatchRate[tier] = counts.total > 0 ? counts.matched / counts.total : 0;
  }

  return {
    totalValidated: results.length,
    passed,
    failed,
    passRate: results.length > 0 ? passed / results.length : 0,
    avgConfidenceScore: results.length > 0 ? totalConfidence / results.length : 0,
    intendedTierDistribution,
    predictedTierDistribution,
    tierMatchRate,
    avgValidationTimeMs: results.length > 0 ? totalValidationTime / results.length : 0,
    totalRegenerationAttempts,
  };
}

export default {
  validateScenario,
  validateBatch,
};
