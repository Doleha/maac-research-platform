/**
 * Campbell (1988) Four Sources of Complexity Analyzer
 *
 * Implements Campbell's framework identifying four fundamental sources
 * of task complexity:
 * 1. Multiple paths to desired end state
 * 2. Multiple desired outcomes/end states
 * 3. Conflicting interdependence among paths and outcomes
 * 4. Uncertain or probabilistic links between paths and outcomes
 *
 * Reference:
 * Campbell, D. J. (1988). Task complexity: A review and analysis.
 * Academy of Management Review, 13(1), 40-52.
 */

import type { CampbellAttributes, UncertaintyLevel } from '@maac/types';

/**
 * Input structure for Campbell analysis
 */
export interface CampbellAnalysisInput {
  /** Text content to analyze (scenario description) */
  content: string;

  /** Solution approaches identified */
  solutionApproaches?: string[];

  /** Objectives/outcomes identified */
  objectives?: string[];

  /** Trade-offs or conflicts identified */
  tradeoffs?: string[];

  /** Information gaps or uncertainties */
  informationGaps?: string[];

  /** Explicit multiple paths flag */
  hasMultiplePaths?: boolean;

  /** Explicit multiple outcomes flag */
  hasMultipleOutcomes?: boolean;

  /** Explicit conflicts flag */
  hasConflicts?: boolean;

  /** Explicit uncertainty flag */
  hasUncertainty?: boolean;
}

/**
 * Patterns indicating multiple solution paths
 */
const MULTIPLE_PATH_PATTERNS = [
  /(?:several|multiple|various|different)\s+(?:ways?|methods?|approaches?|options?|alternatives?)/gi,
  /(?:can|could|might)\s+(?:either|also|alternatively)/gi,
  /option\s*\d+/gi,
  /approach\s*\d+/gi,
  /method\s*\d+/gi,
  /alternatively/gi,
  /on\s+the\s+other\s+hand/gi,
  /(?:one|another)\s+(?:way|method|approach)/gi,
  /choose\s+(?:between|among)/gi,
  /(?:first|second|third)\s+(?:option|approach|method)/gi,
  /versus|vs\.?|or\s+alternatively/gi,
];

/**
 * Patterns indicating multiple outcomes
 */
const MULTIPLE_OUTCOME_PATTERNS = [
  /(?:multiple|several|various|different)\s+(?:objectives?|goals?|outcomes?|targets?)/gi,
  /(?:maximize|minimize|optimize)\s+(?:both|all|multiple)/gi,
  /(?:simultaneously|concurrently)\s+(?:achieve|meet|satisfy)/gi,
  /balance\s+(?:between|among)/gi,
  /meet\s+(?:all|both|multiple)\s+(?:requirements?|criteria|objectives?)/gi,
  /competing\s+(?:objectives?|goals?|priorities?)/gi,
  /(?:primary|secondary)\s+(?:objective|goal|outcome)/gi,
  /trade-?off/gi,
  /multi-?objective/gi,
];

/**
 * Patterns indicating conflicting interdependence
 */
const CONFLICT_PATTERNS = [
  /conflict(?:ing|s)?(?:\s+between|\s+among)?/gi,
  /trade-?off/gi,
  /at\s+the\s+expense\s+of/gi,
  /mutually\s+exclusive/gi,
  /cannot\s+(?:both|all)/gi,
  /incompatible/gi,
  /contradictory/gi,
  /tension\s+between/gi,
  /competing\s+(?:demands?|priorities?|interests?)/gi,
  /sacrifice\s+(?:one|some)\s+(?:for|to)/gi,
  /(?:increase|decrease).*(?:but|however).*(?:decrease|increase)/gi,
  /versus|vs\.?/gi,
  /either\s*\.\.\.\s*or/gi,
  /dilemma/gi,
];

/**
 * Patterns indicating uncertainty
 */
