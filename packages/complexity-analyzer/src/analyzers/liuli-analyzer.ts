/**
 * Liu & Li (2012) Ten-Dimension Framework Analyzer
 *
 * Implements Liu & Li's comprehensive ten-dimension framework for
 * task complexity assessment:
 * 1. Size - Number of elements/components
 * 2. Variety - Heterogeneity of elements
 * 3. Ambiguity - Clarity of requirements
 * 4. Relationships - Element interactivity
 * 5. Variability - Rate of change
 * 6. Unreliability - Information uncertainty
 * 7. Novelty - Task familiarity
 * 8. Incongruity - Conflicting requirements
 * 9. Action Complexity - Weighted action count
 * 10. Time Pressure - Temporal constraints
 *
 * Reference:
 * Liu, P., & Li, Z. (2012). Task complexity: A review and conceptualization framework.
 * International Journal of Industrial Ergonomics, 42(6), 553-568.
 */

import type { LiuLiDimensions, NoveltyLevel, TimePressure } from '@maac/types';

/**
 * Input structure for Liu & Li analysis
 */
export interface LiuLiAnalysisInput {
  /** Text content to analyze (scenario description) */
  content: string;

  /** Number of entities/components identified */
  entityCount?: number;

  /** Types of entities (for variety calculation) */
  entityTypes?: string[];

  /** Known variables and their types */
  variables?: Array<{ name: string; type: string }>;

  /** Explicitly unclear requirements */
  ambiguousRequirements?: string[];

  /** Identified relationships between entities */
  relationships?: Array<{ from: string; to: string; type: string }>;

  /** Whether scenario involves changing state */
  involvesChangingState?: boolean;

  /** Missing or uncertain information */
  missingInformation?: string[];

  /** Whether this is a novel/unfamiliar task type */
  isNovel?: boolean;

  /** Domain for novelty assessment */
  domain?: string;

  /** Time constraints mentioned */
  timeConstraints?: string;

  /** Calculation steps with weights */
  calculationSteps?: Array<{ step: string; weight?: number }>;
}

/**
 * Patterns for variety detection (different types of calculations)
 */
const VARIETY_PATTERNS = {
  financial: [
    /(?:revenue|cost|expense|profit|margin|income|tax)/gi,
    /(?:interest|depreciation|amortization|investment)/gi,
    /(?:cash\s*flow|NPV|IRR|ROI|WACC)/gi,
    /(?:budget|forecast|variance)/gi,
  ],
  accounting: [
    /(?:journal\s*entry|ledger|balance\s*sheet)/gi,
    /(?:debit|credit|accounts?\s*(?:receivable|payable))/gi,
    /(?:inventory|FIFO|LIFO|weighted\s*average)/gi,
    /(?:accrual|deferral|prepaid)/gi,
  ],
  statistical: [
    /(?:mean|median|mode|standard\s*deviation|variance)/gi,
    /(?:regression|correlation|hypothesis|significance)/gi,
    /(?:confidence\s*interval|p-value|t-test|ANOVA)/gi,
    /(?:distribution|probability|sample\s*size)/gi,
  ],
  operational: [
    /(?:capacity|throughput|utilization|efficiency)/gi,
    /(?:lead\s*time|cycle\s*time|bottleneck)/gi,
    /(?:EOQ|reorder\s*point|safety\s*stock)/gi,
    /(?:scheduling|routing|sequencing)/gi,
  ],
  valuation: [
    /(?:fair\s*value|book\s*value|market\s*value)/gi,
    /(?:discount(?:ed)?|present\s*value|future\s*value)/gi,
    /(?:multiple|comparable|ratio\s*analysis)/gi,
  ],
};

/**
 * Patterns for ambiguity detection
 */
const AMBIGUITY_PATTERNS = [
  /(?:unclear|ambiguous|vague|unspecified)/gi,
  /(?:assume|assuming|assumption)/gi,
  /(?:may|might|could)\s+(?:be|mean|require)/gi,
  /(?:not\s+specified|no\s+information)/gi,
  /(?:interpret|interpretation)/gi,
  /(?:depends\s+on|depending\s+on)/gi,
  /what\s+(?:if|should|does)/gi,
  /(?:either|or)\s+.*(?:or)/gi,
  /(?:professional\s+judgment|management\s+discretion)/gi,
];

/**
 * Patterns for variability/change detection
 */
const VARIABILITY_PATTERNS = [
  /(?:changes?|changing|changed)\s+(?:in|to|from)/gi,
  /(?:fluctuat|vari(?:es|able|ation)|volatil)/gi,
  /(?:adjust(?:ed|ment)|revision|update)/gi,
  /(?:dynamic|evolving|shifting)/gi,
  /(?:over\s+time|period\s+to\s+period|year\s+over\s+year)/gi,
  /(?:increase|decrease|grow|decline|rise|fall)/gi,
  /(?:trend|pattern|cycle|seasonal)/gi,
];

