/**
 * Complexity Metrics Type Definitions
 *
 * Academically grounded type definitions based on three peer-reviewed frameworks:
 * 1. Wood (1986) - Component Complexity Model
 * 2. Campbell (1988) - Four Sources of Complexity
 * 3. Liu & Li (2012) - Ten-Dimension Framework
 *
 * References:
 * - Wood, R. E. (1986). Task complexity: Definition of the construct. OBHDP, 37(1), 60-82.
 * - Campbell, D. J. (1988). Task complexity: A review and analysis. AMR, 13(1), 40-52.
 * - Liu, P., & Li, Z. (2012). Task complexity: A review and conceptualization framework. IJIE, 42(6), 553-568.
 * - Chen, O., Paas, F., & Sweller, J. (2023). A Cognitive Load Theory Approach to Defining and Measuring Task Complexity. Ed Psych Review.
 */

// ============================================================================
// WOOD (1986) - COMPONENT COMPLEXITY MODEL
// ============================================================================

/**
 * Coordinative complexity classification based on dependency structure
 */
export type CoordinativeComplexity = 'sequential' | 'interdependent' | 'networked';

/**
 * Dynamic complexity classification based on state changes
 */
export type DynamicComplexity = 'static' | 'low' | 'high';

/**
 * Wood's (1986) tripartite model of task complexity
 *
 * Component complexity = Number of distinct acts × information cues per act
 * Coordinative complexity = Relationships between inputs and outputs
 * Dynamic complexity = Changes in states affecting the above
 */
export interface WoodMetrics {
  /** Number of distinct calculation/analysis steps required */
  distinctActs: number;

  /** Average number of information cues processed per act */
  informationCuesPerAct: number;

  /** Total elements = distinctActs × informationCuesPerAct */
  totalElements: number;

  /** Classification of dependency relationships between steps */
  coordinativeComplexity: CoordinativeComplexity;

  /** Classification of state changes and uncertainty */
  dynamicComplexity: DynamicComplexity;

  /** Component complexity score = distinctActs × informationCuesPerAct */
  componentComplexityScore: number;
}

// ============================================================================
// CAMPBELL (1988) - FOUR SOURCES OF COMPLEXITY
// ============================================================================

/**
 * Uncertainty level classification
 */
export type UncertaintyLevel = 'none' | 'bounded' | 'high';

/**
 * Campbell's (1988) four fundamental sources of task complexity:
 * 1. Multiple paths to tasks
 * 2. Multiple desired outcomes
 * 3. Conflicting interdependence among paths and outcomes
 * 4. Uncertain/probabilistic links between paths and outcomes
 */
export interface CampbellAttributes {
  /** Whether multiple valid solution approaches exist */
  multiplePaths: boolean;

  /** Count of distinct valid paths (if multiplePaths is true) */
  pathCount: number;

  /** Whether multiple desired outcomes must be achieved */
  multipleOutcomes: boolean;

  /** Count of competing objectives (if multipleOutcomes is true) */
  outcomeCount: number;

  /** Whether trade-offs between paths/outcomes exist */
  conflictingInterdependence: boolean;

  /** List of identified trade-offs/conflicts */
  conflicts: string[];

  /** Level of uncertainty in information or outcomes */
  uncertaintyLevel: UncertaintyLevel;

  /** Count of information gaps or ambiguous requirements */
  uncertaintyIndicators: number;

  /** Binary encoding of four attributes for Campbell's 16-type taxonomy */
  campbellType: number; // 0-15 based on binary (paths, outcomes, conflict, uncertainty)
}

// ============================================================================
// LIU & LI (2012) - TEN-DIMENSION FRAMEWORK
// ============================================================================

/**
 * Novelty classification
 */
export type NoveltyLevel = 'routine' | 'semi-familiar' | 'novel';

/**
 * Time pressure classification
 */
export type TimePressure = 'low' | 'moderate' | 'high';

/**
 * Liu & Li's (2012) ten validated dimensions of task complexity
 */
export interface LiuLiDimensions {
  /** Size: Number of elements/components in the task */
  size: number;

