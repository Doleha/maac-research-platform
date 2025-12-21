/**
 * Campbell Analyzer Tests
 *
 * Tests for the Campbell (1988) Four Sources of Complexity implementation
 */

import { describe, it, expect } from 'vitest';
import { analyzeCampbellAttributes, calculateCampbellScore, getCampbellTypeDescription } from '../../src/analyzers/campbell-analyzer';

describe('Campbell Analyzer', () => {
  describe('analyzeCampbellAttributes', () => {
    it('should identify no complexity sources in simple task', () => {
      const input = {
        taskDescription: 'Add two numbers: 5 + 10. Return the sum.',
        successCriteria: ['Calculate correct sum'],
        solutionPaths: ['Direct addition'],
      };

      const result = analyzeCampbellAttributes(input);

      expect(result.multiplePaths).toBe(false);
      expect(result.multipleOutcomes).toBe(false);
      expect(result.conflictingInterdependence).toBe(false);
      expect(result.uncertainLinkages).toBe('low');
    });

    it('should detect multiple paths when alternatives exist', () => {
      const input = {
        taskDescription: `
          Optimize the marketing budget.
          You could either:
          - Focus on digital marketing channels
          - Or invest in traditional advertising
          - Or use a hybrid approach
          Different strategies may work.
        `,
        successCriteria: ['Maximize ROI'],
        solutionPaths: ['Digital-first', 'Traditional', 'Hybrid'],
      };

      const result = analyzeCampbellAttributes(input);

      expect(result.multiplePaths).toBe(true);
    });

    it('should detect multiple outcomes', () => {
      const input = {
        taskDescription: `
          Analyze potential outcomes of the investment.
          Several scenarios are possible:
          - Best case: 20% return
          - Base case: 10% return
          - Worst case: -5% return
          Different outcomes depending on market conditions.
        `,
        successCriteria: [
          'Calculate best case return',
          'Calculate base case return',
          'Calculate worst case return',
          'Assess overall risk profile',
        ],
        solutionPaths: [],
      };

      const result = analyzeCampbellAttributes(input);

      expect(result.multipleOutcomes).toBe(true);
    });

    it('should detect conflicting interdependence with trade-offs', () => {
      const input = {
        taskDescription: `
          Balance the following conflicting objectives:
          - Maximize profit vs minimize environmental impact
          - Short-term gains vs long-term sustainability
          - Cost reduction vs quality maintenance
          You must make trade-offs between competing priorities.
          These goals are mutually exclusive in some aspects.
        `,
        successCriteria: [
          'Optimize profit',
          'Maintain quality',
          'Reduce environmental impact',
        ],
        solutionPaths: [],
      };

      const result = analyzeCampbellAttributes(input);

      expect(result.conflictingInterdependence).toBe(true);
    });

    it('should detect uncertain linkages with probabilistic language', () => {
      const input = {
        taskDescription: `
          Forecast market conditions for next quarter.
          Note: Economic indicators are uncertain.
          There is approximately 60% probability of growth.
          Results may vary depending on external factors.
          The relationship between inflation and demand is unclear.
        `,
        successCriteria: ['Provide probability-weighted forecast'],
        solutionPaths: [],
      };

      const result = analyzeCampbellAttributes(input);

      expect(['moderate', 'high']).toContain(result.uncertainLinkages);
    });

    it('should detect all four sources in highly complex task', () => {
      const input = {
        taskDescription: `
          Strategic planning exercise with multiple dimensions:
          
          1. You must choose between three strategic alternatives:
             - Market expansion
             - Product diversification
             - Operational efficiency
          
          2. Each strategy leads to different potential outcomes.
          
          3. Trade-offs exist between:
             - Short-term profitability vs long-term market share
             - Risk tolerance vs growth potential
             Conflicting priorities must be balanced.
          
          4. Market conditions are uncertain:
             - 40% probability of recession
             - The relationship between our actions and outcomes is unclear
             - May or might see various results
        `,
        successCriteria: [
          'Select optimal strategy',
          'Model multiple scenarios',
          'Balance competing objectives',
          'Account for uncertainty',
        ],
        solutionPaths: ['Expansion', 'Diversification', 'Efficiency'],
      };

      const result = analyzeCampbellAttributes(input);

      expect(result.multiplePaths).toBe(true);
      expect(result.multipleOutcomes).toBe(true);
      expect(result.conflictingInterdependence).toBe(true);
      expect(['moderate', 'high']).toContain(result.uncertainLinkages);
    });
  });

  describe('calculateCampbellScore', () => {
    it('should return 0 for no complexity attributes', () => {
      const attributes = {
        multiplePaths: false,
        multipleOutcomes: false,
        conflictingInterdependence: false,
        uncertainLinkages: 'low' as const,
        pathCount: 1,
        outcomeCount: 1,
        conflictCount: 0,
        probabilisticElements: [],
      };

      const score = calculateCampbellScore(attributes);
      expect(score).toBe(0);
    });

    it('should add points for each complexity source', () => {
      const noAttributes = {
        multiplePaths: false,
        multipleOutcomes: false,
        conflictingInterdependence: false,
        uncertainLinkages: 'low' as const,
        pathCount: 1,
        outcomeCount: 1,
        conflictCount: 0,
        probabilisticElements: [],
      };

      const oneAttribute = {
        ...noAttributes,
        multiplePaths: true,
        pathCount: 3,
      };

      const twoAttributes = {
        ...oneAttribute,
        multipleOutcomes: true,
        outcomeCount: 3,
      };

      const baseScore = calculateCampbellScore(noAttributes);
      const oneScore = calculateCampbellScore(oneAttribute);
      const twoScore = calculateCampbellScore(twoAttributes);

      expect(oneScore).toBeGreaterThan(baseScore);
      expect(twoScore).toBeGreaterThan(oneScore);
    });

    it('should increase score with uncertain linkages level', () => {
      const lowUncertainty = {
        multiplePaths: false,
        multipleOutcomes: false,
        conflictingInterdependence: false,
        uncertainLinkages: 'low' as const,
        pathCount: 1,
        outcomeCount: 1,
        conflictCount: 0,
        probabilisticElements: [],
      };

      const moderateUncertainty = {
        ...lowUncertainty,
        uncertainLinkages: 'moderate' as const,
        probabilisticElements: ['may', 'possibly'],
      };

      const highUncertainty = {
        ...lowUncertainty,
        uncertainLinkages: 'high' as const,
        probabilisticElements: ['uncertain', 'probability', 'unclear', 'risk'],
      };

      const lowScore = calculateCampbellScore(lowUncertainty);
      const modScore = calculateCampbellScore(moderateUncertainty);
      const highScore = calculateCampbellScore(highUncertainty);

      expect(modScore).toBeGreaterThan(lowScore);
      expect(highScore).toBeGreaterThan(modScore);
    });
  });

  describe('getCampbellTypeDescription', () => {
    it('should return appropriate description for each type', () => {
      expect(getCampbellTypeDescription('multiplePaths')).toContain('path');
      expect(getCampbellTypeDescription('multipleOutcomes')).toContain('outcome');
      expect(getCampbellTypeDescription('conflictingInterdependence')).toContain('conflict');
      expect(getCampbellTypeDescription('uncertainLinkages')).toContain('uncertain');
    });
  });
});