/**
 * Patterns for unreliability detection
 */
const UNRELIABILITY_PATTERNS = [
  /(?:estimat|approximat|rough)/gi,
  /(?:uncertain|unreliable|inconsistent)/gi,
  /(?:incomplete|missing|unavailable)\s+(?:data|information)/gi,
  /(?:conflicting|contradictory)\s+(?:data|information|reports)/gi,
  /(?:forecast|project|predict)/gi,
  /(?:subject\s+to\s+(?:error|change|revision))/gi,
  /(?:preliminary|tentative|provisional)/gi,
];

/**
 * Patterns for novelty detection
 */
const NOVELTY_PATTERNS = {
  routine: [
    /(?:standard|typical|common|usual|regular)/gi,
    /(?:routine|straightforward|basic)/gi,
    /(?:following|according\s+to)\s+(?:standard|established)/gi,
  ],
  semiFamiliar: [
    /(?:slightly|somewhat)\s+(?:different|unusual|complex)/gi,
    /(?:variation|modification)\s+of/gi,
    /(?:similar\s+to|like)\s+.*(?:but|with)/gi,
    /(?:new|updated)\s+(?:regulation|standard|requirement)/gi,
  ],
  novel: [
    /(?:unprecedented|unusual|unique|rare|first-time)/gi,
    /(?:never\s+(?:before|seen|encountered))/gi,
    /(?:emerging|innovative|cutting-edge|novel)/gi,
    /(?:complex\s+(?:scenario|situation|case))/gi,
    /(?:no\s+(?:precedent|prior|established)\s+(?:guidance|framework))/gi,
  ],
};

/**
 * Patterns for incongruity detection
 */
const INCONGRUITY_PATTERNS = [
  /(?:conflict(?:ing)?|contradict(?:ory|ing)?)/gi,
  /(?:inconsisten(?:t|cy))/gi,
  /(?:competing|opposing)\s+(?:interests?|goals?|objectives?)/gi,
  /(?:trade-?off|dilemma)/gi,
  /(?:however|but|although|nevertheless|yet),?\s+(?:also|simultaneously)/gi,
  /(?:on\s+(?:one|the\s+other)\s+hand)/gi,
  /(?:balance\s+(?:between|among))/gi,
];

/**
 * Patterns for time pressure detection
 */
const TIME_PRESSURE_PATTERNS = {
  low: [
    /(?:no\s+(?:rush|deadline|urgency))/gi,
    /(?:flexible\s+(?:timeline|deadline))/gi,
    /(?:take\s+(?:your|the)\s+time)/gi,
    /(?:when\s+(?:convenient|ready))/gi,
  ],
  moderate: [
    /(?:deadline|due\s+(?:date|by))/gi,
    /(?:by\s+(?:end\s+of|close\s+of))/gi,
    /(?:within\s+\d+\s+(?:days?|weeks?|months?))/gi,
    /(?:quarterly|monthly|weekly)\s+(?:report|deadline)/gi,
  ],
  high: [
    /(?:urgent(?:ly)?|ASAP|immediately)/gi,
    /(?:critical\s+deadline|time-sensitive)/gi,
    /(?:today|tomorrow|by\s+COB|end\s+of\s+day)/gi,
    /(?:real-time|on-demand|instant)/gi,
    /(?:rush|expedite|prioritize)/gi,
  ],
};

/**
 * Patterns for action complexity (weighted actions)
 */
const ACTION_COMPLEXITY_WEIGHTS: Record<string, number> = {
  identify: 1,
  list: 1,
  describe: 1,
  calculate: 2,
  compute: 2,
  determine: 2,
  compare: 2,
  analyze: 3,
  evaluate: 3,
  assess: 3,
  synthesize: 4,
  integrate: 4,
  optimize: 4,
  recommend: 3,
  justify: 3,
  critique: 3,
  design: 4,
  develop: 4,
  create: 4,
};

/**
 * Analyzes scenario content using Liu & Li's (2012) framework
 */