  /** Variety: Heterogeneity of elements (0-1 scale) */
  variety: number;

  /** Ambiguity: Clarity of task requirements (0-1, where 1 = highly ambiguous) */
  ambiguity: number;

  /** Relationships: Element interactivity score (0-1 scale) */
  relationships: number;

  /** Variability: Rate of change during task (0-1 scale) */
  variability: number;

  /** Unreliability: Uncertainty in information (0-1 scale) */
  unreliability: number;

  /** Novelty: Familiarity with task type */
  novelty: NoveltyLevel;

  /** Incongruity: Conflicting requirements (0-1 scale) */
  incongruity: number;

  /** Action complexity: Weighted count of actions required */
  actionComplexity: number;

  /** Time pressure: Temporal constraints level */
  timePressure: TimePressure;
}

// ============================================================================
// ELEMENT INTERACTIVITY (COGNITIVE LOAD THEORY)
// ============================================================================

/**
 * Element interactivity analysis based on Cognitive Load Theory
 * (Sweller et al., 1998; Chen et al., 2023)
 */
export interface ElementInteractivityAnalysis {
  /** Total elements in the task */
  totalElements: number;

  /** Elements requiring simultaneous processing */
  simultaneousElements: number;

  /** Element interactivity ratio (0-1) */
  interactivityRatio: number;

  /** Dependency graph depth (longest chain) */
  dependencyDepth: number;

  /** Number of dependency edges */
  dependencyEdges: number;
}

// ============================================================================
// COMPOSITE COMPLEXITY SCORE
// ============================================================================

/**
 * Tier thresholds for classification
 */
export interface TierThresholds {
  simple: { min: number; max: number };
  moderate: { min: number; max: number };
  complex: { min: number; max: number };
}

/**
 * Score breakdown by framework
 */
export interface CalculationBreakdown {
  /** Contribution from Wood metrics */
  woodScore: number;

  /** Contribution from Campbell attributes */
  campbellScore: number;

  /** Contribution from Liu & Li dimensions */
  liuLiScore: number;

  /** Contribution from element interactivity */
  interactivityScore: number;
}

/**
 * Validation flags for tier requirements
 */
export interface ValidationFlags {
  /** Whether scenario meets minimum criteria for any tier */
  meetsMinimumCriteria: boolean;

  /** Whether required attributes for intended tier are present */
  hasRequiredAttributes: boolean;

  /** Whether score falls within intended tier bounds */
  withinTierBounds: boolean;

  /** Whether element interactivity matches tier expectations */
  interactivityMatches: boolean;

  /** Individual criterion checks */
  criteriaChecks: Record<string, boolean>;
}

/**
 * Comprehensive complexity score combining all frameworks
 */
export interface ComplexityScore {
  /** Weighted composite score across all frameworks */
  overallScore: number;

  /** Tier predicted by the complexity analyzer */
  predictedTier: 'simple' | 'moderate' | 'complex';

  /** Tier intended during scenario generation */
  intendedTier: 'simple' | 'moderate' | 'complex';

  /** Whether predicted tier matches intended tier */
  tierMatch: boolean;

  /** Confidence in the prediction (0-1) */
  confidenceScore: number;

  /** Wood (1986) metrics */
  woodMetrics: WoodMetrics;

  /** Campbell (1988) attributes */
  campbellAttributes: CampbellAttributes;

  /** Liu & Li (2012) dimensions */
  liuLiDimensions: LiuLiDimensions;

  /** Element interactivity analysis */
  elementInteractivity: ElementInteractivityAnalysis;

  /** Score breakdown by framework */
  calculationBreakdown: CalculationBreakdown;

  /** Validation flags for tier requirements */
  validationFlags: ValidationFlags;

  /** Human-readable rejection reasons if validation failed */
  rejectionReasons: string[];

  /** Analyzer version for reproducibility */
  analyzerVersion: string;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

/**
 * Validation result for a single scenario
 */
export interface ScenarioValidationResult {
  /** Unique scenario identifier */
  scenarioId: string;

  /** Whether scenario passed validation */
  isValid: boolean;

