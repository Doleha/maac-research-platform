/**
 * Liu & Li Analyzer Tests
 *
 * Tests for the Liu & Li (2012) Ten-Dimension Framework implementation
 */

import { describe, it, expect } from 'vitest';
import { analyzeLiuLiDimensions, calculateLiuLiScore } from '../../src/analyzers/liuli-analyzer';

describe('Liu & Li Analyzer', () => {
  describe('analyzeLiuLiDimensions', () => {
    it('should analyze simple routine task', () => {
      const input = {
        taskDescription: 'Calculate the total of the following numbers: 10, 20, 30.',
        domain: 'analytical',
        scenarioRequirements: ['Basic addition'],
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.variety).toBeLessThanOrEqual(3);
      expect(result.ambiguity).toBe('low');
      expect(result.novelty).toBe('routine');
      expect(result.timePressure).toBe('low');
    });

    it('should detect high variety with many different elements', () => {
      const input = {
        taskDescription: `
          Analyze the following diverse data sources:
          - Financial reports from 5 regions
          - Customer feedback from 3 channels
          - Market research from 4 competitors
          - Operational metrics from 6 departments
          - Employee satisfaction surveys
          - Supply chain data
          - Technology infrastructure metrics
          - Legal compliance documentation
        `,
        domain: 'analytical',
        scenarioRequirements: [
          'Financial analysis',
          'Customer sentiment',
          'Competitive intelligence',
          'Operations review',
          'HR assessment',
          'Supply chain analysis',
        ],
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.variety).toBeGreaterThan(5);
    });

    it('should detect high ambiguity with unclear language', () => {
      const input = {
        taskDescription: `
          Assess the situation based on vague indicators.
          The meaning of the data is unclear and open to interpretation.
          Some definitions are ambiguous.
          Results might mean different things to different stakeholders.
          The scope is somewhat ill-defined.
        `,
        domain: 'planning',
        scenarioRequirements: ['Interpret ambiguous data'],
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.ambiguity).toBe('high');
    });

    it('should detect instability with changing conditions', () => {
      const input = {
        taskDescription: `
          Monitor the rapidly changing market conditions.
          Prices are fluctuating significantly.
          The situation is volatile and evolving quickly.
          Parameters keep shifting.
          Adapt to dynamic environment.
        `,
        domain: 'analytical',
        scenarioRequirements: ['Real-time monitoring', 'Adaptive response'],
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.instability).toBe('high');
    });

    it('should detect high coupling with interconnected elements', () => {
      const input = {
        taskDescription: `
          All components are tightly interconnected.
          Changes in one area affect all others.
          High interdependency between systems.
          Integration across multiple platforms required.
          Dependencies span across the entire organization.
        `,
        domain: 'problem_solving',
        scenarioRequirements: ['Cross-functional analysis'],
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.coupling).toBe('high');
    });

    it('should detect novel task in unfamiliar domain', () => {
      const input = {
        taskDescription: `
          This is an innovative approach never tried before.
          We're pioneering a new methodology.
          This requires unprecedented solutions.
          A first-of-its-kind challenge.
          Novel experimental design required.
        `,
        domain: 'problem_solving',
        scenarioRequirements: ['Innovation', 'Creative solution'],
        isPreviouslyEncountered: false,
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.novelty).toBe('novel');
    });

    it('should detect time pressure', () => {
      const input = {
        taskDescription: `
          Urgent: This must be completed immediately.
          We have a tight deadline of 2 hours.
          Time-critical decision needed ASAP.
          Emergency response required.
        `,
        domain: 'communication',
        scenarioRequirements: ['Rapid response'],
      };

      const result = analyzeLiuLiDimensions(input);

      expect(['moderate', 'high']).toContain(result.timePressure);
    });

    it('should detect equivocality with conflicting information', () => {
      const input = {
        taskDescription: `
          There are conflicting reports about the situation.
          Expert A says one thing, Expert B says the opposite.
          Data from different sources contradict each other.
          Inconsistent signals from the market.
          Views differ significantly on interpretation.
        `,
        domain: 'analytical',
        scenarioRequirements: ['Resolve contradictions'],
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.equivocality).toBe('high');
    });

    it('should detect large scope tasks', () => {
      const input = {
        taskDescription: `
          Enterprise-wide transformation project.
          Affects all 50,000 employees across 30 countries.
          Multi-year initiative with global impact.
          Organization-wide change management.
          Comprehensive overhaul of all systems.
        `,
        domain: 'planning',
        scenarioRequirements: [
          'Global coordination',
          'Multi-year planning',
          'Enterprise architecture',
          'Change management',
          'Stakeholder alignment',
        ],
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.scope).toBe('large');
    });

    it('should detect complex workflow', () => {
      const input = {
        taskDescription: `
          Multi-stage approval process:
          Stage 1: Initial review
          Stage 2: Technical assessment
          Stage 3: Financial evaluation
          Stage 4: Legal review
          Stage 5: Executive approval
          Each stage has parallel sub-processes and iterative feedback loops.
        `,
        domain: 'planning',
        scenarioRequirements: ['Process orchestration'],
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.workFlow).toBe('complex');
    });

    it('should detect high coordination requirements', () => {
      const input = {
        taskDescription: `
          Coordinate across 12 teams in 8 time zones.
          Requires collaboration between engineering, marketing, sales, finance, and legal.
          Cross-functional meetings with multiple stakeholders.
          Synchronize efforts across all departments.
          Team coordination is essential.
        `,
        domain: 'communication',
        scenarioRequirements: ['Multi-team coordination'],
      };

      const result = analyzeLiuLiDimensions(input);

      expect(result.coordination).toBe('high');
    });
  });

  describe('calculateLiuLiScore', () => {
    it('should return low score for routine task', () => {
      const dimensions = {
        variety: 2,
        ambiguity: 'low' as const,
        instability: 'low' as const,
        coupling: 'loose' as const,
        novelty: 'routine' as const,
        timePressure: 'low' as const,
        equivocality: 'low' as const,
        scope: 'small' as const,
        workFlow: 'simple' as const,
        coordination: 'low' as const,
      };

      const score = calculateLiuLiScore(dimensions);
      expect(score).toBeLessThan(15);
    });

    it('should return moderate score for moderate complexity', () => {
      const dimensions = {
        variety: 5,
        ambiguity: 'moderate' as const,
        instability: 'moderate' as const,
        coupling: 'moderate' as const,
        novelty: 'familiar' as const,
        timePressure: 'moderate' as const,
        equivocality: 'moderate' as const,
        scope: 'medium' as const,
        workFlow: 'moderate' as const,
        coordination: 'moderate' as const,
      };

      const score = calculateLiuLiScore(dimensions);
      expect(score).toBeGreaterThanOrEqual(15);
      expect(score).toBeLessThan(35);
    });

    it('should return high score for complex task', () => {
      const dimensions = {
        variety: 10,
        ambiguity: 'high' as const,
        instability: 'high' as const,
        coupling: 'high' as const,
        novelty: 'novel' as const,
        timePressure: 'high' as const,
        equivocality: 'high' as const,
        scope: 'large' as const,
        workFlow: 'complex' as const,
        coordination: 'high' as const,
      };

      const score = calculateLiuLiScore(dimensions);
      expect(score).toBeGreaterThanOrEqual(35);
    });

    it('should increase score with each dimension', () => {
      const baseline = {
        variety: 2,
        ambiguity: 'low' as const,
        instability: 'low' as const,
        coupling: 'loose' as const,
        novelty: 'routine' as const,
        timePressure: 'low' as const,
        equivocality: 'low' as const,
        scope: 'small' as const,
        workFlow: 'simple' as const,
        coordination: 'low' as const,
      };

      const withHighVariety = { ...baseline, variety: 10 };
      const withHighAmbiguity = { ...baseline, ambiguity: 'high' as const };
      const withNovelty = { ...baseline, novelty: 'novel' as const };

      const baseScore = calculateLiuLiScore(baseline);
      const varietyScore = calculateLiuLiScore(withHighVariety);
      const ambiguityScore = calculateLiuLiScore(withHighAmbiguity);
      const noveltyScore = calculateLiuLiScore(withNovelty);

      expect(varietyScore).toBeGreaterThan(baseScore);
      expect(ambiguityScore).toBeGreaterThan(baseScore);
      expect(noveltyScore).toBeGreaterThan(baseScore);
    });
  });
});
