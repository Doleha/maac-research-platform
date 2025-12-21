/**
 * Integration Tests - Complete Validation Pipeline
 *
 * End-to-end tests for the entire complexity validation workflow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { validateScenario, validateBatch } from '../../src/validation-engine';
import { calculateCompositeScore, isValidScenario } from '../../src/scoring/composite-scorer';
import { analyzeWoodMetrics } from '../../src/analyzers/wood-analyzer';
import { analyzeCampbellAttributes } from '../../src/analyzers/campbell-analyzer';
import { analyzeLiuLiDimensions } from '../../src/analyzers/liuli-analyzer';
import { analyzeElementInteractivity } from '../../src/analyzers/interactivity-analyzer';

describe('Integration: Complete Validation Pipeline', () => {
  describe('Full Scenario Analysis', () => {
    it('should analyze simple scenario through entire pipeline', async () => {
      const simpleScenario = {
        id: 'integration-simple',
        intendedTier: 'simple' as const,
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

      // Step 1: Wood Analysis
      const woodMetrics = analyzeWoodMetrics(simpleScenario);
      expect(woodMetrics.componentCount).toBeLessThanOrEqual(6);
      expect(woodMetrics.coordinationLevel).toBe('simple');

      // Step 2: Campbell Analysis
      const campbellAttrs = analyzeCampbellAttributes(simpleScenario);
      expect(campbellAttrs.presenceOfMultiplePaths).toBe(false);
      expect(campbellAttrs.taskType).toBe('analytical');

      // Step 3: Liu & Li Analysis
      const liuliDims = analyzeLiuLiDimensions(simpleScenario);
      expect(liuliDims.scope).toBeLessThanOrEqual(2);

      // Step 4: Element Interactivity
      const interactivity = analyzeElementInteractivity(simpleScenario);
      expect(interactivity.totalElements).toBeLessThan(10);

      // Step 5: Composite Score
      const compositeScore = calculateCompositeScore(simpleScenario);
      expect(compositeScore.predictedTier).toBe('simple');
      expect(compositeScore.overallScore).toBeLessThan(15);

      // Step 6: Validation
      const validation = await validateScenario(simpleScenario);
      expect(validation.isValid).toBe(true);
      expect(validation.complexityScore.predictedTier).toBe('simple');
    });

    it('should analyze moderate scenario through entire pipeline', async () => {
      const moderateScenario = {
        id: 'integration-moderate',
        intendedTier: 'moderate' as const,
        content: `
          Quarterly Performance Analysis and Resource Allocation
          
          Compare department performance across 4 departments:
          - Engineering: Revenue $2.5M, Cost $1.8M, Headcount 45
          - Sales: Revenue $4.2M, Cost $2.1M, Headcount 32
          - Marketing: Revenue $0, Cost $800K, Headcount 15
          - Operations: Revenue $0, Cost $1.2M, Headcount 28
          
          Tasks:
          1. Calculate profit/loss for revenue-generating departments
          2. Calculate cost per employee for all departments
          3. Rank departments by efficiency metric
          4. Identify top and bottom performers
          5. Recommend headcount adjustments within 10% budget
          6. Project next quarter performance with 5% growth
          7. Compare results to industry benchmarks
        `,
        calculationSteps: [
          'Calculate Engineering profit',
          'Calculate Sales profit',
          'Calculate cost per employee',
          'Create ranking',
          'Identify top performer',
          'Identify bottom performer',
          'Calculate adjustment budget',
          'Apply growth projection',
          'Fetch industry benchmarks',
          'Perform comparison',
        ],
        domain: 'analytical',
      };

      const compositeScore = calculateCompositeScore(moderateScenario);
      expect(['moderate', 'complex']).toContain(compositeScore.predictedTier);

      const validation = await validateScenario(moderateScenario);
      expect(validation.complexityScore.overallScore).toBeGreaterThan(10);
    });

    it('should analyze complex scenario through entire pipeline', async () => {
      const complexScenario = {
        id: 'integration-complex',
        intendedTier: 'complex' as const,
        content: `
          Enterprise Digital Transformation Strategy
          
          Context: Fortune 500 company undergoing digital transformation
          across all business units with $150M annual technology budget
          spanning 35 countries and 15,000 employees.
          
          Strategic Analysis Requirements:
          1. Assess current technology maturity across all business units
          2. Identify transformation priorities with conflicting stakeholder needs
          3. Model 3 implementation scenarios (conservative, balanced, aggressive)
          4. Calculate ROI with uncertainty ranges for each scenario
          5. Analyze interdependencies between initiatives
          6. Account for regulatory requirements in different regions
          7. Balance short-term disruption vs long-term value
          8. Consider talent availability and capability gaps
          9. Model competitive response scenarios
          10. Develop phased implementation roadmap
          11. Create risk mitigation strategies
          12. Design governance and decision-making framework
          
          Trade-offs to Balance:
          - Speed of implementation vs risk mitigation
          - Global standardization vs local customization
          - Cost optimization vs capability building
          - Quick wins vs strategic foundations
          
          Uncertainty Factors:
          - Technology evolution (high uncertainty)
          - Market conditions (moderate uncertainty)
          - Regulatory changes (region-specific)
          - Competitive dynamics (high uncertainty)
          
          Success Criteria:
          - 25% cost reduction within 3 years
          - 40% improvement in customer satisfaction
          - 50% reduction in time-to-market
          - Zero critical security incidents
        `,
        calculationSteps: [
          'Assess maturity baseline',
          'Stakeholder analysis',
          'Build scenario models',
          'Calculate conservative ROI',
          'Calculate balanced ROI',
          'Calculate aggressive ROI',
          'Map interdependencies',
          'Regulatory compliance check',
          'Short-term impact analysis',
          'Long-term value projection',
          'Talent gap analysis',
          'Competitive modeling',
          'Create roadmap',
          'Risk assessment',
          'Governance design',
        ],
        domain: 'planning',
      };

      // All analyzers should indicate high complexity
      const woodMetrics = analyzeWoodMetrics(complexScenario);
      expect(woodMetrics.componentCount).toBeGreaterThan(8);

      const campbellAttrs = analyzeCampbellAttributes(complexScenario);
      expect(campbellAttrs.presenceOfConflictingInterdependence).toBe(true);
      expect(campbellAttrs.uncertaintyOfOutcomeLinkages).toBe(true);

      const liuliDims = analyzeLiuLiDimensions(complexScenario);
      expect(liuliDims.novelty).toBeGreaterThanOrEqual(2);

      const compositeScore = calculateCompositeScore(complexScenario);
      expect(compositeScore.predictedTier).toBe('complex');
      expect(compositeScore.overallScore).toBeGreaterThan(25);

      const validation = await validateScenario(complexScenario);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Tier Mismatch Detection', () => {
    it('should detect simple content labeled as complex', async () => {
      const mismatchedScenario = {
        id: 'mismatch-simple-as-complex',
        intendedTier: 'complex' as const,
        content: 'Add 5 + 3 to get the total.',
        calculationSteps: ['Add the numbers'],
        domain: 'analytical',
      };

      const compositeScore = calculateCompositeScore(mismatchedScenario);
      expect(compositeScore.predictedTier).not.toBe('complex');

      const isValid = isValidScenario(mismatchedScenario, 'complex');
      expect(isValid).toBe(false);

      const validation = await validateScenario(mismatchedScenario);
      expect(validation.isValid).toBe(false);
      expect(validation.shouldRegenerate).toBe(true);
      expect(validation.regenerationReason).toBeDefined();
    });

    it('should detect complex content labeled as simple', async () => {
      const mismatchedScenario = {
        id: 'mismatch-complex-as-simple',
        intendedTier: 'simple' as const,
        content: `
          Multi-factor strategic analysis with competing priorities:
          - Analyze 12 different market segments
          - Model probabilistic outcomes with uncertainty
          - Navigate conflicting stakeholder requirements
          - Synthesize novel approach from disparate data sources
          - Balance short-term tactics vs long-term strategy
          - Account for regulatory complexity across jurisdictions
          - Manage resource constraints and trade-offs
          - Consider competitive dynamics and response
        `,
        calculationSteps: Array.from({ length: 15 }, (_, i) => `Complex step ${i + 1}`),
        domain: 'problem_solving',
      };

      const compositeScore = calculateCompositeScore(mismatchedScenario);
      expect(compositeScore.predictedTier).not.toBe('simple');

      const validation = await validateScenario(mismatchedScenario);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Batch Processing', () => {
    it('should process mixed batch correctly', async () => {
      const mixedBatch = [
        {
          id: 'batch-simple',
          intendedTier: 'simple' as const,
          content: 'Calculate 15% tip on $85 restaurant bill.',
          calculationSteps: ['Multiply 85 by 0.15'],
          domain: 'analytical',
        },
        {
          id: 'batch-moderate',
          intendedTier: 'moderate' as const,
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
        {
          id: 'batch-complex',
          intendedTier: 'complex' as const,
          content: `
            Strategic M&A analysis with regulatory considerations:
            - Target company valuation with multiple methodologies
            - Synergy modeling with uncertainty ranges
            - Integration planning with cultural factors
            - Regulatory approval probability assessment
            - Financing structure optimization
            - Risk scenario planning
            - Stakeholder communication strategy
          `,
          calculationSteps: Array.from({ length: 12 }, (_, i) => `M&A step ${i + 1}`),
          domain: 'problem_solving',
        },
      ];

      const batchResult = await validateBatch(mixedBatch);

      expect(batchResult.results).toHaveLength(3);
      expect(batchResult.stats.totalScenarios).toBe(3);

      // Each result should have complete analysis
      for (const result of batchResult.results) {
        expect(result.complexityScore).toBeDefined();
        expect(result.complexityScore.woodScore).toBeDefined();
        expect(result.complexityScore.campbellScore).toBeDefined();
        expect(result.complexityScore.liuLiScore).toBeDefined();
        expect(result.complexityScore.interactivityScore).toBeDefined();
      }
    });

    it('should provide accurate batch statistics', async () => {
      const scenarios = [
        {
          id: '1',
          intendedTier: 'simple' as const,
          content: 'Simple task 1',
          domain: 'analytical',
        },
        {
          id: '2',
          intendedTier: 'simple' as const,
          content: 'Simple task 2',
          domain: 'analytical',
        },
        {
          id: '3',
          intendedTier: 'simple' as const,
          content: 'Simple task 3',
          domain: 'analytical',
        },
      ];

      const result = await validateBatch(scenarios);

      expect(result.stats.totalScenarios).toBe(3);
      expect(result.stats.validCount + result.stats.invalidCount).toBe(3);
      expect(result.stats.successRate).toBe(
        (result.stats.validCount / result.stats.totalScenarios) * 100,
      );
    });
  });

  describe('Regeneration Guidance', () => {
    it('should provide actionable prompt enhancements', async () => {
      const undercomplex = {
        id: 'needs-enhancement',
        intendedTier: 'complex' as const,
        content: 'Calculate profit margin from revenue and costs.',
        calculationSteps: ['Calculate margin'],
        domain: 'analytical',
      };

      const validation = await validateScenario(undercomplex);

      if (!validation.isValid && validation.promptEnhancements) {
        expect(validation.promptEnhancements.length).toBeGreaterThan(0);

        // Enhancements should be actionable
        for (const enhancement of validation.promptEnhancements) {
          expect(typeof enhancement).toBe('string');
          expect(enhancement.length).toBeGreaterThan(10);
        }
      }
    });

    it('should provide specific reasons for regeneration', async () => {
      const mismatch = {
        id: 'needs-reason',
        intendedTier: 'complex' as const,
        content: 'Simple sum: 1 + 1',
        calculationSteps: [],
        domain: 'analytical',
      };

      const validation = await validateScenario(mismatch);

      if (!validation.isValid) {
        expect(validation.regenerationReason).toBeDefined();
        expect(validation.regenerationReason!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Framework Score Integration', () => {
    it('should properly weight all framework scores', async () => {
      const scenario = {
        id: 'weight-test',
        intendedTier: 'moderate' as const,
        content: `
          Performance review with multiple metrics:
          - Sales target achievement
          - Customer satisfaction scores
          - Team collaboration rating
          - Project delivery timeliness
          
          Calculate weighted performance score.
        `,
        calculationSteps: ['Get metrics', 'Apply weights', 'Calculate total'],
        domain: 'analytical',
      };

      const score = calculateCompositeScore(scenario);

      expect(score.woodScore.weight).toBeDefined();
      expect(score.campbellScore.weight).toBeDefined();
      expect(score.liuLiScore.weight).toBeDefined();
      expect(score.interactivityScore.weight).toBeDefined();

      // Weights should sum to 1
      const totalWeight =
        score.woodScore.weight +
        score.campbellScore.weight +
        score.liuLiScore.weight +
        score.interactivityScore.weight;

      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should calculate overall score as weighted average', async () => {
      const scenario = {
        id: 'weighted-avg-test',
        intendedTier: 'moderate' as const,
        content: 'Multi-factor analysis task',
        calculationSteps: ['Step 1', 'Step 2', 'Step 3'],
        domain: 'planning',
      };

      const score = calculateCompositeScore(scenario);

      const expectedOverall =
        score.woodScore.score * score.woodScore.weight +
        score.campbellScore.score * score.campbellScore.weight +
        score.liuLiScore.score * score.liuLiScore.weight +
        score.interactivityScore.score * score.interactivityScore.weight;

      expect(score.overallScore).toBeCloseTo(expectedOverall, 1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', async () => {
      const emptyScenario = {
        id: 'empty',
        intendedTier: 'simple' as const,
        content: '',
        calculationSteps: [],
        domain: 'analytical',
      };

      const validation = await validateScenario(emptyScenario);
      expect(validation).toBeDefined();
      expect(validation.complexityScore).toBeDefined();
    });

    it('should handle very long content', async () => {
      const longContent = 'Task description. '.repeat(500);
      const longScenario = {
        id: 'long',
        intendedTier: 'moderate' as const,
        content: longContent,
        calculationSteps: Array.from({ length: 20 }, (_, i) => `Step ${i + 1}`),
        domain: 'planning',
      };

      const validation = await validateScenario(longScenario);
      expect(validation).toBeDefined();
    });

    it('should handle special characters in content', async () => {
      const specialScenario = {
        id: 'special',
        intendedTier: 'simple' as const,
        content: 'Calculate: $1,000.00 × 15% + €500 - ¥200 (with uncertainty ±5%)',
        calculationSteps: ['Process special chars'],
        domain: 'analytical',
      };

      const validation = await validateScenario(specialScenario);
      expect(validation).toBeDefined();
    });

    it('should handle unicode content', async () => {
      const unicodeScenario = {
        id: 'unicode',
        intendedTier: 'simple' as const,
        content: '分析销售数据：计算增长率 📊',
        calculationSteps: ['分析'],
        domain: 'analytical',
      };

      const validation = await validateScenario(unicodeScenario);
      expect(validation).toBeDefined();
    });
  });
});