const UNCERTAINTY_PATTERNS = {
  bounded: [
    /(?:may|might|could)\s+(?:be|vary|change)/gi,
    /uncertain(?:ty)?/gi,
    /unclear/gi,
    /estimated|approximately|roughly|around/gi,
    /range\s+(?:of|from|between)/gi,
    /between\s+\d+\s+and\s+\d+/gi,
    /plus\s+or\s+minus/gi,
    /±/g,
    /(?:best|worst)\s+case/gi,
    /scenario\s+(?:analysis|planning)/gi,
    /probability|likelihood/gi,
    /risk\s+of/gi,
  ],
  high: [
    /highly\s+uncertain/gi,
    /unknown|unknowable/gi,
    /unpredictable/gi,
    /volatile/gi,
    /significant\s+(?:uncertainty|risk)/gi,
    /no\s+(?:clear|definitive|reliable)\s+(?:data|information)/gi,
    /missing\s+(?:critical|key|essential)\s+(?:data|information)/gi,
    /ambiguous/gi,
    /contradictory\s+(?:data|information|evidence)/gi,
    /insufficient\s+(?:data|information)/gi,
    /impossible\s+to\s+(?:know|determine|predict)/gi,
  ],
};

/**
 * Analyzes scenario content using Campbell's (1988) framework
 */
export function analyzeCampbellAttributes(input: CampbellAnalysisInput): CampbellAttributes {
  const { content } = input;

  // Analyze multiple paths
  const pathAnalysis = analyzeMultiplePaths(
    content,
    input.solutionApproaches,
    input.hasMultiplePaths,
  );

  // Analyze multiple outcomes
  const outcomeAnalysis = analyzeMultipleOutcomes(
    content,
    input.objectives,
    input.hasMultipleOutcomes,
  );

  // Analyze conflicting interdependence
  const conflictAnalysis = analyzeConflicts(content, input.tradeoffs, input.hasConflicts);

  // Analyze uncertainty
  const uncertaintyAnalysis = analyzeUncertainty(
    content,
    input.informationGaps,
    input.hasUncertainty,
  );

  // Calculate Campbell type (binary encoding)
  const campbellType = calculateCampbellType(
    pathAnalysis.multiplePaths,
    outcomeAnalysis.multipleOutcomes,
    conflictAnalysis.conflictingInterdependence,
    uncertaintyAnalysis.uncertaintyLevel !== 'none',
  );

  return {
    multiplePaths: pathAnalysis.multiplePaths,
    pathCount: pathAnalysis.pathCount,
    multipleOutcomes: outcomeAnalysis.multipleOutcomes,
    outcomeCount: outcomeAnalysis.outcomeCount,
    conflictingInterdependence: conflictAnalysis.conflictingInterdependence,
    conflicts: conflictAnalysis.conflicts,
    uncertaintyLevel: uncertaintyAnalysis.uncertaintyLevel,
    uncertaintyIndicators: uncertaintyAnalysis.indicators,
    campbellType,
  };
}

/**
 * Analyzes whether multiple solution paths exist
 */
function analyzeMultiplePaths(
  content: string,
  predefinedApproaches?: string[],
  explicit?: boolean,
): { multiplePaths: boolean; pathCount: number } {
  if (explicit !== undefined) {
    return {
      multiplePaths: explicit,
      pathCount: explicit ? predefinedApproaches?.length || 2 : 1,
    };
  }

  if (predefinedApproaches && predefinedApproaches.length > 0) {
    return {
      multiplePaths: predefinedApproaches.length > 1,
      pathCount: predefinedApproaches.length,
    };
  }

  let pathIndicators = 0;
  for (const pattern of MULTIPLE_PATH_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      pathIndicators += matches.length;
    }
  }

  // Count explicit alternatives (Option A, Method 1, etc.)
  const explicitOptions = content.match(/(?:option|method|approach|alternative)\s*[a-z1-9]/gi);
  const explicitCount = explicitOptions
    ? Math.min(new Set(explicitOptions.map((s) => s.toLowerCase())).size, 5)
    : 0;

  const hasMultiplePaths = pathIndicators >= 2 || explicitCount >= 2;
  const pathCount = hasMultiplePaths ? Math.max(2, explicitCount || 2) : 1;

  return { multiplePaths: hasMultiplePaths, pathCount };
}

