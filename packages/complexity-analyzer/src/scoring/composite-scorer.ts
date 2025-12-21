/**
 * Composite Complexity Scorer
 *
 * Combines all framework analyses into a single weighted composite score
 * and performs tier classification and validation.
 *
 * Scoring formula:
 * CompositeScore = w1×Wood + w2×Campbell + w3×LiuLi + w4×Interactivity
 *
 * Default weights are based on framework coverage and validation importance:
 * - Wood (25%): Foundational task complexity model
 * - Campbell (25%): Structural complexity sources
 * - Liu & Li (30%): Comprehensive 10-dimension coverage
 * - Interactivity (20%): Cognitive load determinant
 */

import type {
  WoodMetrics,
  CampbellAttributes,
  LiuLiDimensions,
  ElementInteractivityAnalysis,
  ComplexityScore,
  CalculationBreakdown,
  ValidationFlags,
  TierRequirements,
  ComplexityValidationConfig,
} from '@maac/types';
import { TIER_REQUIREMENTS } from '@maac/types';

import { calculateWoodScore } from '../analyzers/wood-analyzer';
import { calculateCampbellScore } from '../analyzers/campbell-analyzer';
import { calculateLiuLiScore } from '../analyzers/liuli-analyzer';
import { calculateInteractivityScore } from '../analyzers/interactivity-analyzer';

/**
 * Analyzer version for reproducibility
 */
export const ANALYZER_VERSION = '1.0.0';

/**
 * Default scoring weights
 */
export const DEFAULT_WEIGHTS = {
  wood: 0.25,
  campbell: 0.25,
  liuLi: 0.3,
  interactivity: 0.2,
};

/**
 * Input for composite scoring
 */
export interface CompositeScoreInput {
  /** Intended complexity tier */
  intendedTier: 'simple' | 'moderate' | 'complex';

  /** Wood (1986) metrics */
  woodMetrics: WoodMetrics;

  /** Campbell (1988) attributes */
  campbellAttributes: CampbellAttributes;

  /** Liu & Li (2012) dimensions */
  liuLiDimensions: LiuLiDimensions;

  /** Element interactivity analysis */
  elementInteractivity: ElementInteractivityAnalysis;

  /** Validation configuration */
  config?: ComplexityValidationConfig;

  /** Custom weights (optional) */
  weights?: typeof DEFAULT_WEIGHTS;
}

/**
 * Calculates the composite complexity score
 */
export function calculateCompositeScore(input: CompositeScoreInput): ComplexityScore {
  const {
    intendedTier,
    woodMetrics,
    campbellAttributes,
    liuLiDimensions,
    elementInteractivity,
    config,
    weights = DEFAULT_WEIGHTS,
  } = input;

  // Calculate individual framework scores
  const woodScore = calculateWoodScore(woodMetrics);
  const campbellScore = calculateCampbellScore(campbellAttributes);
  const liuLiScore = calculateLiuLiScore(liuLiDimensions);
  const interactivityScore = calculateInteractivityScore(elementInteractivity);

  // Create calculation breakdown
  const calculationBreakdown: CalculationBreakdown = {
    woodScore,
    campbellScore,
    liuLiScore,
    interactivityScore,
  };

  // Calculate weighted composite score
  const overallScore =
    woodScore * weights.wood +
    campbellScore * weights.campbell +
    liuLiScore * weights.liuLi +
    interactivityScore * weights.interactivity;

  // Normalize to 0-100 scale (roughly)
  const normalizedScore = Math.round(overallScore * 10) / 10;

  // Determine predicted tier based on score
  const predictedTier = determineTier(normalizedScore, config);

  // Check tier match
  const tierMatch = predictedTier === intendedTier;

  // Calculate confidence score
  const confidenceScore = calculateConfidence(
    normalizedScore,
    predictedTier,
    woodMetrics,
    campbellAttributes,
    liuLiDimensions,
    elementInteractivity,
    config,
  );

  // Perform validation checks
  const validationFlags = validateTierRequirements(
    intendedTier,
    woodMetrics,
    campbellAttributes,
    liuLiDimensions,
    elementInteractivity,
    normalizedScore,
    config,
  );

  // Generate rejection reasons
  const rejectionReasons = generateRejectionReasons(
    intendedTier,
    predictedTier,
    validationFlags,
    normalizedScore,
    config,
  );

  return {
    overallScore: normalizedScore,
    predictedTier,
    intendedTier,
    tierMatch,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    woodMetrics,
    campbellAttributes,
    liuLiDimensions,
    elementInteractivity,
    calculationBreakdown,
    validationFlags,
    rejectionReasons,
    analyzerVersion: ANALYZER_VERSION,
  };
}

