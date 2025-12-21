/**
 * Integration Tests - Complete Validation Pipeline
 *
 * End-to-end tests for the entire complexity validation workflow
 */

import { describe, it, expect } from 'vitest';
import { validateScenario, validateBatch, type ScenarioInput } from '../../src/validation-engine';

describe('Integration: Complete Validation Pipeline', () => {
  describe('Full Scenario Analysis', () => {
    it('should analyze simple scenario through entire pipeline', async () => {
      const simpleScenario: ScenarioInput = {
        id: 'integration-simple',
        intendedTier: 'simple',
        content: `
          Calculate the monthly expense ratio.
          Total monthly expenses: $8,500
          Total monthly income: $12,000
          Express the ratio as a percentage.
        `,
        calculationSteps: [
          'Get total expenses',
          'Get total income',
          'Divide expenses by income',
          'Convert to percentage',
        ],
        domain: 'analytical',
      };

      const result = await validateScenario(simpleScenario);

      expect(result.scenarioId).toBe('integration-simple');
      expect(result.complexityScore).toBeDefined();
      expect(result.complexityScore.woodScore).toBeDefined();
      expect(result.complexityScore.campbellScore).toBeDefined();
      expect(result.complexityScore.liuLiScore).toBeDefined();
      expect(result.complexityScore.interactivityScore).toBeDefined();
      expect(result.validationTimestamp).toBeInstanceOf(Date);
    });

    it('should analyze moderate scenario through entire pipeline', async () => {
      const moderateScenario: ScenarioInput = {
        id: 'integration-moderate',
        intendedTier: 'moderate',
        content: `
          Quarterly Performance Analysis
          
          Compare department performance across 4 departments:
          - Engineering: Revenue $2.5M, Cost $1.8M, Headcount 45
          - Sales: Revenue $4.2M, Cost $2.1M, Headcount 32
          - Marketing: Cost $800K, Headcount 15
          - Operations: Cost $1.2M, Headcount 28
          
          Tasks:
          1. Calculate profit for revenue departments
          2. Calculate cost per employee for all
          3. Rank by efficiency
          4. Identify top and bottom performers
          5. Recommend adjustments
        `,
        calculationSteps: [
          'Calculate Engineering profit',
          'Calculate Sales profit',
          'Calculate cost per employee',
          'Create ranking',
          'Identify performers',
          'Make recommendations',
        ],
        domain: 'analytical',
      };

      const result = await validateScenario(moderateScenario);

      expect(result.scenarioId).toBe('integration-moderate');
      expect(result.complexityScore.overallScore).toBeGreaterThan(0);
    });

    it('should analyze complex scenario through entire pipeline', async () => {
      const complexScenario: ScenarioInput = {
        id: 'integration-complex',
        intendedTier: 'complex',
        content: `
          Enterprise Digital Transformation Strategy
          
          Context: Fortune 500 company undergoing transformation
          across all business units with $150M technology budget.
          
          Strategic Analysis Requirements:
          1. Assess current technology maturity
          2. Identify priorities with conflicting stakeholder needs
          3. Model 3 scenarios (conservative, balanced, aggressive)
          4. Calculate ROI with uncertainty ranges
          5. Analyze interdependencies
          6. Account for regulatory requirements
          7. Balance short-term disruption vs long-term value
          8. Consider talent availability
          9. Model competitive response scenarios
          10. Develop phased implementation roadmap
          
          Trade-offs to Balance:
          - Speed vs risk mitigation
          - Global standardization vs local customization
          - Cost optimization vs capability building
          
          Uncertainty Factors:
          - Technology evolution (high uncertainty)
          - Market conditions (moderate uncertainty)
          - Regulatory changes (uncertain)
        `,
        calculationSteps: [
          'Assess maturity',
          'Stakeholder analysis',
          'Build scenarios',
          'Calculate ROI variations',
          'Map interdependencies',
          'Check regulatory',
          'Impact analysis',
          'Talent assessment',
          'Competitive modeling',
          'Create roadmap',
        ],
        domain: 'planning',
      };

      const result = await validateScenario(complexScenario);

      expect(result.scenarioId).toBe('integration-complex');
      expect(result.complexityScore.overallScore).toBeGreaterThan(10);
    });
  });

  describe('Tier Mismatch Detection', () => {
    it('should detect simple content labeled as complex', async () => {
      const mismatchedScenario: ScenarioInput = {
        id: 'mismatch-simple-as-complex',
        intendedTier: 'complex',
        content: 'Add 5 + 3 to get the total.',
        calculationSteps: ['Add the numbers'],
        domain: 'analytical',
      };

      const result = await validateScenario(mismatchedScenario);

      // Simple content with complex tier should fail or show mismatch
      expect(result.complexityScore.predictedTier).not.toBe('complex');
    });
  });

  describe('Batch Processing', () => {
    it('should process mixed batch correctly', async () => {
      const mixedBatch: ScenarioInput[] = [
        {
          id: 'batch-simple',
          intendedTier: 'simple',
          content: 'Calculate 15% tip on $85 restaurant bill.',
          calculationSteps: ['Multiply 85 by 0.15'],
          domain: 'analytical',
        },
        {
          id: 'batch-moderate',
          intendedTier: 'moderate',
          content: `
            Compare 3 investment options:
            - Option A: 4% return, low risk
            - Option B: 7% return, medium risk
            - Option C: 12% return, high risk
            Calculate risk-adjusted returns and recommend.
          `,
          calculationSteps: [
            'Calculate A return',
            'Calculate B return',
            'Calculate C return',
            'Apply risk adjustment',
            'Rank options',
            'Make recommendation',
          ],
          domain: 'planning',
        },
      ];

      const batchResult = await validateBatch(mixedBatch);

      expect(batchResult.results).toHaveLength(2);
      expect(batchResult.stats.totalValidated).toBe(2);

      // Each result should have complete analysis
      for (const result of batchResult.results) {
        expect(result.complexityScore).toBeDefined();
        expect(result.complexityScore.overallScore).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle empty batch', async () => {
      const result = await validateBatch([]);

      expect(result.results).toHaveLength(0);
      expect(result.stats.totalValidated).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', async () => {
      const emptyScenario: ScenarioInput = {
        id: 'empty',
        intendedTier: 'simple',
        content: '',
        calculationSteps: [],
        domain: 'analytical',
      };

      const result = await validateScenario(emptyScenario);
      expect(result).toBeDefined();
      expect(result.complexityScore).toBeDefined();
    });

    it('should handle very long content', async () => {
      const longContent = 'Task description. '.repeat(100);
      const longScenario: ScenarioInput = {
        id: 'long',
        intendedTier: 'moderate',
        content: longContent,
        calculationSteps: Array.from({ length: 10 }, (_, i) => `Step ${i + 1}`),
        domain: 'planning',
      };

      const result = await validateScenario(longScenario);
      expect(result).toBeDefined();
    });

    it('should handle special characters in content', async () => {
      const specialScenario: ScenarioInput = {
        id: 'special',
        intendedTier: 'simple',
        content: 'Calculate: $1,000.00 × 15% + €500 - ¥200 (with uncertainty ±5%)',
        calculationSteps: ['Process special chars'],
        domain: 'analytical',
      };

      const result = await validateScenario(specialScenario);
      expect(result).toBeDefined();
    });
  });
});
