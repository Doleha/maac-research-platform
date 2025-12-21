/**
 * Quick Analysis Function
 *
 * Convenience function for analyzing scenario complexity
 * without the full validation pipeline.
 */

import type { ComplexityScore, ComplexityValidationConfig } from '@maac/types';

import { analyzeWoodMetrics } from './analyzers/wood-analyzer';
import { analyzeCampbellAttributes } from './analyzers/campbell-analyzer';
import { analyzeLiuLiDimensions } from './analyzers/liuli-analyzer';
import { analyzeElementInteractivity } from './analyzers/interactivity-analyzer';
import { calculateCompositeScore } from './scoring/composite-scorer';

/**
 * Quick analysis input
 */
export interface AnalyzeInput {
  /** Scenario content */
  content: string;

  /** Intended complexity tier */
  intendedTier: 'simple' | 'moderate' | 'complex';

  /** Optional pre-parsed data */
  calculationSteps?: string[];
  variables?: Array<{ name: string; type: string; dependsOn?: string[] }>;
  relationships?: Array<{ from: string; to: string; type: string }>;
  domain?: string;

  /** Configuration overrides */
  config?: Partial<ComplexityValidationConfig>;
}

/**
 * Analyzes scenario complexity and returns the full score breakdown
 */
export function analyzeComplexity(input: AnalyzeInput): ComplexityScore {
  const { content, intendedTier, calculationSteps, variables, relationships, domain } = input;

  // Run Wood analyzer
  const woodMetrics = analyzeWoodMetrics({
    content,
    calculationSteps,
    variables: variables?.map((v) => v.name),
    dependencies: relationships?.map((r) => ({ from: r.from, to: r.to })),
  });

  // Run Campbell analyzer
  const campbellAttributes = analyzeCampbellAttributes({
    content,
  });

  // Run Liu & Li analyzer
  const liuLiDimensions = analyzeLiuLiDimensions({
    content,
    entityCount: variables?.length,
    entityTypes: variables?.map((v) => v.type),
    variables,
    relationships,
    domain,
    calculationSteps: calculationSteps?.map((step) => ({ step })),
  });

  // Run interactivity analyzer
  const elementInteractivity = analyzeElementInteractivity({
    content,
    woodTotalElements: woodMetrics.totalElements,
    variables,
  });

  // Calculate composite score
  return calculateCompositeScore({
    intendedTier,
    woodMetrics,
    campbellAttributes,
    liuLiDimensions,
    elementInteractivity,
    config: input.config as ComplexityValidationConfig,
  });
}

export default analyzeComplexity;