/**
 * Analyzes whether multiple outcomes exist
 */
function analyzeMultipleOutcomes(
  content: string,
  predefinedObjectives?: string[],
  explicit?: boolean,
): { multipleOutcomes: boolean; outcomeCount: number } {
  if (explicit !== undefined) {
    return {
      multipleOutcomes: explicit,
      outcomeCount: explicit ? predefinedObjectives?.length || 2 : 1,
    };
  }

  if (predefinedObjectives && predefinedObjectives.length > 0) {
    return {
      multipleOutcomes: predefinedObjectives.length > 1,
      outcomeCount: predefinedObjectives.length,
    };
  }

  let outcomeIndicators = 0;
  for (const pattern of MULTIPLE_OUTCOME_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      outcomeIndicators += matches.length;
    }
  }

  // Look for listed objectives
  const objectivePatterns = content.match(
    /(?:objectives?|goals?|targets?)\s*(?:are|include|:|;)/gi,
  );
  const listedItems = objectivePatterns ? countListItems(content, objectivePatterns[0]) : 0;

  const hasMultipleOutcomes = outcomeIndicators >= 2 || listedItems >= 2;
  const outcomeCount = hasMultipleOutcomes ? Math.max(2, listedItems || 2) : 1;

  return { multipleOutcomes: hasMultipleOutcomes, outcomeCount };
}

/**
 * Counts items in a list following a pattern
 */
function countListItems(content: string, startPattern: string): number {
  const startIndex = content.indexOf(startPattern);
  if (startIndex === -1) return 0;

  const afterStart = content.slice(
    startIndex + startPattern.length,
    startIndex + startPattern.length + 500,
  );

  // Count bullet points or numbered items
  const bullets = afterStart.match(/(?:^|\n)\s*[-•*\d+\.]\s+/g);
  if (bullets) return bullets.length;

  // Count comma-separated items
  const commas = (afterStart.match(/,/g) || []).length;
  if (commas >= 1) return commas + 1;

  return 0;
}

/**
 * Analyzes conflicting interdependence
 */
function analyzeConflicts(
  content: string,
  predefinedTradeoffs?: string[],
  explicit?: boolean,
): { conflictingInterdependence: boolean; conflicts: string[] } {
  if (explicit !== undefined) {
    return {
      conflictingInterdependence: explicit,
      conflicts: explicit ? predefinedTradeoffs || ['Identified conflict'] : [],
    };
  }

  if (predefinedTradeoffs && predefinedTradeoffs.length > 0) {
    return {
      conflictingInterdependence: true,
      conflicts: predefinedTradeoffs,
    };
  }

  const conflicts: string[] = [];
  let conflictIndicators = 0;

  for (const pattern of CONFLICT_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      conflictIndicators += matches.length;
      // Extract context around the match
      for (const match of matches.slice(0, 3)) {
        // Limit to 3 conflicts
        const index = content.toLowerCase().indexOf(match.toLowerCase());
        if (index !== -1) {
          const start = Math.max(0, index - 30);
          const end = Math.min(content.length, index + match.length + 50);
          const context = content.slice(start, end).trim().replace(/\s+/g, ' ');
          if (!conflicts.includes(context) && conflicts.length < 5) {
            conflicts.push(context);
          }
        }
      }
    }
  }

  return {
    conflictingInterdependence: conflictIndicators >= 2 || conflicts.length >= 1,
    conflicts,
  };
}

/**
 * Analyzes uncertainty level
 */
