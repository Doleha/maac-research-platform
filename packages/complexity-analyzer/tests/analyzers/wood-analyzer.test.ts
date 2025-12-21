/**
 * Wood Analyzer Tests
 *
 * Tests for the Wood (1986) Component Complexity Model implementation
 */

import { describe, it, expect } from 'vitest';
import { analyzeWoodMetrics, calculateWoodScore } from '../../src/analyzers/wood-analyzer';

describe('Wood Analyzer', () => {
  describe('analyzeWoodMetrics', () => {
    it('should analyze simple single-step task', () => {
      const input = {
        taskDescription: 'Calculate the sum of 5 and 10.',
        calculationSteps: ['Add 5 and 10'],
        variables: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' },
        ],
        relationships: [],
      };

      const result = analyzeWoodMetrics(input);

      expect(result.distinctActs).toBeGreaterThanOrEqual(1);
      expect(result.informationCues).toBeGreaterThanOrEqual(2);
      expect(result.coordinativeComplexity.level).toBe('low');
      expect(result.dynamicComplexity.stateChanges).toBeLessThanOrEqual(1);
    });

    it('should identify multiple distinct acts in multi-step task', () => {
      const input = {
        taskDescription: `
          1. Calculate Q1 revenue
          2. Calculate Q2 revenue
          3. Compare growth rates
          4. Identify trends
          5. Provide recommendations
        `,
        calculationSteps: [
          'Sum Q1 transactions',
          'Sum Q2 transactions',
          'Calculate growth percentage',
          'Analyze trend direction',
          'Formulate recommendations',
        ],
        variables: [
          { name: 'q1Revenue', type: 'number' },
          { name: 'q2Revenue', type: 'number' },
          { name: 'growthRate', type: 'number', dependsOn: ['q1Revenue', 'q2Revenue'] },
        ],
        relationships: [
          { from: 'q1Revenue', to: 'growthRate', type: 'input' },
          { from: 'q2Revenue', to: 'growthRate', type: 'input' },
        ],
      };

      const result = analyzeWoodMetrics(input);

      expect(result.distinctActs).toBeGreaterThanOrEqual(5);
      expect(result.coordinativeComplexity.dependencyCount).toBeGreaterThan(0);
    });

    it('should detect high coordinative complexity with many dependencies', () => {
      const input = {
        taskDescription:
          'Analyze multi-regional performance with budget variance and market benchmarking.',
        calculationSteps: [
          'Calculate region A profit',
          'Calculate region B profit',
          'Compare to budget',
          'Adjust for market conditions',
          'Weight by strategic importance',
          'Synthesize overall assessment',
        ],
        variables: [
          { name: 'regionA', type: 'number' },
          { name: 'regionB', type: 'number' },
          { name: 'budget', type: 'number' },
          { name: 'marketFactor', type: 'number' },
          { name: 'weight', type: 'number' },
          {
            name: 'result',
            type: 'number',
            dependsOn: ['regionA', 'regionB', 'budget', 'marketFactor', 'weight'],
          },
        ],
        relationships: [
          { from: 'regionA', to: 'result', type: 'contributes' },
          { from: 'regionB', to: 'result', type: 'contributes' },
          { from: 'budget', to: 'result', type: 'constrains' },
          { from: 'marketFactor', to: 'result', type: 'modifies' },
          { from: 'regionA', to: 'regionB', type: 'comparison' },
        ],
      };

      const result = analyzeWoodMetrics(input);

      expect(result.coordinativeComplexity.level).toBe('high');
      expect(result.coordinativeComplexity.dependencyCount).toBeGreaterThanOrEqual(5);
    });

    it('should detect dynamic complexity with state changes', () => {
      const input = {
        taskDescription: `
          Track inventory changes across quarters.
          Q1: Starting inventory 1000 units
          Q2: After sales of 300 units
          Q3: After restocking 500 units
          Q4: After year-end adjustments
        `,
        calculationSteps: [
          'Record Q1 starting state',
          'Apply Q2 sales adjustment',
          'Apply Q3 restock adjustment',
          'Apply Q4 adjustments',
          'Calculate final state',
        ],
        variables: [],
        relationships: [],
      };

      const result = analyzeWoodMetrics(input);

      expect(result.dynamicComplexity.stateChanges).toBeGreaterThanOrEqual(3);
    });
  });

  describe('calculateWoodScore', () => {
    it('should calculate low score for simple tasks', () => {
      const metrics = {
        distinctActs: 2,
        informationCues: 3,
        coordinativeComplexity: {
          level: 'low' as const,
          dependencyCount: 1,
          concurrentActions: 1,
          temporalConstraints: 0,
          interactionPatterns: [],
        },
        dynamicComplexity: {
          stateChanges: 1,
          feedbackLoops: 0,
          conditionalBranches: 0,
          adaptationRequired: false,
        },
      };

      const score = calculateWoodScore(metrics);

      expect(score).toBeLessThan(15);
      expect(score).toBeGreaterThan(0);
    });

    it('should calculate moderate score for moderate tasks', () => {
      const metrics = {
        distinctActs: 5,
        informationCues: 8,
        coordinativeComplexity: {
          level: 'moderate' as const,
          dependencyCount: 4,
          concurrentActions: 2,
          temporalConstraints: 1,
          interactionPatterns: ['sequential'],
        },
        dynamicComplexity: {
          stateChanges: 3,
          feedbackLoops: 1,
          conditionalBranches: 2,
          adaptationRequired: false,
        },
      };

      const score = calculateWoodScore(metrics);

      expect(score).toBeGreaterThanOrEqual(10);
      expect(score).toBeLessThan(30);
    });

    it('should calculate high score for complex tasks', () => {
      const metrics = {
        distinctActs: 12,
        informationCues: 20,
        coordinativeComplexity: {
          level: 'high' as const,
          dependencyCount: 15,
          concurrentActions: 5,
          temporalConstraints: 3,
          interactionPatterns: ['parallel', 'feedback', 'iterative'],
        },
        dynamicComplexity: {
          stateChanges: 8,
          feedbackLoops: 3,
          conditionalBranches: 5,
          adaptationRequired: true,
        },
      };

      const score = calculateWoodScore(metrics);

      expect(score).toBeGreaterThanOrEqual(25);
    });
  });
});
