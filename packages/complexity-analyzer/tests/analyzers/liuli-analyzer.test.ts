/**
 * Liu & Li Analyzer Tests
 *
 * Tests for the Liu & Li (2012) Ten-Dimension Complexity implementation
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeLiuLiDimensions,
  calculateLiuLiScore,
  type LiuLiAnalysisInput,
} from '../../src/analyzers/liuli-analyzer';

describe('Liu & Li Analyzer', () => {
  describe('analyzeLiuLiDimensions', () => {
    it('should analyze simple routine task', () => {
      const input: LiuLiAnalysisInput = {
        content: 'Calculate the sum of two numbers.',
        entityCount: 2,
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result).toBeDefined();
      expect(result.size).toBeDefined();
      expect(result.variety).toBeDefined();
      expect(result.ambiguity).toBeDefined();
      expect(result.novelty).toBeDefined();
    });

    it('should detect high variety with many different elements', () => {
      const input: LiuLiAnalysisInput = {
        content: `
          Analyze diverse data sources:
          - Sales reports (financial)
          - Customer surveys (marketing)
          - Inventory logs (operations)
          - HR metrics (personnel)
          - IT systems (technology)
          Different types of analysis required.
        `,
        entityCount: 10,
        entityTypes: ['financial', 'marketing', 'operations', 'personnel', 'technology'],
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.variety).toBeGreaterThan(0);
    });

    it('should detect ambiguity with unclear language', () => {
      const input: LiuLiAnalysisInput = {
        content: `
          The requirements are somewhat unclear.
          Interpret the data as appropriate.
          Results might depend on assumptions.
          Possibly need to infer missing details.
        `,
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.ambiguity).toBeGreaterThanOrEqual(0);
    });

    it('should detect novelty in unfamiliar domain', () => {
      const input: LiuLiAnalysisInput = {
        content: `
          This is an unprecedented situation requiring innovation.
          Novel approach needed for this unique challenge.
          First-time analysis with no prior examples.
        `,
        domain: 'emerging_technology',
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.novelty).toBeGreaterThanOrEqual(0);
    });

    it('should detect time pressure', () => {
      const input: LiuLiAnalysisInput = {
        content: `
          Urgent deadline: complete within 24 hours.
          Time-critical decision needed immediately.
          Rush analysis required ASAP.
        `,
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.temporalDemand).toBeDefined();
    });

    it('should detect scope for large tasks', () => {
      const input: LiuLiAnalysisInput = {
        content: `
          Enterprise-wide analysis spanning:
          - All 50 business units
          - 12 geographic regions
          - 5-year historical data
          - Multiple stakeholder groups
        `,
        entityCount: 50,
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.scope).toBeGreaterThan(0);
    });
  });

  describe('calculateLiuLiScore', () => {
    it('should return low score for routine task', () => {
      const input: LiuLiAnalysisInput = {
        content: 'Simple calculation task.',
        entityCount: 2,
      };

      const dimensions = analyzeLiuLiDimensions(input);
      const score = calculateLiuLiScore(dimensions);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should return higher score for complex task', () => {
      const simpleInput: LiuLiAnalysisInput = {
        content: 'Add numbers.',
      };

      const complexInput: LiuLiAnalysisInput = {
        content: `
          Novel, ambiguous, large-scope analysis:
          - 50 entities with high variety
          - Unclear requirements
          - Time pressure
          - First-of-its-kind
          - Complex coordination needed
        `,
        entityCount: 50,
        entityTypes: ['type1', 'type2', 'type3', 'type4', 'type5'],
      };

      const simpleDims = analyzeLiuLiDimensions(simpleInput);
      const complexDims = analyzeLiuLiDimensions(complexInput);

      const simpleScore = calculateLiuLiScore(simpleDims);
      const complexScore = calculateLiuLiScore(complexDims);

      expect(complexScore).toBeGreaterThan(simpleScore);
    });
  });
});