export function analyzeLiuLiDimensions(input: LiuLiAnalysisInput): LiuLiDimensions {
  const { content } = input;

  // 1. Size
  const size = calculateSize(content, input.entityCount, input.variables);

  // 2. Variety
  const variety = calculateVariety(content, input.entityTypes, input.variables);

  // 3. Ambiguity
  const ambiguity = calculateAmbiguity(content, input.ambiguousRequirements);

  // 4. Relationships
  const relationships = calculateRelationships(content, input.relationships, input.entityCount);

  // 5. Variability
  const variability = calculateVariability(content, input.involvesChangingState);

  // 6. Unreliability
  const unreliability = calculateUnreliability(content, input.missingInformation);

  // 7. Novelty
  const novelty = determineNovelty(content, input.isNovel, input.domain);

  // 8. Incongruity
  const incongruity = calculateIncongruity(content);

  // 9. Action Complexity
  const actionComplexity = calculateActionComplexity(content, input.calculationSteps);

  // 10. Time Pressure
  const timePressure = determineTimePressure(content, input.timeConstraints);

  return {
    size,
    variety,
    ambiguity,
    relationships,
    variability,
    unreliability,
    novelty,
    incongruity,
    actionComplexity,
    timePressure,
  };
}

/**
 * Calculates size dimension (number of elements)
 */
function calculateSize(
  content: string,
  predefinedCount?: number,
  variables?: Array<{ name: string; type: string }>,
): number {
  if (predefinedCount !== undefined) {
    return predefinedCount;
  }

  if (variables && variables.length > 0) {
    return variables.length;
  }

  // Count numeric values, entities, and key terms
  const numbers = content.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || [];
  const percentages = content.match(/\d+(?:\.\d+)?%/g) || [];
  const currencies = content.match(/\$[\d,]+(?:\.\d{2})?/g) || [];

  // Count unique entities
  const uniqueNumbers = new Set([...numbers, ...percentages, ...currencies]);

  return Math.max(uniqueNumbers.size, 3); // Minimum of 3 elements
}

/**
 * Calculates variety dimension (0-1 scale)
 */
function calculateVariety(
  content: string,
  predefinedTypes?: string[],
  variables?: Array<{ name: string; type: string }>,
): number {
  if (predefinedTypes && predefinedTypes.length > 0) {
    // Normalize based on unique types
    const uniqueTypes = new Set(predefinedTypes);
    return Math.min(uniqueTypes.size / 5, 1); // Max variety at 5+ types
  }

  if (variables && variables.length > 0) {
    const uniqueTypes = new Set(variables.map((v) => v.type));
    return Math.min(uniqueTypes.size / 5, 1);
  }

  // Detect variety from patterns
  let categoriesFound = 0;
  for (const [, patterns] of Object.entries(VARIETY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        categoriesFound++;
        break; // Count each category once
      }
    }
  }

  return Math.min(categoriesFound / Object.keys(VARIETY_PATTERNS).length, 1);
}

/**
 * Calculates ambiguity dimension (0-1 scale)
 */
function calculateAmbiguity(content: string, predefinedAmbiguities?: string[]): number {
  if (predefinedAmbiguities && predefinedAmbiguities.length > 0) {
    return Math.min(predefinedAmbiguities.length / 5, 1);
  }

  let ambiguityScore = 0;
  for (const pattern of AMBIGUITY_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      ambiguityScore += matches.length * 0.1;
    }
  }

  return Math.min(ambiguityScore, 1);
}

/**
 * Calculates relationships dimension (0-1 scale)
 */
function calculateRelationships(
  content: string,
  predefinedRelationships?: Array<{ from: string; to: string; type: string }>,
  entityCount?: number,
): number {
  if (predefinedRelationships && predefinedRelationships.length > 0) {
    const maxPossible = entityCount ? (entityCount * (entityCount - 1)) / 2 : 10;
    return Math.min(predefinedRelationships.length / maxPossible, 1);
  }

  // Detect relationship indicators
  const relationshipPatterns = [
    /(?:depends\s+on|affects?|influences?|impacts?)/gi,
    /(?:related\s+to|connected\s+to|linked\s+to)/gi,
    /(?:based\s+on|derived\s+from|calculated\s+from)/gi,
    /(?:determines|drives|leads\s+to)/gi,
    /(?:input|output|feeds?\s+into)/gi,
    /(?:interacts?\s+with|correlates?\s+with)/gi,
  ];

  let relationshipScore = 0;
  for (const pattern of relationshipPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      relationshipScore += matches.length * 0.15;
    }
  }

  return Math.min(relationshipScore, 1);
}

/**
 * Calculates variability dimension (0-1 scale)
 */
function calculateVariability(content: string, involvesChangingState?: boolean): number {
  if (involvesChangingState === true) {
    return 0.7; // High variability if explicitly changing
  }
  if (involvesChangingState === false) {
    return 0.1; // Low variability if explicitly static
  }

  let variabilityScore = 0;
  for (const pattern of VARIABILITY_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      variabilityScore += matches.length * 0.1;
    }
  }

  return Math.min(variabilityScore, 1);
}

/**
 * Calculates unreliability dimension (0-1 scale)
 */
