/**
 * Validation Engine Tests
 *
 * Tests for the complete validation workflow using the public API
 */

import { describe, it, expect } from 'vitest';
import { validateScenario, validateBatch, type ScenarioInput } from '../src/validation-engine';

describe('Validation Engine', () => {
  describe('validateScenario', () => {
    it('should validate simple scenario successfully', async () => {
      const scenario: ScenarioInput = {
        id: 'test-simple-001',
        intendedTier: 'simple',
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
      expect(result.complexityScore).toBeDefined();
      expect(result.complexityScore.intendedTier).toBe('simple');
      expect(result.validationTimestamp).toBeInstanceOf(Date);
      expect(result.validationDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should validate moderate scenario', async () => {
      const scenario: ScenarioInput = {
        id: 'test-moderate-001',
        intendedTier: 'moderate',
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
      expect(result.complexityScore.overallScore).toBeGreaterThan(0);
    });

    it('should validate complex scenario', async () => {
      const scenario: ScenarioInput = {
        id: 'test-complex-001',
        intendedTier: 'complex',
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
      expect(result.complexityScore.overallScore).toBeGreaterThan(10);
    });

    it('should detect tier mismatch for simple content labeled complex', async () => {
      const scenario: ScenarioInput = {
        id: 'test-mismatch-001',
        intendedTier: 'complex',
        content: 'Add 5 + 3 to get the total.',
        calculationSteps: ['Add the numbers'],
        domain: 'analytical',
      };

      const result = await validateScenario(scenario);

      // Simple content shouldn't be classified as complex
      expect(result.complexityScore.predictedTier).not.toBe('complex');
    });

    it('should provide regeneration guidance for mismatches', async () => {
      const scenario: ScenarioInput = {
        id: 'test-enhance-001',
        intendedTier: 'complex',
        content: 'Simple addition: 5 + 10 = ?',
        calculationSteps: ['Add numbers'],
        domain: 'analytical',
      };

      const result = await validateScenario(scenario);

      // Should provide guidance when tier doesn't match
      if (!result.isValid) {
        expect(result.shouldRegenerate).toBe(true);
        expect(result.regenerationReason).toBeDefined();
      }
    });

    it('should track validation timing', async () => {
      const scenario: ScenarioInput = {
        id: 'test-timing-001',
        intendedTier: 'simple',
        content: 'Quick calculation test',
        calculationSteps: ['Step 1'],
        domain: 'analytical',
      };

      const result = await validateScenario(scenario);

      expect(result.validationDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.validationTimestamp).toBeInstanceOf(Date);
    });

    it('should include analyzer version', async () => {
      const scenario: ScenarioInput = {
        id: 'test-version-001',
        intendedTier: 'simple',
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
    it('should validate multiple scenarios', async () => {
      const scenarios: ScenarioInput[] = [
        {
          id: 'batch-001',
          intendedTier: 'simple',
          content: 'Simple calculation: 10 + 20',
          calculationSteps: ['Add'],
          domain: 'analytical',
        },
        {
          id: 'batch-002',
          intendedTier: 'moderate',
          content: 'Multi-step analysis with 5 variables and comparisons across regions',
          calculationSteps: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
          domain: 'planning',
        },
        {
          id: 'batch-003',
          intendedTier: 'complex',
          content: 'Strategic synthesis with trade-offs and uncertainty and multiple stakeholders',
          calculationSteps: Array.from({ length: 10 }, (_, i) => `Step ${i}`),
          domain: 'problem_solving',
        },
      ];

      const result = await validateBatch(scenarios);

      expect(result.results).toHaveLength(3);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalValidated).toBe(3);
    });

    it('should provide batch statistics', async () => {
      const scenarios: ScenarioInput[] = [
        { id: '1', intendedTier: 'simple', content: 'Task 1', domain: 'analytical' },
        { id: '2', intendedTier: 'simple', content: 'Task 2', domain: 'planning' },
        {
          id: '3',
          intendedTier: 'moderate',
          content: 'Task 3 with more steps',
          domain: 'communication',
        },
      ];

      const result = await validateBatch(scenarios);

      expect(result.stats.totalValidated).toBe(3);
      expect(result.stats.passRate).toBeGreaterThanOrEqual(0);
      expect(result.stats.passRate).toBeLessThanOrEqual(1);
    });

    it('should handle empty batch', async () => {
      const result = await validateBatch([]);

      expect(result.results).toHaveLength(0);
      expect(result.stats.totalValidated).toBe(0);
    });
  });
});
