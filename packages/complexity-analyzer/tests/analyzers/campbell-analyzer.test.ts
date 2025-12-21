/**
 * Campbell Analyzer Tests
 *
 * Tests for the Campbell (1988) Four Sources of Complexity implementation
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeCampbellAttributes,
  calculateCampbellScore,
  type CampbellAnalysisInput,
} from '../../src/analyzers/campbell-analyzer';

describe('Campbell Analyzer', () => {
  describe('analyzeCampbellAttributes', () => {
    it('should analyze simple task with no complexity sources', () => {
      const input: CampbellAnalysisInput = {
        content: 'Calculate 10% of 500. Multiply 500 by 0.10 to get the answer.',
      };

      const result = analyzeCampbellAttributes(input);

      expect(result).toBeDefined();
      expect(typeof result.multiplePaths).toBe('boolean');
      expect(typeof result.multipleOutcomes).toBe('boolean');
      expect(typeof result.conflictingInterdependence).toBe('boolean');
    });

    it('should detect multiple paths when alternatives exist', () => {
      const input: CampbellAnalysisInput = {
        content: `
          Choose one approach:
          Option A: Use the simple average method
          Alternative B: Use the weighted average method
          Either approach could work depending on context.
        `,
        solutionApproaches: ['simple average', 'weighted average'],
        hasMultiplePaths: true,
      };

      const result = analyzeCampbellAttributes(input);

      expect(result.multiplePaths).toBe(true);
      expect(result.pathCount).toBeGreaterThanOrEqual(2);
    });

    it('should detect multiple outcomes', () => {
      const input: CampbellAnalysisInput = {
        content: `
          This analysis will produce several outcomes:
          - Revenue forecast
          - Cost projection
          - Profit margin
          - Growth rate
          Multiple objectives need to be balanced.
        `,
        objectives: ['revenue', 'cost', 'profit', 'growth'],
        hasMultipleOutcomes: true,
      };

      const result = analyzeCampbellAttributes(input);

      expect(result.multipleOutcomes).toBe(true);
      expect(result.outcomeCount).toBeGreaterThanOrEqual(2);
    });

    it('should detect conflicting interdependence with trade-offs', () => {
      const input: CampbellAnalysisInput = {
        content: `
          There is a trade-off between speed and quality.
          We must balance short-term gains versus long-term sustainability.
          Competing priorities: cost reduction conflicts with capability building.
        `,
        tradeoffs: ['speed vs quality', 'short-term vs long-term'],
        hasConflicts: true,
      };

      const result = analyzeCampbellAttributes(input);

      expect(result.conflictingInterdependence).toBe(true);
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should detect uncertain linkages with probabilistic language', () => {
      const input: CampbellAnalysisInput = {
        content: `
          The outcome is uncertain and may vary.
          Probability of success: approximately 60-70%.
          Market conditions are unpredictable.
          Results could range from $1M to $5M.
        `,
        informationGaps: ['market conditions', 'exact probability'],
        hasUncertainty: true,
      };

      const result = analyzeCampbellAttributes(input);

      expect(result.uncertaintyLevel).toBeDefined();
      expect(['none', 'bounded', 'high']).toContain(result.uncertaintyLevel);
    });
  });

  describe('calculateCampbellScore', () => {
    it('should return low score for simple task', () => {
      const input: CampbellAnalysisInput = {
        content: 'Add two numbers together.',
      };

      const attributes = analyzeCampbellAttributes(input);
      const score = calculateCampbellScore(attributes);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should return higher score for complex task with multiple sources', () => {
      const simpleInput: CampbellAnalysisInput = {
        content: 'Add two numbers.',
      };

      const complexInput: CampbellAnalysisInput = {
        content: `
          Multiple approaches possible: method A or method B.
          Several outcomes: revenue, cost, and margin.
          Trade-offs between speed and quality.
          Uncertainty in market conditions.
          Probability of success unknown.
        `,
        hasMultiplePaths: true,
        hasMultipleOutcomes: true,
        hasConflicts: true,
        hasUncertainty: true,
      };

      const simpleAttrs = analyzeCampbellAttributes(simpleInput);
      const complexAttrs = analyzeCampbellAttributes(complexInput);

      const simpleScore = calculateCampbellScore(simpleAttrs);
      const complexScore = calculateCampbellScore(complexAttrs);

      expect(complexScore).toBeGreaterThanOrEqual(simpleScore);
    });
  });
});