/**
 * Determines the tier based on composite score
 */
function determineTier(
  score: number,
  config?: ComplexityValidationConfig,
): 'simple' | 'moderate' | 'complex' {
  const thresholds = config?.tierThresholds ?? {
    simple: { min: 0, max: 15 },
    moderate: { min: 15, max: 30 },
    complex: { min: 30, max: Infinity },
  };

  if (score < thresholds.moderate.min) {
    return 'simple';
  }
  if (score < thresholds.complex.min) {
    return 'moderate';
  }
  return 'complex';
}

/**
 * Calculates confidence score based on how well metrics align with tier
 */
function calculateConfidence(
  score: number,
  predictedTier: 'simple' | 'moderate' | 'complex',
  woodMetrics: WoodMetrics,
  campbellAttributes: CampbellAttributes,
  liuLiDimensions: LiuLiDimensions,
  elementInteractivity: ElementInteractivityAnalysis,
  _config?: ComplexityValidationConfig,
): number {
  const tierReq = TIER_REQUIREMENTS[predictedTier];
  let confidenceFactors = 0;
  let totalFactors = 0;

  // Wood metrics alignment
  totalFactors += 4;
  if (woodMetrics.distinctActs >= tierReq.wood.distinctActs.min) confidenceFactors++;
  if (!tierReq.wood.distinctActs.max || woodMetrics.distinctActs <= tierReq.wood.distinctActs.max)
    confidenceFactors++;
  if (tierReq.wood.coordinativeComplexity.includes(woodMetrics.coordinativeComplexity))
    confidenceFactors++;
  if (tierReq.wood.dynamicComplexity.includes(woodMetrics.dynamicComplexity)) confidenceFactors++;

  // Campbell attributes alignment
  totalFactors += 4;
  if (
    tierReq.campbell.multiplePaths === null ||
    campbellAttributes.multiplePaths === tierReq.campbell.multiplePaths
  )
    confidenceFactors++;
  if (
    tierReq.campbell.multipleOutcomes === null ||
    campbellAttributes.multipleOutcomes === tierReq.campbell.multipleOutcomes
  )
    confidenceFactors++;
  if (
    tierReq.campbell.conflictingInterdependence === null ||
    campbellAttributes.conflictingInterdependence === tierReq.campbell.conflictingInterdependence
  )
    confidenceFactors++;
  if (tierReq.campbell.uncertaintyLevel.includes(campbellAttributes.uncertaintyLevel))
    confidenceFactors++;

  // Liu & Li dimensions alignment
  totalFactors += 4;
  if (!tierReq.liuLi.variety.min || liuLiDimensions.variety >= tierReq.liuLi.variety.min)
    confidenceFactors++;
  if (!tierReq.liuLi.variety.max || liuLiDimensions.variety <= tierReq.liuLi.variety.max)
    confidenceFactors++;
  if (tierReq.liuLi.novelty.includes(liuLiDimensions.novelty)) confidenceFactors++;
  if (
    !tierReq.liuLi.relationships.min ||
    liuLiDimensions.relationships >= tierReq.liuLi.relationships.min
  )
    confidenceFactors++;

  // Element interactivity alignment
  totalFactors += 2;
  if (
    !tierReq.interactivity.min ||
    elementInteractivity.interactivityRatio >= tierReq.interactivity.min
  )
    confidenceFactors++;
  if (
    !tierReq.interactivity.max ||
    elementInteractivity.interactivityRatio <= tierReq.interactivity.max
  )
    confidenceFactors++;

  // Score within tier bounds
  totalFactors += 1;
  if (score >= tierReq.scoreRange.min && score <= tierReq.scoreRange.max) {
    confidenceFactors++;
  }

  // Calculate base confidence
  let confidence = confidenceFactors / totalFactors;

  // Boost confidence if score is solidly within tier bounds
  const tierWidth = tierReq.scoreRange.max - tierReq.scoreRange.min;
  if (tierWidth !== Infinity) {
    const distanceFromBoundary = Math.min(
      score - tierReq.scoreRange.min,
      tierReq.scoreRange.max - score,
    );
    const marginBoost = Math.min(distanceFromBoundary / (tierWidth * 0.3), 0.1);
    confidence += marginBoost;
  }

  return Math.min(confidence, 1);
}