function analyzeUncertainty(
  content: string,
  predefinedGaps?: string[],
  explicit?: boolean,
): { uncertaintyLevel: UncertaintyLevel; indicators: number } {
  if (explicit === true && predefinedGaps && predefinedGaps.length > 0) {
    return {
      uncertaintyLevel: predefinedGaps.length >= 3 ? 'high' : 'bounded',
      indicators: predefinedGaps.length,
    };
  }

  if (explicit === false) {
    return { uncertaintyLevel: 'none', indicators: 0 };
  }

  let highIndicators = 0;
  let boundedIndicators = 0;

  for (const pattern of UNCERTAINTY_PATTERNS.high) {
    const matches = content.match(pattern);
    if (matches) {
      highIndicators += matches.length;
    }
  }

  for (const pattern of UNCERTAINTY_PATTERNS.bounded) {
    const matches = content.match(pattern);
    if (matches) {
      boundedIndicators += matches.length;
    }
  }

  const totalIndicators = highIndicators + boundedIndicators;

  let uncertaintyLevel: UncertaintyLevel;
  if (highIndicators >= 2) {
    uncertaintyLevel = 'high';
  } else if (highIndicators >= 1 || boundedIndicators >= 2) {
    uncertaintyLevel = 'bounded';
  } else {
    uncertaintyLevel = 'none';
  }

  return { uncertaintyLevel, indicators: totalIndicators };
}

/**
 * Calculates Campbell's 16-type binary encoding
 * Bits: [paths, outcomes, conflict, uncertainty] = 4 bits = 0-15
 */
function calculateCampbellType(
  multiplePaths: boolean,
  multipleOutcomes: boolean,
  conflictingInterdependence: boolean,
  hasUncertainty: boolean,
): number {
  let type = 0;
  if (multiplePaths) type |= 8; // Bit 3
  if (multipleOutcomes) type |= 4; // Bit 2
  if (conflictingInterdependence) type |= 2; // Bit 1
  if (hasUncertainty) type |= 1; // Bit 0
  return type;
}

/**
 * Calculates the Campbell framework contribution to the composite score
 */
export function calculateCampbellScore(attributes: CampbellAttributes): number {
  let score = 0;

  // Multiple paths contribution
  if (attributes.multiplePaths) {
    score += 3;
    score += Math.min(attributes.pathCount - 1, 3); // Up to 3 extra for more paths
  }

  // Multiple outcomes contribution
  if (attributes.multipleOutcomes) {
    score += 3;
    score += Math.min(attributes.outcomeCount - 1, 3);
  }

  // Conflicting interdependence contribution
  if (attributes.conflictingInterdependence) {
    score += 4;
    score += Math.min(attributes.conflicts.length, 3);
  }

  // Uncertainty contribution
  score +=
    attributes.uncertaintyLevel === 'high' ? 5 : attributes.uncertaintyLevel === 'bounded' ? 3 : 0;

  return Math.round(score * 10) / 10;
}

/**
 * Returns human-readable description of Campbell type
 */
export function getCampbellTypeDescription(campbellType: number): string {
  const descriptions: Record<number, string> = {
    0: 'Simple Task (no complexity attributes)',
    1: 'Uncertain Task',
    2: 'Conflicting Task',
    3: 'Conflicting Uncertain Task',
    4: 'Multi-Outcome Task',
    5: 'Uncertain Multi-Outcome Task',
    6: 'Conflicting Multi-Outcome Task',
    7: 'Conflicting Uncertain Multi-Outcome Task',
    8: 'Multi-Path Task',
    9: 'Uncertain Multi-Path Task',
    10: 'Conflicting Multi-Path Task',
    11: 'Conflicting Uncertain Multi-Path Task',
    12: 'Multi-Path Multi-Outcome Task',
    13: 'Uncertain Multi-Path Multi-Outcome Task',
    14: 'Conflicting Multi-Path Multi-Outcome Task',
    15: 'Maximally Complex Task (all attributes)',
  };

  return descriptions[campbellType] || 'Unknown Type';
}

export default {
  analyzeCampbellAttributes,
  calculateCampbellScore,
  getCampbellTypeDescription,
};
