/**
 * Composite Scorer Tests
 *
 * Tests for the weighted composite scoring system
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCompositeScore,
  isValidScenario,
  DEFAULT_WEIGHTS,
  ANALYZER_VERSION,
  type CompositeScoreInput,
} from '../../src/scoring/composite-scorer';
import { analyzeWoodMetrics, type WoodAnalysisInput } from '../../src/analyzers/wood-analyzer';
import {
  analyzeCampbellAttributes,
  type CampbellAnalysisInput,
} from '../../src/analyzers/campbell-analyzer';
import { analyzeLiuLiDimensions, type LiuLiAnalysisInput } from '../../src/analyzers/liuli-analyzer';
import {
  analyzeElementInteractivity,
  type ElementInteractivityInput,
} from '../../src/analyzers/interactivity-analyzer';

// Helper to create complete input from scenario
function createCompositeInput(
  intendedTier: 'simple' | 'moderate' | 'complex',
  content: string,
  calculationSteps: string[] = [],
): CompositeScoreInput {
  const woodInput: WoodAnalysisInput = { content, calculationSteps };
  const campbellInput: CampbellAnalysisInput = { content };
  const liuLiInput: LiuLiAnalysisInput = { content };

  const woodMetrics = analyzeWoodMetrics(woodInput);
  const campbellAttributes = analyzeCampbellAttributes(campbellInput);
  const liuLiDimensions = analyzeLiuLiDimensions(liuLiInput);

  const interactivityInput: ElementInteractivityInput = {
    content,
    woodTotalElements: woodMetrics.totalElements,
  };
  const elementInteractivity = analyzeElementInteractivity(interactivityInput);

  return {
    intendedTier,
    woodMetrics,
    campbellAttributes,
    liuLiDimensions,
    elementInteractivity,
  };
}

describe('Composite Scorer', () => {
  describe('calculateCompositeScore', () => {
    it('should calculate score for simple scenario', () => {
      const input = createCompositeInput(
        'simple',
        'Calculate the sum of 5 and 10.',
        ['Add numbers'],
      );

      const result = calculateCompositeScore(input);

      expect(result).toBeDefined();
      expect(typeof result.overallScore).toBe('number');
      expect(result.intendedTier).toBe('simple');
      expect(result.predictedTier).toBeDefined();
      expect(['simple', 'moderate', 'complex']).toContain(result.predictedTier);
    });

    it('should calculate score for moderate scenario', () => {
      const input = createCompositeInput(
        'moderate',
        `
          Compare 4 departments:
          - Engineering: $500K
          - Sales: $400K
          - Marketing: $300K
          - Operations: $200K
          Calculate growth rates and rank.
        `,
        ['Get data', 'Calculate growth', 'Rank', 'Report'],
      );

      const result = calculateCompositeScore(input);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.calculationBreakdown).toBeDefined();
    });

    it('should calculate score for complex scenario', () => {
      const input = createCompositeInput(
        'complex',
        `
          Strategic portfolio optimization with trade-offs:
          - Multiple approaches possible
          - Conflicting objectives
          - Uncertain market conditions
          - 10+ business units
          - Probability of success varies
          Novel analysis required with no precedent.
        `,
        ['Analyze', 'Model', 'Optimize', 'Trade-off', 'Recommend'],
      );

      const result = calculateCompositeScore(input);

      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('should include calculation breakdown', () => {
      const input = createCompositeInput('simple', 'Simple task');
      const result = calculateCompositeScore(input);

      expect(result.calculationBreakdown).toBeDefined();
      expect(typeof result.calculationBreakdown.woodScore).toBe('number');
      expect(typeof result.calculationBreakdown.campbellScore).toBe('number');
      expect(typeof result.calculationBreakdown.liuLiScore).toBe('number');
      expect(typeof result.calculationBreakdown.interactivityScore).toBe('number');
    });

    it('should include analyzer version', () => {
      const input = createCompositeInput('simple', 'Task');
      const result = calculateCompositeScore(input);

      expect(result.analyzerVersion).toBe(ANALYZER_VERSION);
    });

    it('should determine tier match correctly', () => {
      const simpleContent = 'Add 5 + 10';
      const simpleInput = createCompositeInput('simple', simpleContent, ['Add']);
      const simpleResult = calculateCompositeScore(simpleInput);

      // Simple content should match simple tier or be close
      expect(simpleResult.tierMatch).toBeDefined();
      expect(typeof simpleResult.tierMatch).toBe('boolean');
    });
  });

  describe('isValidScenario', () => {
    it('should validate scenario against config', () => {
      const input = createCompositeInput('simple', 'Simple addition', ['Add']);
      const score = calculateCompositeScore(input);

      const isValid = isValidScenario(score);

      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('DEFAULT_WEIGHTS', () => {
    it('should have all framework weights', () => {
      expect(DEFAULT_WEIGHTS.wood).toBeDefined();
      expect(DEFAULT_WEIGHTS.campbell).toBeDefined();
      expect(DEFAULT_WEIGHTS.liuLi).toBeDefined();
      expect(DEFAULT_WEIGHTS.interactivity).toBeDefined();
    });

    it('should sum to 1', () => {
      const total =
        DEFAULT_WEIGHTS.wood +
        DEFAULT_WEIGHTS.campbell +
        DEFAULT_WEIGHTS.liuLi +
        DEFAULT_WEIGHTS.interactivity;

      expect(total).toBeCloseTo(1.0, 5);
    });

    it('should have positive weights', () => {
      expect(DEFAULT_WEIGHTS.wood).toBeGreaterThan(0);
      expect(DEFAULT_WEIGHTS.campbell).toBeGreaterThan(0);
      expect(DEFAULT_WEIGHTS.liuLi).toBeGreaterThan(0);
      expect(DEFAULT_WEIGHTS.interactivity).toBeGreaterThan(0);
    });
  });

  describe('ANALYZER_VERSION', () => {
    it('should be a semver string', () => {
      expect(ANALYZER_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