/**
 * Validates tier requirements
 */
function validateTierRequirements(
  intendedTier: 'simple' | 'moderate' | 'complex',
  woodMetrics: WoodMetrics,
  campbellAttributes: CampbellAttributes,
  liuLiDimensions: LiuLiDimensions,
  elementInteractivity: ElementInteractivityAnalysis,
  score: number,
  _config?: ComplexityValidationConfig,
): ValidationFlags {
  const tierReq = TIER_REQUIREMENTS[intendedTier];
  const criteriaChecks: Record<string, boolean> = {};

  // Wood checks
  criteriaChecks['wood.distinctActs.min'] =
    woodMetrics.distinctActs >= tierReq.wood.distinctActs.min;
  criteriaChecks['wood.distinctActs.max'] =
    !tierReq.wood.distinctActs.max || woodMetrics.distinctActs <= tierReq.wood.distinctActs.max;
  criteriaChecks['wood.coordinativeComplexity'] = tierReq.wood.coordinativeComplexity.includes(
    woodMetrics.coordinativeComplexity,
  );
  criteriaChecks['wood.dynamicComplexity'] = tierReq.wood.dynamicComplexity.includes(
    woodMetrics.dynamicComplexity,
  );

  // Campbell checks (null means don't care)
  criteriaChecks['campbell.multiplePaths'] =
    tierReq.campbell.multiplePaths === null ||
    campbellAttributes.multiplePaths === tierReq.campbell.multiplePaths;
  criteriaChecks['campbell.multipleOutcomes'] =
    tierReq.campbell.multipleOutcomes === null ||
    campbellAttributes.multipleOutcomes === tierReq.campbell.multipleOutcomes;
  criteriaChecks['campbell.conflictingInterdependence'] =
    tierReq.campbell.conflictingInterdependence === null ||
    campbellAttributes.conflictingInterdependence === tierReq.campbell.conflictingInterdependence;
  criteriaChecks['campbell.uncertaintyLevel'] = tierReq.campbell.uncertaintyLevel.includes(
    campbellAttributes.uncertaintyLevel,
  );

  // Liu & Li checks
  criteriaChecks['liuLi.variety.min'] =
    !tierReq.liuLi.variety.min || liuLiDimensions.variety >= tierReq.liuLi.variety.min;
  criteriaChecks['liuLi.variety.max'] =
    !tierReq.liuLi.variety.max || liuLiDimensions.variety <= tierReq.liuLi.variety.max;
  criteriaChecks['liuLi.novelty'] = tierReq.liuLi.novelty.includes(liuLiDimensions.novelty);
  criteriaChecks['liuLi.relationships.min'] =
    !tierReq.liuLi.relationships.min ||
    liuLiDimensions.relationships >= tierReq.liuLi.relationships.min;
  criteriaChecks['liuLi.relationships.max'] =
    !tierReq.liuLi.relationships.max ||
    liuLiDimensions.relationships <= tierReq.liuLi.relationships.max;

  // Element interactivity checks
  criteriaChecks['interactivity.min'] =
    !tierReq.interactivity.min ||
    elementInteractivity.interactivityRatio >= tierReq.interactivity.min;
  criteriaChecks['interactivity.max'] =
    !tierReq.interactivity.max ||
    elementInteractivity.interactivityRatio <= tierReq.interactivity.max;

  // Score bounds check
  criteriaChecks['score.min'] = score >= tierReq.scoreRange.min;
  criteriaChecks['score.max'] = score <= tierReq.scoreRange.max;

  // Aggregate flags
  const passedCriteria = Object.values(criteriaChecks).filter((v) => v).length;
  const totalCriteria = Object.keys(criteriaChecks).length;

  const meetsMinimumCriteria = passedCriteria >= totalCriteria * 0.6; // At least 60% criteria met
  const hasRequiredAttributes = checkRequiredAttributes(
    intendedTier,
    campbellAttributes,
    liuLiDimensions,
  );
  const withinTierBounds = criteriaChecks['score.min'] && criteriaChecks['score.max'];
  const interactivityMatches =
    criteriaChecks['interactivity.min'] && criteriaChecks['interactivity.max'];

  return {
    meetsMinimumCriteria,
    hasRequiredAttributes,
    withinTierBounds,
    interactivityMatches,
    criteriaChecks,
  };
}

