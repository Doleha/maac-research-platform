/**
 * Complexity Analyzer Package
 *
 * Academically-grounded complexity tier validation system based on:
 * - Wood (1986) Component Complexity Model
 * - Campbell (1988) Four Sources of Complexity
 * - Liu & Li (2012) Ten-Dimension Framework
 * - Cognitive Load Theory (Element Interactivity)
 *
 * @packageDocumentation
 */

// Re-export types from shared-types
export type {
  WoodMetrics,
  CoordinativeComplexity,
  DynamicComplexity,
  CampbellAttributes,
  UncertaintyLevel,
  LiuLiDimensions,
  NoveltyLevel,
  TimePressure,
  ElementInteractivityAnalysis,
  ComplexityScore,
  CalculationBreakdown,
  ValidationFlags,
  ScenarioValidationResult,
  ValidationBatchStats,
  ComplexityValidationConfig,
  TierThresholds,
  TierRequirements,
  ValidationProgressEvent,
  ValidationProgressCallback,
  ScoringWeights,
} from '@maac/types';

// Export constants from shared-types
export { DEFAULT_COMPLEXITY_CONFIG, TIER_REQUIREMENTS } from '@maac/types';

// Analyzers
export {
  analyzeWoodMetrics,
  calculateWoodScore,
  type WoodAnalysisInput,
} from './analyzers/wood-analyzer';

export {
  analyzeCampbellAttributes,
  calculateCampbellScore,
  getCampbellTypeDescription,
  type CampbellAnalysisInput,
} from './analyzers/campbell-analyzer';

export {
  analyzeLiuLiDimensions,
  calculateLiuLiScore,
  type LiuLiAnalysisInput,
} from './analyzers/liuli-analyzer';

export {
  analyzeElementInteractivity,
  calculateInteractivityScore,
  type ElementInteractivityInput,
} from './analyzers/interactivity-analyzer';

// Scoring
export {
  calculateCompositeScore,
  isValidScenario,
  ANALYZER_VERSION,
  DEFAULT_WEIGHTS,
  type CompositeScoreInput,
} from './scoring/composite-scorer';

// Validation Engine
export {
  validateScenario,
  validateBatch,
  type ScenarioInput,
  type ValidationOptions,
} from './validation-engine';

// Convenience function for quick analysis
export { analyzeComplexity } from './analyze';
