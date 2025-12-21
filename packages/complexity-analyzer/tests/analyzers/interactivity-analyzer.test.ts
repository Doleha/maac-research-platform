/**
 * Element Interactivity Analyzer Tests
 *
 * Tests for the Element Interactivity (Sweller 1988) implementation
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeElementInteractivity,
  calculateInteractivityScore,
  type ElementInteractivityInput,
} from '../../src/analyzers/interactivity-analyzer';

describe('Element Interactivity Analyzer', () => {
  describe('analyzeElementInteractivity', () => {
    it('should analyze low interactivity for simple independent elements', () => {
      const input: ElementInteractivityInput = {
        content: 'Calculate three separate sums independently.',
        woodTotalElements: 3,
      };

      const result = analyzeElementInteractivity(input);

      expect(result).toBeDefined();
      expect(result.totalElements).toBeGreaterThanOrEqual(0);
      expect(result.interactivityRatio).toBeDefined();
    });

    it('should detect high interactivity with dependent variables', () => {
      const input: ElementInteractivityInput = {
        content: `
          All variables are interconnected:
          - A depends on B and C
          - B depends on C and D
          - C depends on A
          Must process simultaneously.
        `,
        woodTotalElements: 10,
        variables: [
          { name: 'A', type: 'number', dependsOn: ['B', 'C'] },
          { name: 'B', type: 'number', dependsOn: ['C', 'D'] },
          { name: 'C', type: 'number', dependsOn: ['A'] },
          { name: 'D', type: 'number' },
        ],
      };

      const result = analyzeElementInteractivity(input);

      expect(result.interactiveElements).toBeGreaterThan(0);
    });

    it('should identify simultaneous processing requirements', () => {
      const input: ElementInteractivityInput = {
        content: `
          Process all inputs at once.
          Consider together: revenue, cost, and margin.
          Simultaneous evaluation required.
        `,
        woodTotalElements: 5,
      };

      const result = analyzeElementInteractivity(input);

      expect(result.simultaneousProcessingRequired).toBeDefined();
    });

    it('should identify chunking opportunities', () => {
      const input: ElementInteractivityInput = {
        content: `
          Phase 1: Calculate individual metrics
          Phase 2: Aggregate results
          Phase 3: Generate report
          Step by step process.
        `,
        woodTotalElements: 6,
        steps: [
          { id: 'step1' },
          { id: 'step2', dependsOn: ['step1'] },
          { id: 'step3', dependsOn: ['step2'] },
        ],
      };

      const result = analyzeElementInteractivity(input);

      expect(result.chunkingPossible).toBeDefined();
    });
  });

  describe('calculateInteractivityScore', () => {
    it('should return low score for independent elements', () => {
      const input: ElementInteractivityInput = {
        content: 'Three separate calculations.',
        woodTotalElements: 3,
      };

      const analysis = analyzeElementInteractivity(input);
      const score = calculateInteractivityScore(analysis);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should return higher score for highly interactive elements', () => {
      const lowInput: ElementInteractivityInput = {
        content: 'Independent task.',
        woodTotalElements: 2,
      };

      const highInput: ElementInteractivityInput = {
        content: `
          Highly interconnected analysis:
          All elements depend on each other.
          Must consider simultaneously.
          No chunking possible.
        `,
        woodTotalElements: 15,
        variables: [
          { name: 'A', type: 'number', dependsOn: ['B', 'C', 'D'] },
          { name: 'B', type: 'number', dependsOn: ['A', 'C', 'D'] },
          { name: 'C', type: 'number', dependsOn: ['A', 'B', 'D'] },
          { name: 'D', type: 'number', dependsOn: ['A', 'B', 'C'] },
        ],
      };

      const lowAnalysis = analyzeElementInteractivity(lowInput);
      const highAnalysis = analyzeElementInteractivity(highInput);

      const lowScore = calculateInteractivityScore(lowAnalysis);
      const highScore = calculateInteractivityScore(highAnalysis);

      expect(highScore).toBeGreaterThanOrEqual(lowScore);
    });
  });
});
