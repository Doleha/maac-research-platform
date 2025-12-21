/**
 * Element Interactivity Analyzer Tests
 *
 * Tests for the Cognitive Load Theory element interactivity implementation
 */

import { describe, it, expect } from 'vitest';
import { analyzeElementInteractivity, calculateInteractivityScore } from '../../src/analyzers/interactivity-analyzer';

describe('Element Interactivity Analyzer', () => {
  describe('analyzeElementInteractivity', () => {
    it('should analyze low interactivity for simple independent elements', () => {
      const input = {
        taskDescription: 'Calculate: 5 + 10',
        calculationSteps: ['Add 5 and 10'],
        variableCount: 2,
        relationshipCount: 1,
      };

      const result = analyzeElementInteractivity(input);

      expect(result.totalElements).toBeGreaterThanOrEqual(2);
      expect(result.interactingElements).toBeLessThanOrEqual(result.totalElements);
      expect(result.interactivityRatio).toBeLessThanOrEqual(0.5);
      expect(result.cognitiveLoadLevel).toBe('low');
    });

    it('should detect high interactivity with many dependent variables', () => {
      const input = {
        taskDescription: `
          Calculate final result using:
          A = B + C
          D = A × E
          F = D / G + H
          Result = F × I + J - K × L
          Where all variables depend on each other.
        `,
        calculationSteps: [
          'Calculate A from B and C',
          'Calculate D from A and E',
          'Calculate F from D, G, and H',
          'Calculate Result from F, I, J, K, L',
        ],
        variableCount: 12,
        relationshipCount: 15,
      };

      const result = analyzeElementInteractivity(input);

      expect(result.totalElements).toBeGreaterThanOrEqual(12);
      expect(result.interactivityRatio).toBeGreaterThan(0.3);
      expect(['moderate', 'high']).toContain(result.cognitiveLoadLevel);
    });

    it('should identify simultaneous processing requirements', () => {
      const input = {
        taskDescription: `
          While monitoring real-time data:
          - Track sales in 3 regions simultaneously
          - Compare against 3 different benchmarks at once
          - Update projections in parallel
          - Keep all metrics in mind together
          - Process all information at the same time
        `,
        calculationSteps: [
          'Monitor Region A, B, C simultaneously',
          'Compare against benchmarks',
          'Update projections',
        ],
        variableCount: 10,
        relationshipCount: 12,
      };

      const result = analyzeElementInteractivity(input);

      expect(result.simultaneousProcessing).toBeGreaterThanOrEqual(3);
    });

    it('should detect working memory demands', () => {
      const input = {
        taskDescription: `
          Keep in mind the following while calculating:
          - Revenue from 5 sources
          - Costs from 4 categories
          - Historical data from 3 years
          - 4 different scenarios
          - Remember previous results
          You must hold all values simultaneously.
        `,
        calculationSteps: Array.from({ length: 10 }, (_, i) => `Step ${i + 1}`),
        variableCount: 16,
        relationshipCount: 20,
      };

      const result = analyzeElementInteractivity(input);

      expect(result.workingMemoryLoad).toBeGreaterThanOrEqual(7);
    });

    it('should identify chunking opportunities for moderate complexity', () => {
      const input = {
        taskDescription: `
          Calculate in two main phases:
          Phase 1: Revenue calculations (A + B + C = Revenue)
          Phase 2: Cost calculations (D + E + F = Cost)
          Finally: Profit = Revenue - Cost
          
          Each phase can be chunked separately.
        `,
        calculationSteps: [
          'Calculate Revenue subtotal',
          'Calculate Cost subtotal',
          'Calculate Profit',
        ],
        variableCount: 7,
        relationshipCount: 5,
      };

      const result = analyzeElementInteractivity(input);

      expect(result.chunkableGroups).toBeGreaterThanOrEqual(2);
      // Chunking should reduce effective cognitive load
      expect(result.cognitiveLoadLevel).not.toBe('high');
    });
  });

  describe('calculateInteractivityScore', () => {
    it('should return low score for independent elements', () => {
      const analysis = {
        totalElements: 5,
        interactingElements: 2,
        interactivityRatio: 0.1,
        cognitiveLoadLevel: 'low' as const,
        simultaneousProcessing: 2,
        workingMemoryLoad: 3,
        chunkableGroups: 1,
      };

      const score = calculateInteractivityScore(analysis);
      expect(score).toBeLessThan(15);
    });

    it('should return moderate score for moderate interactivity', () => {
      const analysis = {
        totalElements: 12,
        interactingElements: 8,
        interactivityRatio: 0.4,
        cognitiveLoadLevel: 'moderate' as const,
        simultaneousProcessing: 4,
        workingMemoryLoad: 6,
        chunkableGroups: 3,
      };

      const score = calculateInteractivityScore(analysis);
      expect(score).toBeGreaterThanOrEqual(10);
      expect(score).toBeLessThan(30);
    });

    it('should return high score for high interactivity', () => {
      const analysis = {
        totalElements: 25,
        interactingElements: 22,
        interactivityRatio: 0.8,
        cognitiveLoadLevel: 'high' as const,
        simultaneousProcessing: 10,
        workingMemoryLoad: 12,
        chunkableGroups: 1, // No chunking possible
      };

      const score = calculateInteractivityScore(analysis);
      expect(score).toBeGreaterThanOrEqual(25);
    });

    it('should scale with interactivity ratio', () => {
      const base = {
        totalElements: 20,
        interactingElements: 0,
        interactivityRatio: 0,
        cognitiveLoadLevel: 'low' as const,
        simultaneousProcessing: 2,
        workingMemoryLoad: 3,
        chunkableGroups: 1,
      };

      const lowRatio = { ...base, interactivityRatio: 0.2, cognitiveLoadLevel: 'low' as const };
      const midRatio = { ...base, interactivityRatio: 0.5, cognitiveLoadLevel: 'moderate' as const };
      const highRatio = { ...base, interactivityRatio: 0.8, cognitiveLoadLevel: 'high' as const };

      const lowScore = calculateInteractivityScore(lowRatio);
      const midScore = calculateInteractivityScore(midRatio);
      const highScore = calculateInteractivityScore(highRatio);

      expect(midScore).toBeGreaterThan(lowScore);
      expect(highScore).toBeGreaterThan(midScore);
    });

    it('should reduce score when chunking is possible', () => {
      const noChunking = {
        totalElements: 15,
        interactingElements: 12,
        interactivityRatio: 0.6,
        cognitiveLoadLevel: 'moderate' as const,
        simultaneousProcessing: 5,
        workingMemoryLoad: 8,
        chunkableGroups: 1,
      };

      const withChunking = {
        ...noChunking,
        chunkableGroups: 5, // Many chunking opportunities
      };

      const noChunkScore = calculateInteractivityScore(noChunking);
      const withChunkScore = calculateInteractivityScore(withChunking);

      // Chunking should reduce or maintain score (not increase it significantly)
      expect(withChunkScore).toBeLessThanOrEqual(noChunkScore + 5);
    });
  });
});
