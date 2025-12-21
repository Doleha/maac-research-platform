/**
 * Element Interactivity Analyzer
 *
 * Based on Cognitive Load Theory (Sweller et al., 1998; Chen et al., 2023)
 *
 * Element interactivity is a key determinant of intrinsic cognitive load.
 * High element interactivity means many elements must be processed
 * simultaneously in working memory.
 *
 * References:
 * - Sweller, J., Van Merrienboer, J. J., & Paas, F. G. (1998).
 *   Cognitive architecture and instructional design. Educational Psychology Review.
 * - Chen, O., Paas, F., & Sweller, J. (2023). A Cognitive Load Theory Approach
 *   to Defining and Measuring Task Complexity. Educational Psychology Review.
 */

import type { ElementInteractivityAnalysis } from '@maac/types';

/**
 * Input structure for element interactivity analysis
 */
export interface ElementInteractivityInput {
  /** Total elements identified in the scenario */
  totalElements?: number;

  /** Elements from Wood analysis */
  woodTotalElements?: number;

  /** Variables and their dependencies */
  variables?: Array<{
    name: string;
    dependsOn?: string[];
  }>;

  /** Calculation steps with their dependencies */
  steps?: Array<{
    id: string;
    dependsOn?: string[];
    produces?: string[];
  }>;

  /** Text content for analysis */
  content: string;
}

/**
 * Patterns indicating element dependencies
 */
const DEPENDENCY_PATTERNS = [
  /(?:using|with)\s+(?:the|this|these)/gi,
  /(?:based\s+on|derived\s+from|calculated\s+from)/gi,
  /(?:requires?|needs?)\s+(?:the|this|these)/gi,
  /(?:from\s+(?:step|calculation|equation))\s*\d+/gi,
  /(?:result(?:s|ing)?)\s+(?:of|from)/gi,
  /(?:input|output|feeds?\s+into)/gi,
  /(?:combined\s+with|together\s+with|along\s+with)/gi,
  /(?:multiply|divide|add|subtract)\s+.*\s+(?:by|from|to)/gi,
];

/**
 * Patterns indicating simultaneous processing requirements
 */
const SIMULTANEOUS_PATTERNS = [
  /(?:simultaneously|at\s+the\s+same\s+time|concurrently)/gi,
  /(?:all\s+(?:of\s+)?(?:the|these)\s+(?:factors|elements|variables))/gi,
  /(?:consider(?:ing)?\s+(?:all|multiple|several))/gi,
  /(?:balancing?|weighing?)\s+(?:multiple|several|all)/gi,
  /(?:integrat(?:e|ing)\s+(?:all|multiple|these))/gi,
  /(?:combined|aggregate|composite|overall)/gi,
  /(?:taking\s+into\s+account|accounting\s+for)/gi,
];

/**
 * Analyzes element interactivity in a scenario
 */
export function analyzeElementInteractivity(
  input: ElementInteractivityInput,
): ElementInteractivityAnalysis {
  const { content } = input;

  // Determine total elements
  const totalElements = determineTotalElements(input);

  // Analyze dependencies
  const dependencyAnalysis = analyzeDependencies(input);

  // Calculate simultaneous elements
  const simultaneousElements = calculateSimultaneousElements(
    content,
    totalElements,
    dependencyAnalysis,
  );

  // Calculate interactivity ratio
  const interactivityRatio =
    totalElements > 0 ? Math.min(simultaneousElements / totalElements, 1) : 0;

  return {
    totalElements,
    simultaneousElements,
    interactivityRatio,
    dependencyDepth: dependencyAnalysis.depth,
    dependencyEdges: dependencyAnalysis.edges,
  };
}

/**
 * Determines total elements from various inputs
 */
function determineTotalElements(input: ElementInteractivityInput): number {
  if (input.totalElements !== undefined) {
    return input.totalElements;
  }

  if (input.woodTotalElements !== undefined) {
    return input.woodTotalElements;
  }

  if (input.variables && input.variables.length > 0) {
    return input.variables.length;
  }

  if (input.steps && input.steps.length > 0) {
    // Count unique elements across all steps
    const elements = new Set<string>();
    for (const step of input.steps) {
      elements.add(step.id);
      step.dependsOn?.forEach((d) => elements.add(d));
      step.produces?.forEach((p) => elements.add(p));
    }
    return elements.size;
  }

  // Estimate from content
  return estimateElementsFromContent(input.content);
}

/**
 * Estimates element count from content analysis
 */
