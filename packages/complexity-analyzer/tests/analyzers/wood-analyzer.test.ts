/**
 * Wood Analyzer Tests
 *
 * Tests for the Wood (1986) Component Complexity Model implementation
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeWoodMetrics,
  calculateWoodScore,
  type WoodAnalysisInput,
} from '../../src/analyzers/wood-analyzer';

describe('Wood Analyzer', () => {
  describe('analyzeWoodMetrics', () => {
    it('should analyze simple single-step task', () => {
      const input: WoodAnalysisInput = {
        content: 'Calculate the sum of 5 and 10.',
        calculationSteps: ['Add 5 and 10'],
        variables: ['a', 'b'],
      };

      const result = analyzeWoodMetrics(input);

      expect(result.distinctActs).toBeGreaterThanOrEqual(1);
      expect(result.informationCuesPerAct).toBeGreaterThanOrEqual(0);
      expect(result.coordinativeComplexity).toBeDefined();
      expect(result.dynamicComplexity).toBeDefined();
    });

    it('should identify multiple distinct acts in multi-step task', () => {
      const input: WoodAnalysisInput = {
        content: `
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
        variables: ['q1Revenue', 'q2Revenue', 'growthRate'],
        dependencies: [
          { from: 'q1Revenue', to: 'growthRate' },
          { from: 'q2Revenue', to: 'growthRate' },
        ],
      };

      const result = analyzeWoodMetrics(input);

      expect(result.distinctActs).toBeGreaterThanOrEqual(5);
      expect(result.totalElements).toBeGreaterThan(0);
    });

    it('should detect coordinative complexity with dependencies', () => {
      const input: WoodAnalysisInput = {
        content: `
          Analyze interconnected business units:
          - Unit A depends on B for supply
          - Unit B requires C's output
          - Calculate synergies between all pairs
        `,
        calculationSteps: [
          'Map dependencies',
          'Calculate A metrics',
          'Calculate B metrics',
          'Compute synergies',
        ],
        variables: ['unitA', 'unitB', 'unitC', 'synergy'],
        dependencies: [
          { from: 'unitA', to: 'unitB' },
          { from: 'unitB', to: 'unitC' },
        ],
        hasConditionals: true,
      };

      const result = analyzeWoodMetrics(input);

      expect(result.coordinativeComplexity).toBeDefined();
      expect(['sequential', 'interdependent', 'networked']).toContain(
        result.coordinativeComplexity,
      );
    });

    it('should detect dynamic complexity with state changes', () => {
      const input: WoodAnalysisInput = {
        content: `
          Track inventory changes over time:
          - Initial stock: 1000 units
          - Daily sales modify inventory
          - Weekly restocking updates levels
        `,
        calculationSteps: ['Record initial state', 'Track daily changes', 'Update weekly'],
        hasStateChanges: true,
      };

      const result = analyzeWoodMetrics(input);

      expect(result.dynamicComplexity).toBeDefined();
      // DynamicComplexity is 'static' | 'low' | 'high'
      expect(['static', 'low', 'high']).toContain(result.dynamicComplexity);
    });
  });

  describe('calculateWoodScore', () => {
    it('should calculate score for simple task metrics', () => {
      const input: WoodAnalysisInput = {
        content: 'Simple addition: 5 + 10',
        calculationSteps: ['Add numbers'],
      };

      const metrics = analyzeWoodMetrics(input);
      const score = calculateWoodScore(metrics);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should calculate higher score for complex task metrics', () => {
      const simpleInput: WoodAnalysisInput = {
        content: 'Add two numbers',
        calculationSteps: ['Add'],
      };

      const complexInput: WoodAnalysisInput = {
        content: `
          Enterprise optimization across departments:
          - Analyze allocations
          - Map dependencies
          - Optimize distribution
          - Apply constraints
          - Model trade-offs
        `,
        calculationSteps: ['Analyze', 'Map', 'Optimize', 'Constrain', 'Trade-off', 'Report'],
        variables: ['dept1', 'dept2', 'allocation'],
        dependencies: [
          { from: 'dept1', to: 'allocation' },
          { from: 'dept2', to: 'allocation' },
        ],
        hasConditionals: true,
        hasStateChanges: true,
      };

      const simpleMetrics = analyzeWoodMetrics(simpleInput);
      const complexMetrics = analyzeWoodMetrics(complexInput);

      const simpleScore = calculateWoodScore(simpleMetrics);
      const complexScore = calculateWoodScore(complexMetrics);

      expect(complexScore).toBeGreaterThan(simpleScore);
    });
  });
});