  /** Full complexity score breakdown */
  complexityScore: ComplexityScore;

  /** Timestamp of validation */
  validationTimestamp: Date;

  /** Time taken for validation in milliseconds */
  validationDurationMs: number;

  /** Whether scenario should be regenerated */
  shouldRegenerate: boolean;

  /** Reason for regeneration (if applicable) */
  regenerationReason?: string;

  /** Prompt enhancement suggestions for regeneration */
  promptEnhancements?: string[];

  /** Number of regeneration attempts so far */
  regenerationAttempts: number;
}

/**
 * Batch validation statistics
 */
export interface ValidationBatchStats {
  /** Total scenarios validated */
  totalValidated: number;

  /** Scenarios that passed validation */
  passed: number;

  /** Scenarios that failed validation */
  failed: number;

  /** Pass rate (0-1) */
  passRate: number;

  /** Average confidence score */
  avgConfidenceScore: number;

  /** Tier distribution (intended) */
  intendedTierDistribution: Record<string, number>;

  /** Tier distribution (predicted) */
  predictedTierDistribution: Record<string, number>;

  /** Tier match rate per tier */
  tierMatchRate: Record<string, number>;

  /** Average validation time in milliseconds */
  avgValidationTimeMs: number;

  /** Total regeneration attempts */
  totalRegenerationAttempts: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Scoring weights for composite calculation
 */
export interface ScoringWeights {
  /** Weight for Wood distinct acts */
  woodDistinctActs: number;

  /** Weight for Wood information cues */
  woodInformationCues: number;

  /** Weight for Wood coordinative complexity */
  woodCoordinative: number;

  /** Weight for each true Campbell attribute */
  campbellAttribute: number;

  /** Weight for Liu & Li variety */
  liuLiVariety: number;

  /** Weight for Liu & Li ambiguity */
  liuLiAmbiguity: number;

  /** Weight for element interactivity (relationships) */
  elementInteractivity: number;
}

/**
 * Validation configuration
 */
export interface ComplexityValidationConfig {
  /** Tier score thresholds */
  tierThresholds: TierThresholds;

  /** Element interactivity thresholds per tier */
  interactivityThresholds: {
    simple: { max: number };
    moderate: { min: number; max: number };
    complex: { min: number };
  };

  /** Scoring weights */
  weights: ScoringWeights;

  /** Require exact tier match vs allow ±1 tier */
  strictMode: boolean;

  /** Allowed tier deviation (0 = exact, 1 = ±1 tier) */
  allowedTierDeviation: 0 | 1;

  /** Maximum regeneration attempts before failure */
  maxRegenerationAttempts: number;

  /** Validation timeout in milliseconds */
  validationTimeoutMs: number;

  /** Minimum confidence score to accept */
  minimumConfidence: number;
}

/**
 * Default validation configuration
 */
export const DEFAULT_COMPLEXITY_CONFIG: ComplexityValidationConfig = {
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
    woodCoordinative: 3.0, // networked = 5, interdependent = 3, sequential = 1
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
};

// ============================================================================
// TIER-SPECIFIC REQUIREMENTS
// ============================================================================

/**
 * Tier-specific requirements from the academic frameworks
 */
export interface TierRequirements {
  tier: 'simple' | 'moderate' | 'complex';

  /** Wood (1986) requirements */
  wood: {
    distinctActs: { min: number; max?: number };
    informationCuesPerAct: { min: number; max?: number };
    totalElements: { min?: number; max?: number };
    coordinativeComplexity: CoordinativeComplexity[];
    dynamicComplexity: DynamicComplexity[];
  };

  /** Campbell (1988) requirements */
  campbell: {
    multiplePaths: boolean | null; // null = don't care
    pathCount: { min?: number; max?: number };
    multipleOutcomes: boolean | null;
    conflictingInterdependence: boolean | null;
    uncertaintyLevel: UncertaintyLevel[];
  };

  /** Liu & Li (2012) requirements */
  liuLi: {
    variety: { min?: number; max?: number };
    ambiguity: { min?: number; max?: number };
    novelty: NoveltyLevel[];
    relationships: { min?: number; max?: number };
  };

