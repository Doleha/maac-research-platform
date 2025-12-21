/**
 * Wood (1986) Component Complexity Analyzer
 *
 * Implements Wood's tripartite model of task complexity:
 * - Component complexity = distinct acts × information cues per act
 * - Coordinative complexity = relationships between inputs and outputs
 * - Dynamic complexity = changes in states affecting the above
 *
 * Reference:
 * Wood, R. E. (1986). Task complexity: Definition of the construct.
 * Organizational Behavior and Human Decision Processes, 37(1), 60-82.
 */

import type { WoodMetrics, CoordinativeComplexity, DynamicComplexity } from '@maac/types';

/**
 * Input structure for Wood analysis
 */
export interface WoodAnalysisInput {
  /** Text content to analyze (scenario description) */
  content: string;

  /** Pre-parsed calculation steps (if available) */
  calculationSteps?: string[];

  /** Variables mentioned in the scenario */
  variables?: string[];

  /** Whether there are conditional branches */
  hasConditionals?: boolean;

  /** Whether state changes occur during execution */
  hasStateChanges?: boolean;

  /** Explicit dependency information */
  dependencies?: Array<{ from: string; to: string }>;
}

/**
 * Keywords indicating calculation steps
 */
const CALCULATION_KEYWORDS = [
  'calculate',
  'compute',
  'determine',
  'analyze',
  'evaluate',
  'assess',
  'compare',
  'measure',
  'estimate',
  'derive',
  'solve',
  'find',
  'identify',
  'classify',
  'rank',
  'prioritize',
  'allocate',
  'optimize',
  'balance',
  'reconcile',
];

/**
 * Keywords indicating information cues
 */
const INFORMATION_CUE_PATTERNS = [
  /\$[\d,]+(?:\.\d{2})?/g, // Currency amounts
  /\d+(?:\.\d+)?%/g, // Percentages
  /\d+(?:\.\d+)?\s*(?:years?|months?|days?|hours?)/gi, // Time periods
  /\d+(?:,\d{3})*(?:\.\d+)?/g, // Numeric values
  /ratio|rate|percentage|proportion|factor|coefficient/gi, // Ratio terms
  /revenue|cost|expense|profit|margin|income|tax|interest/gi, // Financial terms
  /inventory|stock|units?|quantity|amount|balance/gi, // Quantity terms
  /price|value|worth|premium|discount/gi, // Value terms
];

/**
 * Patterns indicating sequential dependencies
 */
const SEQUENTIAL_PATTERNS = [
  /first[\s,]+.*then/gi,
  /step\s*\d+/gi,
  /after\s+(?:calculating|determining|finding)/gi,
  /once\s+(?:you|we)\s+have/gi,
  /using\s+(?:the|this)\s+result/gi,
  /based\s+on\s+(?:the|this)\s+calculation/gi,
];

/**
 * Patterns indicating interdependencies
 */
const INTERDEPENDENT_PATTERNS = [
  /depends?\s+on/gi,
  /affects?\s+(?:the|this)/gi,
  /influences?\s+(?:the|this)/gi,
  /interrelated/gi,
  /simultaneously/gi,
  /together\s+with/gi,
  /in\s+conjunction\s+with/gi,
  /mutual(?:ly)?/gi,
];

/**
 * Patterns indicating networked complexity
 */
const NETWORKED_PATTERNS = [
  /feedback\s+loop/gi,
  /circular\s+dependency/gi,
  /iterative(?:ly)?/gi,
  /recursive(?:ly)?/gi,
  /cascading\s+effect/gi,
  /ripple\s+effect/gi,
  /chain\s+reaction/gi,
  /interconnected/gi,
  /complex\s+(?:web|network)/gi,
];

/**
 * Patterns indicating dynamic complexity
 */