/**
 * Checks if required attributes for tier are present
 */
function checkRequiredAttributes(
  tier: 'simple' | 'moderate' | 'complex',
  campbellAttributes: CampbellAttributes,
  _liuLiDimensions: LiuLiDimensions,
): boolean {
  switch (tier) {
    case 'simple':
      // Simple should NOT have multiple paths/outcomes/conflicts
      return (
        !campbellAttributes.multiplePaths &&
        !campbellAttributes.multipleOutcomes &&
        !campbellAttributes.conflictingInterdependence
      );

    case 'moderate':
      // Moderate should have at least one complexity attribute
      return (
        campbellAttributes.multiplePaths ||
        campbellAttributes.multipleOutcomes ||
        campbellAttributes.uncertaintyLevel !== 'none'
      );

    case 'complex':
      // Complex must have multiple complexity attributes
      const complexityCount = [
        campbellAttributes.multiplePaths,
        campbellAttributes.multipleOutcomes,
        campbellAttributes.conflictingInterdependence,
        campbellAttributes.uncertaintyLevel !== 'none',
      ].filter(Boolean).length;
      return complexityCount >= 2;

    default:
      return true;
  }
}

/**
 * Generates human-readable rejection reasons
 */
function generateRejectionReasons(
  intendedTier: 'simple' | 'moderate' | 'complex',
  predictedTier: 'simple' | 'moderate' | 'complex',
  validationFlags: ValidationFlags,
  score: number,
  _config?: ComplexityValidationConfig,
): string[] {
  const reasons: string[] = [];
  const tierReq = TIER_REQUIREMENTS[intendedTier];

  // Tier mismatch
  if (intendedTier !== predictedTier) {
    reasons.push(
      `Tier mismatch: intended "${intendedTier}" but analysis predicts "${predictedTier}" (score: ${score.toFixed(1)})`,
    );
  }

  // Check specific criteria failures
  for (const [criterion, passed] of Object.entries(validationFlags.criteriaChecks)) {
    if (!passed) {
      reasons.push(formatCriterionFailure(criterion, tierReq, intendedTier));
    }
  }

  // Add flag-level reasons
  if (!validationFlags.meetsMinimumCriteria) {
    reasons.push('Scenario does not meet minimum criteria threshold (60% of tier requirements)');
  }

  if (!validationFlags.hasRequiredAttributes) {
    reasons.push(`Missing required attributes for ${intendedTier} tier`);
  }

  if (!validationFlags.interactivityMatches) {
    reasons.push(`Element interactivity does not match ${intendedTier} tier expectations`);
  }

  return reasons;
}