  /** Element interactivity requirements */
  interactivity: { min?: number; max?: number };

  /** Composite score range */
  scoreRange: { min: number; max: number };
}

/**
 * Pre-defined tier requirements based on academic frameworks
 */
export const TIER_REQUIREMENTS: Record<'simple' | 'moderate' | 'complex', TierRequirements> = {
  simple: {
    tier: 'simple',
    wood: {
      distinctActs: { min: 2, max: 3 },
      informationCuesPerAct: { min: 1, max: 2 },
      totalElements: { max: 6 },
      coordinativeComplexity: ['sequential'],
      dynamicComplexity: ['static'],
    },
    campbell: {
      multiplePaths: false,
      pathCount: { max: 1 },
      multipleOutcomes: false,
      conflictingInterdependence: false,
      uncertaintyLevel: ['none'],
    },
    liuLi: {
      variety: { max: 0.3 },
      ambiguity: { max: 0.2 },
      novelty: ['routine'],
      relationships: { max: 0.2 },
    },
    interactivity: { max: 0.2 },
    scoreRange: { min: 0, max: 15 },
  },
  moderate: {
    tier: 'moderate',
    wood: {
      distinctActs: { min: 4, max: 5 },
      informationCuesPerAct: { min: 2, max: 3 },
      totalElements: { min: 8, max: 15 },
      coordinativeComplexity: ['interdependent'],
      dynamicComplexity: ['static', 'low'],
    },
    campbell: {
      multiplePaths: true,
      pathCount: { min: 2, max: 3 },
      multipleOutcomes: null, // Can be true or false
      conflictingInterdependence: null, // Partial is expected
      uncertaintyLevel: ['none', 'bounded'],
    },
    liuLi: {
      variety: { min: 0.3, max: 0.6 },
      ambiguity: { min: 0.2, max: 0.5 },
      novelty: ['routine', 'semi-familiar'],
      relationships: { min: 0.2, max: 0.5 },
    },
    interactivity: { min: 0.2, max: 0.5 },
    scoreRange: { min: 15, max: 30 },
  },
  complex: {
    tier: 'complex',
    wood: {
      distinctActs: { min: 5 },
      informationCuesPerAct: { min: 3 },
      totalElements: { min: 15 },
      coordinativeComplexity: ['interdependent', 'networked'],
      dynamicComplexity: ['low', 'high'],
    },
    campbell: {
      multiplePaths: true,
      pathCount: { min: 3 },
      multipleOutcomes: true,
      conflictingInterdependence: true,
      uncertaintyLevel: ['bounded', 'high'],
    },
    liuLi: {
      variety: { min: 0.6 },
      ambiguity: { min: 0.5 },
      novelty: ['semi-familiar', 'novel'],
      relationships: { min: 0.5 },
    },
    interactivity: { min: 0.5 },
    scoreRange: { min: 30, max: Infinity },
  },
};

// ============================================================================
// PROGRESS EVENTS
// ============================================================================

/**
 * Validation progress event for real-time feedback
 */
export interface ValidationProgressEvent {
  type:
    | 'validation_start'
    | 'validation_progress'
    | 'validation_complete'
    | 'regeneration_start'
    | 'regeneration_complete'
    | 'batch_complete';

  /** Current item being processed */
  current: number;

  /** Total items to process */
  total: number;

  /** Progress percentage */
  percentage: number;

  /** Scenario being validated */
  scenarioId?: string;

  /** Validation result summary */
  validationResult?: {
    isValid: boolean;
    tierMatch: boolean;
    predictedTier: string;
    intendedTier: string;
    confidenceScore: number;
    overallScore: number;
  };

  /** Batch statistics (for batch_complete) */
  batchStats?: ValidationBatchStats;

  /** Message for display */
  message: string;

  /** Elapsed time in milliseconds */
  elapsedMs?: number;
}

/**
 * Validation progress callback type
 */
export type ValidationProgressCallback = (event: ValidationProgressEvent) => void;