const DYNAMIC_PATTERNS = {
  low: [
    /may\s+change/gi,
    /could\s+vary/gi,
    /potentially\s+different/gi,
    /slight\s+variation/gi,
    /minor\s+adjustment/gi,
  ],
  high: [
    /constantly\s+changing/gi,
    /highly\s+volatile/gi,
    /uncertain\s+(?:market|conditions?)/gi,
    /unpredictable/gi,
    /rapid\s+changes?/gi,
    /dynamic\s+(?:environment|conditions?)/gi,
    /real-time\s+(?:updates?|changes?)/gi,
    /fluctuat(?:es?|ing)/gi,
  ],
};

/**
 * Analyzes scenario content using Wood's (1986) framework
 */
export function analyzeWoodMetrics(input: WoodAnalysisInput): WoodMetrics {
  const { content } = input;
  const contentLower = content.toLowerCase();

  // Count distinct acts
  const distinctActs = countDistinctActs(content, input.calculationSteps);

  // Count information cues per act
  const informationCues = countInformationCues(content, input.variables);
  const informationCuesPerAct =
    distinctActs > 0 ? Math.round((informationCues / distinctActs) * 10) / 10 : informationCues;

  // Calculate total elements
  const totalElements = distinctActs * Math.ceil(informationCuesPerAct);

  // Determine coordinative complexity
  const coordinativeComplexity = determineCoordinativeComplexity(
    content,
    input.dependencies,
    input.hasConditionals,
  );

  // Determine dynamic complexity
  const dynamicComplexity = determineDynamicComplexity(content, input.hasStateChanges);

  // Calculate component complexity score
  const componentComplexityScore = calculateComponentScore(
    distinctActs,
    informationCuesPerAct,
    coordinativeComplexity,
  );

  return {
    distinctActs,
    informationCuesPerAct,
    totalElements,
    coordinativeComplexity,
    dynamicComplexity,
    componentComplexityScore,
  };
}

/**
 * Counts distinct calculation/analysis steps in the content
 */
function countDistinctActs(content: string, predefinedSteps?: string[]): number {
  if (predefinedSteps && predefinedSteps.length > 0) {
    return predefinedSteps.length;
  }

  const contentLower = content.toLowerCase();
  let actCount = 0;

  // Count explicit calculation keywords
  for (const keyword of CALCULATION_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      actCount += matches.length;
    }
  }

  // Count numbered steps
  const numberedSteps = content.match(/(?:^|\n)\s*\d+[\.\)]\s+/g);
  if (numberedSteps) {
    actCount = Math.max(actCount, numberedSteps.length);
  }

  // Count bullet points as potential acts
  const bulletPoints = content.match(/(?:^|\n)\s*[-•*]\s+/g);
  if (bulletPoints && bulletPoints.length > actCount) {
    actCount = Math.max(actCount, Math.ceil(bulletPoints.length * 0.7)); // Not all bullets are acts
  }

  // Minimum of 2 acts for any meaningful scenario
  return Math.max(2, Math.min(actCount, 15)); // Cap at 15 for extreme cases
}

/**
 * Counts information cues in the content
 */
function countInformationCues(content: string, predefinedVariables?: string[]): number {
  if (predefinedVariables && predefinedVariables.length > 0) {
    return predefinedVariables.length;
  }

  let cueCount = 0;
  const foundCues = new Set<string>();

  // Count pattern matches
  for (const pattern of INFORMATION_CUE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        const normalized = match.toLowerCase().trim();
        if (!foundCues.has(normalized)) {
          foundCues.add(normalized);
          cueCount++;
        }
      }
    }
  }

  // Minimum of 1 cue for any scenario
  return Math.max(1, cueCount);
}

/**
 * Determines the coordinative complexity level
 */