function calculateUnreliability(content: string, missingInformation?: string[]): number {
  if (missingInformation && missingInformation.length > 0) {
    return Math.min(missingInformation.length * 0.2, 1);
  }

  let unreliabilityScore = 0;
  for (const pattern of UNRELIABILITY_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      unreliabilityScore += matches.length * 0.1;
    }
  }

  return Math.min(unreliabilityScore, 1);
}

/**
 * Determines novelty level
 */
function determineNovelty(content: string, isNovel?: boolean, _domain?: string): NoveltyLevel {
  if (isNovel === true) {
    return 'novel';
  }
  if (isNovel === false) {
    return 'routine';
  }

  // Score each level
  let routineScore = 0;
  let semiFamiliarScore = 0;
  let novelScore = 0;

  for (const pattern of NOVELTY_PATTERNS.routine) {
    if (pattern.test(content)) routineScore++;
  }

  for (const pattern of NOVELTY_PATTERNS.semiFamiliar) {
    if (pattern.test(content)) semiFamiliarScore++;
  }

  for (const pattern of NOVELTY_PATTERNS.novel) {
    if (pattern.test(content)) novelScore++;
  }

  if (novelScore >= 2) return 'novel';
  if (semiFamiliarScore >= 2) return 'semi-familiar';
  if (routineScore >= 1) return 'routine';

  // Default based on content length and complexity indicators
  const contentLength = content.length;
  if (contentLength > 2000) return 'semi-familiar';
  return 'routine';
}

/**
 * Calculates incongruity dimension (0-1 scale)
 */
function calculateIncongruity(content: string): number {
  let incongruityScore = 0;
  for (const pattern of INCONGRUITY_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      incongruityScore += matches.length * 0.15;
    }
  }

  return Math.min(incongruityScore, 1);
}

/**
 * Calculates action complexity (weighted sum)
 */
function calculateActionComplexity(
  content: string,
  predefinedSteps?: Array<{ step: string; weight?: number }>,
): number {
  if (predefinedSteps && predefinedSteps.length > 0) {
    return predefinedSteps.reduce((sum, step) => sum + (step.weight || 2), 0);
  }

  let totalWeight = 0;

  for (const [action, weight] of Object.entries(ACTION_COMPLEXITY_WEIGHTS)) {
    const regex = new RegExp(`\\b${action}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      totalWeight += matches.length * weight;
    }
  }

  return totalWeight;
}

/**
 * Determines time pressure level
 */
function determineTimePressure(content: string, timeConstraints?: string): TimePressure {
  if (timeConstraints) {
    const constraintLower = timeConstraints.toLowerCase();
    if (/urgent|asap|immediate|today|critical/i.test(constraintLower)) {
      return 'high';
    }
    if (/deadline|due|within/i.test(constraintLower)) {
      return 'moderate';
    }
  }

  let highScore = 0;
  let moderateScore = 0;
  let lowScore = 0;

  for (const pattern of TIME_PRESSURE_PATTERNS.high) {
    if (pattern.test(content)) highScore++;
  }

  for (const pattern of TIME_PRESSURE_PATTERNS.moderate) {
    if (pattern.test(content)) moderateScore++;
  }

  for (const pattern of TIME_PRESSURE_PATTERNS.low) {
    if (pattern.test(content)) lowScore++;
  }

  if (highScore >= 1) return 'high';
  if (moderateScore >= 1) return 'moderate';
  return 'low';
}

/**
 * Calculates the Liu & Li framework contribution to the composite score
 */
export function calculateLiuLiScore(dimensions: LiuLiDimensions): number {
  let score = 0;

  // Size contribution (scaled, max ~5 points)
  score += Math.min(dimensions.size, 20) * 0.25;

  // Variety contribution (max 5 points)
  score += dimensions.variety * 5;

  // Ambiguity contribution (max 5 points)
  score += dimensions.ambiguity * 5;

  // Relationships contribution (max 5 points)
  score += dimensions.relationships * 5;

  // Variability contribution (max 3 points)
  score += dimensions.variability * 3;

  // Unreliability contribution (max 4 points)
  score += dimensions.unreliability * 4;

  // Novelty contribution
  score += dimensions.novelty === 'novel' ? 4 : dimensions.novelty === 'semi-familiar' ? 2 : 0;

  // Incongruity contribution (max 4 points)
  score += dimensions.incongruity * 4;

  // Action complexity contribution (scaled, max ~5 points)
  score += Math.min(dimensions.actionComplexity, 20) * 0.25;

  // Time pressure contribution
  score += dimensions.timePressure === 'high' ? 2 : dimensions.timePressure === 'moderate' ? 1 : 0;

  return Math.round(score * 10) / 10;
}

export default {
  analyzeLiuLiDimensions,
  calculateLiuLiScore,
};