/**
 * Formats a criterion failure into a human-readable message
 */
function formatCriterionFailure(
  criterion: string,
  tierReq: TierRequirements,
  tier: 'simple' | 'moderate' | 'complex',
): string {
  const messages: Record<string, string> = {
    'wood.distinctActs.min': `Requires at least ${tierReq.wood.distinctActs.min} distinct calculation steps for ${tier} tier`,
    'wood.distinctActs.max': `Exceeds maximum ${tierReq.wood.distinctActs.max} distinct steps for ${tier} tier`,
    'wood.coordinativeComplexity': `Coordinative complexity should be ${tierReq.wood.coordinativeComplexity.join(' or ')} for ${tier} tier`,
    'wood.dynamicComplexity': `Dynamic complexity should be ${tierReq.wood.dynamicComplexity.join(' or ')} for ${tier} tier`,
    'campbell.multiplePaths': `Multiple solution paths ${tierReq.campbell.multiplePaths ? 'required' : 'not expected'} for ${tier} tier`,
    'campbell.multipleOutcomes': `Multiple outcomes ${tierReq.campbell.multipleOutcomes ? 'required' : 'not expected'} for ${tier} tier`,
    'campbell.conflictingInterdependence': `Conflicting interdependence ${tierReq.campbell.conflictingInterdependence ? 'required' : 'not expected'} for ${tier} tier`,
    'campbell.uncertaintyLevel': `Uncertainty level should be ${tierReq.campbell.uncertaintyLevel.join(' or ')} for ${tier} tier`,
    'liuLi.variety.min': `Variety score too low for ${tier} tier`,
    'liuLi.variety.max': `Variety score too high for ${tier} tier`,
    'liuLi.novelty': `Novelty level should be ${tierReq.liuLi.novelty.join(' or ')} for ${tier} tier`,
    'liuLi.relationships.min': `Relationship score too low for ${tier} tier`,
    'liuLi.relationships.max': `Relationship score too high for ${tier} tier`,
    'interactivity.min': `Element interactivity ratio too low for ${tier} tier`,
    'interactivity.max': `Element interactivity ratio too high for ${tier} tier`,
    'score.min': `Composite score below minimum threshold for ${tier} tier`,
    'score.max': `Composite score above maximum threshold for ${tier} tier`,
  };

  return messages[criterion] || `Criterion "${criterion}" not met for ${tier} tier`;
}

/**
 * Checks if a scenario passes validation
 */
export function isValidScenario(
  score: ComplexityScore,
  config?: ComplexityValidationConfig,
): boolean {
  const strictMode = config?.strictMode ?? false;
  const allowedDeviation = config?.allowedTierDeviation ?? 1;
  const minimumConfidence = config?.minimumConfidence ?? 0.6;

  // Check confidence threshold
  if (score.confidenceScore < minimumConfidence) {
    return false;
  }

  // Check tier match
  if (strictMode) {
    return score.tierMatch;
  }

  // Allow tier deviation
  if (allowedDeviation === 0) {
    return score.tierMatch;
  }

  // Check if within allowed deviation
  const tierOrder = ['simple', 'moderate', 'complex'];
  const intendedIndex = tierOrder.indexOf(score.intendedTier);
  const predictedIndex = tierOrder.indexOf(score.predictedTier);

  return Math.abs(intendedIndex - predictedIndex) <= allowedDeviation;
}

export default {
  calculateCompositeScore,
  isValidScenario,
  ANALYZER_VERSION,
  DEFAULT_WEIGHTS,
};