function estimateElementsFromContent(content: string): number {
  // Count distinct numeric values
  const numbers = new Set(content.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || []);

  // Count variable-like terms
  const variablePatterns = [
    /(?:total|sum|average|mean|rate|ratio|percentage|amount|value|cost|revenue|profit)/gi,
    /(?:quantity|units?|inventory|balance|payment|interest)/gi,
  ];

  let variableCount = 0;
  for (const pattern of variablePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      variableCount += new Set(matches.map((m) => m.toLowerCase())).size;
    }
  }

  return Math.max(numbers.size + variableCount, 3);
}

/**
 * Analyzes dependency structure
 */
function analyzeDependencies(input: ElementInteractivityInput): {
  depth: number;
  edges: number;
  graph: Map<string, string[]>;
} {
  const graph = new Map<string, string[]>();
  let edges = 0;

  // Build graph from explicit dependencies
  if (input.variables) {
    for (const variable of input.variables) {
      if (variable.dependsOn && variable.dependsOn.length > 0) {
        graph.set(variable.name, variable.dependsOn);
        edges += variable.dependsOn.length;
      }
    }
  }

  if (input.steps) {
    for (const step of input.steps) {
      if (step.dependsOn && step.dependsOn.length > 0) {
        graph.set(step.id, step.dependsOn);
        edges += step.dependsOn.length;
      }
    }
  }

  // If no explicit dependencies, estimate from content
  if (graph.size === 0) {
    const estimation = estimateDependenciesFromContent(input.content);
    return { depth: estimation.depth, edges: estimation.edges, graph: new Map() };
  }

  // Calculate depth (longest path)
  const depth = calculateGraphDepth(graph);

  return { depth, edges, graph };
}

/**
 * Estimates dependencies from content patterns
 */
function estimateDependenciesFromContent(content: string): { depth: number; edges: number } {
  let dependencyIndicators = 0;

  for (const pattern of DEPENDENCY_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      dependencyIndicators += matches.length;
    }
  }

  // Estimate depth and edges based on indicators
  const edges = Math.min(dependencyIndicators, 15);
  const depth = Math.min(Math.ceil(dependencyIndicators / 3), 5);

  return { depth, edges };
}

/**
 * Calculates the depth of a dependency graph (longest path)
 */
function calculateGraphDepth(graph: Map<string, string[]>): number {
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  function getDepth(node: string): number {
    if (memo.has(node)) {
      return memo.get(node)!;
    }

    if (visiting.has(node)) {
      // Cycle detected, return 0 to avoid infinite loop
      return 0;
    }

    visiting.add(node);

    const dependencies = graph.get(node) || [];
    let maxDepth = 0;

    for (const dep of dependencies) {
      maxDepth = Math.max(maxDepth, getDepth(dep) + 1);
    }

    visiting.delete(node);
    memo.set(node, maxDepth);
    return maxDepth;
  }

  let maxDepth = 0;
  for (const node of graph.keys()) {
    maxDepth = Math.max(maxDepth, getDepth(node));
  }

  return maxDepth;
}

/**
 * Calculates the number of elements requiring simultaneous processing
 */
function calculateSimultaneousElements(
  content: string,
  totalElements: number,
  dependencyAnalysis: { depth: number; edges: number; graph: Map<string, string[]> },
): number {
  // Check for explicit simultaneous processing indicators
  let simultaneousIndicators = 0;
  for (const pattern of SIMULTANEOUS_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      simultaneousIndicators += matches.length;
    }
  }

  // Use dependency analysis
  if (dependencyAnalysis.graph.size > 0) {
    // Find nodes with most dependencies
    let maxDependencies = 0;
    for (const deps of dependencyAnalysis.graph.values()) {
      maxDependencies = Math.max(maxDependencies, deps.length);
    }
    return Math.max(maxDependencies + 1, Math.ceil(simultaneousIndicators * 1.5));
  }

  // Estimate based on indicators
  if (simultaneousIndicators >= 3) {
    return Math.ceil(totalElements * 0.7);
  }
  if (simultaneousIndicators >= 1) {
    return Math.ceil(totalElements * 0.4);
  }

  // Use dependency depth as proxy
  const depthFactor = dependencyAnalysis.depth / 5; // Normalize to ~1
  return Math.max(2, Math.ceil(totalElements * Math.min(depthFactor, 0.5)));
}

/**
 * Calculates the element interactivity contribution to the composite score
 */
export function calculateInteractivityScore(analysis: ElementInteractivityAnalysis): number {
  let score = 0;

  // Interactivity ratio is the primary driver (0-10 points)
  score += analysis.interactivityRatio * 10;

  // Dependency depth adds complexity (0-3 points)
  score += Math.min(analysis.dependencyDepth, 5) * 0.6;

  // Dependency edges add complexity (0-2 points)
  score += Math.min(analysis.dependencyEdges, 10) * 0.2;

  return Math.round(score * 10) / 10;
}

export default {
  analyzeElementInteractivity,
  calculateInteractivityScore,
};
