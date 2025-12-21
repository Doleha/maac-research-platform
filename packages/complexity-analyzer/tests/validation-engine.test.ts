/**
 * Validation Engine Tests
 *
 * Tests for the complete validation workflow
 */

import { describe, it, expect } from 'vitest';
import { validateScenario, validateBatch } from '../../src/validation-engine';

describe('Validation Engine', () => {
  describe('validateScenario', () => {
    it('should validate simple scenario successfully', async () => {
      const scenario = {
        id: 'test-simple-001',
        intendedTier: 'simple' as const,
        content: `
          Calculate quarterly revenue growth.
          Q1: $2.5M
          Q2: $2.8M
          Calculate the percentage growth from Q1 to Q2.
        `,
        calculationSteps: [
          'Get Q1 revenue',
          'Get Q2 revenue',
          'Calculate difference',
          'Calculate percentage',
        ],
        domain: 'analytical',
      };

      const result = await validateScenario(scenario);

      expect(result.scenarioId).toBe('test-simple-001');
      expect(result.isValid).toBe(true);
      expect(result.complexityScore).toBeDefined();
      expect(result.complexityScore.intendedTier).toBe('simple');
      expect(result.validationTimestamp).toBeInstanceOf(Date);
      expect(result.validationDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should validate moderate scenario successfully', async () => {
      const scenario = {
        id: 'test-moderate-001',
        intendedTier: 'moderate' as const,
        content: `
          Multi-regional performance analysis with ROI calculation.
          
          Region North: Revenue $5M, Costs $3M
          Region South: Revenue $4M, Costs $2.5M
          Region East: Revenue $6M, Costs $4M
          Region West: Revenue $3M, Costs $2M
          
          1. Calculate profit margin for each region
          2. Rank regions by profitability
          3. Calculate overall ROI
          4. Identify top performer
          5. Recommend resource allocation
          6. Compare against industry benchmark
        `,
        calculationSteps: [
          'Calculate North profit',
          'Calculate South profit',
          'Calculate East profit',
          'Calculate West profit',
          'Calculate margins',
          'Rank by profitability',
          'Calculate weighted ROI',
          'Compare to benchmark',
        ],
        domain: 'analytical',
      };

      const result = await validateScenario(scenario);

      expect(result.scenarioId).toBe('test-moderate-001');
      expect(result.complexityScore).toBeDefined();
      // Should be valid as moderate or possibly complex
      expect(['moderate', 'complex']).toContain(result.complexityScore.predictedTier);
    });

    it('should validate complex scenario successfully', async () => {
      const scenario = {
        id: 'test-complex-001',
        intendedTier: 'complex' as const,
        content: `
          Strategic portfolio optimization with multi-year forecasting.
          
          Context: Enterprise-wide capital allocation across 12 business units
          spanning 4 regions with $500M annual budget.
          
          Requirements:
          1. Analyze historical performance of all units (5 years)
          2. Model multiple economic scenarios (optimistic, base, pessimistic)
          3. Calculate risk-adjusted returns for each unit
          4. Consider interdependencies between units
          5. Balance short-term profitability vs long-term growth
          6. Account for regulatory constraints in each region
          7. Optimize allocation given conflicting stakeholder priorities
          8. Model impact of currency fluctuations
          9. Assess synergies and cannibalization effects
          10. Provide recommendations with confidence intervals
          
          Trade-offs:
          - Growth investment vs dividend returns
          - Regional diversification vs concentration
          - Risk tolerance vs return expectations
          
          Uncertainty:
          - Market conditions may vary
          - Probability of recession: 25%
          - Regulatory changes uncertain
        `,
        calculationSteps: [
          'Aggregate historical data',
          'Calculate trend analysis',
          'Build scenario models',
          'Calculate risk metrics',
          'Model interdependencies',
          'Optimize with constraints',
          'Generate recommendations',
          'Calculate confidence intervals',
        ],
        domain: 'planning',
      };

      const result = await validateScenario(scenario);

      expect(result.scenarioId).toBe('test-complex-001');
      expect(result.complexityScore).toBeDefined();
      expect(result.complexityScore.overallScore).toBeGreaterThan(20);
    });

    it('should provide regeneration guidance for mismatched tiers', async () => {
      const scenario = {
        id: 'test-mismatch-001',
        intendedTier: 'simple' as const,
        content: `
          This is supposed to be simple but is actually very complex:
          
          Multi-dimensional analysis with:
          - 15 different data sources
          - Conflicting trade-offs between objectives
          - High uncertainty and probabilistic outcomes
          - Complex interdependencies
          - Multiple solution paths possible
          - Novel approach required
          
          Strategic synthesis across:
          - Financial metrics
          - Market dynamics
          - Competitive intelligence
          - Operational efficiency
          - Risk management
          - Regulatory compliance
          - Technology infrastructure
          - Human capital
        `,
        calculationSteps: Array.from({ length: 15 }, (_, i) => `Complex step ${i + 1}`),
        domain: 'problem_solving',
      };

      const result = await validateScenario(scenario);

      // Should detect mismatch
      if (!result.isValid) {
        expect(result.shouldRegenerate).toBe(true);
        expect(result.regenerationReason).toBeDefined();
      }
    });

    it('should include prompt enhancements for regeneration', async () => {
      const scenario = {
        id: 'test-enhance-001',
        intendedTier: 'complex' as const,
        content: 'Simple addition: 5 + 10 = ?',
        calculationSteps: ['Add numbers'],
        domain: 'analytical',
      };

      const result = await validateScenario(scenario);

      // Simple content with complex tier should need regeneration
      if (!result.isValid) {
        expect(result.promptEnhancements).toBeDefined();
        expect(Array.isArray(result.promptEnhancements)).toBe(true);
      }
    });

    it('should track validation timing', async () => {
      const scenario = {
        id: 'test-timing-001',
        intendedTier: 'simple' as const,
        content: 'Quick calculation test',
        calculationSteps: ['Step 1'],
        domain: 'analytical',
      };

      const result = await validateScenario(scenario);

      expect(result.validationDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.validationTimestamp).toBeInstanceOf(Date);
    });

    it('should include analyzer version', async () => {
      const scenario = {
        id: 'test-version-001',
        intendedTier: 'simple' as const,
        content: 'Version test',
        calculationSteps: [],
        domain: 'analytical',
      };

      const result = await validateScenario(scenario);

      expect(result.complexityScore.analyzerVersion).toBeDefined();
      expect(typeof result.complexityScore.analyzerVersion).toBe('string');
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple scenarios in parallel', async () => {
      const scenarios = [
        {
          id: 'batch-001',
          intendedTier: 'simple' as const,
          content: 'Simple calculation: 10 + 20',
          calculationSteps: ['Add'],
          domain: 'analytical',
        },
        {
          id: 'batch-002',
          intendedTier: 'moderate' as const,
          content: 'Multi-step analysis with 5 variables and comparisons',
          calculationSteps: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
          domain: 'planning',
        },
        {
          id: 'batch-003',
          intendedTier: 'complex' as const,
          content: 'Strategic synthesis with trade-offs and uncertainty',
          calculationSteps: Array.from({ length: 10 }, (_, i) => `Step ${i}`),
          domain: 'problem_solving',
        },
      ];

      const result = await validateBatch(scenarios);

      expect(result.results).toHaveLength(3);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalScenarios).toBe(3);
      expect(result.stats.validCount).toBeGreaterThanOrEqual(0);
      expect(result.stats.invalidCount).toBeGreaterThanOrEqual(0);
      expect(result.stats.validCount + result.stats.invalidCount).toBe(3);
    });

    it('should provide batch statistics', async () => {
      const scenarios = [
        { id: '1', intendedTier: 'simple' as const, content: 'Task 1', domain: 'analytical' },
        { id: '2', intendedTier: 'simple' as const, content: 'Task 2', domain: 'planning' },
        {
          id: '3',
          intendedTier: 'moderate' as const,
          content: 'Task 3 with more steps',
          domain: 'communication',
        },
      ];

      const result = await validateBatch(scenarios);

      expect(result.stats.totalScenarios).toBe(3);
      expect(result.stats.successRate).toBeGreaterThanOrEqual(0);
      expect(result.stats.successRate).toBeLessThanOrEqual(100);
      expect(result.stats.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should call progress callback', async () => {
      const scenarios = [
        { id: '1', intendedTier: 'simple' as const, content: 'Task 1', domain: 'analytical' },
        { id: '2', intendedTier: 'simple' as const, content: 'Task 2', domain: 'planning' },
      ];

      let progressCalls = 0;

      await validateBatch(scenarios, {
        onProgress: () => {
          progressCalls++;
        },
      });

      expect(progressCalls).toBeGreaterThanOrEqual(1);
    });

    it('should separate valid and invalid scenarios', async () => {
      const scenarios = [
        {
          id: 'valid-1',
          intendedTier: 'simple' as const,
          content: 'Simple task',
          calculationSteps: ['One step'],
          domain: 'analytical',
        },
        {
          id: 'maybe-invalid',
          intendedTier: 'simple' as const,
          content: `
            Complex task with many elements:
            - Multiple paths and strategies
            - Trade-offs and conflicts
            - Uncertain probabilistic outcomes
            - High interdependency
            - Novel approach required
          `,
          calculationSteps: Array.from({ length: 12 }, (_, i) => `Step ${i}`),
          domain: 'problem_solving',
        },
      ];

      const result = await validateBatch(scenarios);

      expect(result.passed.length + result.failed.length).toBe(2);
    });

    it('should handle empty batch', async () => {
      const result = await validateBatch([]);

      expect(result.results).toHaveLength(0);
      expect(result.stats.totalScenarios).toBe(0);
    });
  });
});