function determineCoordinativeComplexity(
  content: string,
  dependencies?: Array<{ from: string; to: string }>,
  hasConditionals?: boolean,
): CoordinativeComplexity {
  // Check for explicit dependency information
  if (dependencies && dependencies.length > 0) {
    // Check for cycles (networked)
    if (hasCyclicDependencies(dependencies)) {
      return 'networked';
    }
    // Check for multiple dependencies (interdependent)
    const dependencyMap = new Map<string, number>();
    for (const dep of dependencies) {
      dependencyMap.set(dep.to, (dependencyMap.get(dep.to) || 0) + 1);
    }
    const maxDeps = Math.max(...dependencyMap.values());
    if (maxDeps >= 2) {
      return 'interdependent';
    }
  }

  // Check content patterns
  let networkedScore = 0;
  let interdependentScore = 0;
  let sequentialScore = 0;

  for (const pattern of NETWORKED_PATTERNS) {
    if (pattern.test(content)) {
      networkedScore++;
    }
  }

  for (const pattern of INTERDEPENDENT_PATTERNS) {
    if (pattern.test(content)) {
      interdependentScore++;
    }
  }

  for (const pattern of SEQUENTIAL_PATTERNS) {
    if (pattern.test(content)) {
      sequentialScore++;
    }
  }

  // Add weight for conditionals
  if (hasConditionals) {
    interdependentScore += 2;
  }

  // Determine based on scores
  if (networkedScore >= 2) {
    return 'networked';
  }
  if (interdependentScore >= 2 || (interdependentScore >= 1 && sequentialScore >= 1)) {
    return 'interdependent';
  }
  return 'sequential';
}

/**
 * Checks for cyclic dependencies
 */
function hasCyclicDependencies(dependencies: Array<{ from: string; to: string }>): boolean {
  const graph = new Map<string, string[]>();

  for (const dep of dependencies) {
    if (!graph.has(dep.from)) {
      graph.set(dep.from, []);
    }
    graph.get(dep.from)!.push(dep.to);
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Determines the dynamic complexity level
 */
function determineDynamicComplexity(content: string, hasStateChanges?: boolean): DynamicComplexity {
  if (hasStateChanges === false) {
    return 'static';
  }

  let highScore = 0;
  let lowScore = 0;

  for (const pattern of DYNAMIC_PATTERNS.high) {
    if (pattern.test(content)) {
      highScore++;
    }
  }

  for (const pattern of DYNAMIC_PATTERNS.low) {
    if (pattern.test(content)) {
      lowScore++;
    }
  }

  if (highScore >= 2 || hasStateChanges === true) {
    return 'high';
  }
  if (lowScore >= 1 || highScore >= 1) {
    return 'low';
  }
  return 'static';
}

/**
 * Calculates the component complexity score
 */
function calculateComponentScore(
  distinctActs: number,
  informationCuesPerAct: number,
  coordinativeComplexity: CoordinativeComplexity,
): number {
  // Base score from Wood's formula
  const baseScore = distinctActs * informationCuesPerAct;

  // Coordinative multiplier
  const coordinativeMultiplier =
    coordinativeComplexity === 'networked'
      ? 1.5
      : coordinativeComplexity === 'interdependent'
        ? 1.2
        : 1.0;

  return Math.round(baseScore * coordinativeMultiplier * 10) / 10;
}

/**
 * Calculates the Wood framework contribution to the composite score
 */
export function calculateWoodScore(metrics: WoodMetrics): number {
  let score = 0;

  // Distinct acts contribution (0-5 points scaled)
  score += Math.min(metrics.distinctActs, 10) * 0.5;

  // Information cues contribution (0-5 points scaled)
  score += Math.min(metrics.informationCuesPerAct, 5) * 1.0;

  // Coordinative complexity contribution
  score +=
    metrics.coordinativeComplexity === 'networked'
      ? 5
      : metrics.coordinativeComplexity === 'interdependent'
        ? 3
        : 1;

  // Dynamic complexity contribution
  score += metrics.dynamicComplexity === 'high' ? 4 : metrics.dynamicComplexity === 'low' ? 2 : 0;

  return Math.round(score * 10) / 10;
}

export default {
  analyzeWoodMetrics,
  calculateWoodScore,
};
