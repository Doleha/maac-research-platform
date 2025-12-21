/**
 * Composite Scorer Tests
 *
 * Tests for the weighted composite scoring system
 */

import { describe, it, expect } from 'vitest';
import { calculateCompositeScore, isValidScenario, DEFAULT_WEIGHTS } from '../../src/scoring/composite-scorer';

describe('Composite Scorer', () => {
  describe('calculateCompositeScore', () => {
    it('should calculate low score for simple scenario', () => {
      const input = {
        woodMetrics: {
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
        },
        campbellAttributes: {
          multiplePaths: false,
          multipleOutcomes: false,
          conflictingInterdependence: false,
          uncertainLinkages: 'low' as const,
          pathCount: 1,
          outcomeCount: 1,
          conflictCount: 0,
          probabilisticElements: [],
        },
        liuLiDimensions: {
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
        },
        elementInteractivity: {
          totalElements: 5,
          interactingElements: 2,
          interactivityRatio: 0.15,
          cognitiveLoadLevel: 'low' as const,
          simultaneousProcessing: 2,
          workingMemoryLoad: 3,
          chunkableGroups: 2,
        },
        intendedTier: 'simple' as const,
      };

      const result = calculateCompositeScore(input);

      expect(result.overallScore).toBeLessThan(15);
      expect(result.predictedTier).toBe('simple');
      expect(result.tierMatch).toBe(true);
    });

    it('should calculate moderate score for moderate scenario', () => {
      const input = {
        woodMetrics: {
          distinctActs: 6,
          informationCues: 10,
          coordinativeComplexity: {
            level: 'moderate' as const,
            dependencyCount: 5,
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
        },
        campbellAttributes: {
          multiplePaths: true,
          multipleOutcomes: true,
          conflictingInterdependence: false,
          uncertainLinkages: 'moderate' as const,
          pathCount: 3,
          outcomeCount: 3,
          conflictCount: 0,
          probabilisticElements: ['may'],
        },
        liuLiDimensions: {
          variety: 5,
          ambiguity: 'moderate' as const,
          instability: 'low' as const,
          coupling: 'moderate' as const,
          novelty: 'familiar' as const,
          timePressure: 'moderate' as const,
          equivocality: 'low' as const,
          scope: 'medium' as const,
          workFlow: 'moderate' as const,
          coordination: 'moderate' as const,
        },
        elementInteractivity: {
          totalElements: 15,
          interactingElements: 10,
          interactivityRatio: 0.4,
          cognitiveLoadLevel: 'moderate' as const,
          simultaneousProcessing: 4,
          workingMemoryLoad: 6,
          chunkableGroups: 3,
        },
        intendedTier: 'moderate' as const,
      };

      const result = calculateCompositeScore(input);

      expect(result.overallScore).toBeGreaterThanOrEqual(15);
      expect(result.overallScore).toBeLessThan(35);
      expect(result.predictedTier).toBe('moderate');
    });

    it('should calculate high score for complex scenario', () => {
      const input = {
        woodMetrics: {
          distinctActs: 15,
          informationCues: 25,
          coordinativeComplexity: {
            level: 'high' as const,
            dependencyCount: 12,
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
        },
        campbellAttributes: {
          multiplePaths: true,
          multipleOutcomes: true,
          conflictingInterdependence: true,
          uncertainLinkages: 'high' as const,
          pathCount: 5,
          outcomeCount: 6,
          conflictCount: 3,
          probabilisticElements: ['probability', 'uncertain', 'risk', 'may'],
        },
        liuLiDimensions: {
          variety: 10,
          ambiguity: 'high' as const,
          instability: 'moderate' as const,
          coupling: 'high' as const,
          novelty: 'novel' as const,
          timePressure: 'moderate' as const,
          equivocality: 'high' as const,
          scope: 'large' as const,
          workFlow: 'complex' as const,
          coordination: 'high' as const,
        },
        elementInteractivity: {
          totalElements: 30,
          interactingElements: 25,
          interactivityRatio: 0.75,
          cognitiveLoadLevel: 'high' as const,
          simultaneousProcessing: 10,
          workingMemoryLoad: 12,
          chunkableGroups: 2,
        },
        intendedTier: 'complex' as const,
      };

      const result = calculateCompositeScore(input);

      expect(result.overallScore).toBeGreaterThanOrEqual(30);
      expect(result.predictedTier).toBe('complex');
    });

    it('should provide calculation breakdown', () => {
      const input = {
        woodMetrics: {
          distinctActs: 5,
          informationCues: 8,
          coordinativeComplexity: {
            level: 'moderate' as const,
            dependencyCount: 4,
            concurrentActions: 2,
            temporalConstraints: 1,
            interactionPatterns: [],
          },
          dynamicComplexity: {
            stateChanges: 2,
            feedbackLoops: 1,
            conditionalBranches: 1,
            adaptationRequired: false,
          },
        },
        campbellAttributes: {
          multiplePaths: true,
          multipleOutcomes: false,
          conflictingInterdependence: false,
          uncertainLinkages: 'low' as const,
          pathCount: 2,
          outcomeCount: 1,
          conflictCount: 0,
          probabilisticElements: [],
        },
        liuLiDimensions: {
          variety: 4,
          ambiguity: 'moderate' as const,
          instability: 'low' as const,
          coupling: 'moderate' as const,
          novelty: 'familiar' as const,
          timePressure: 'low' as const,
          equivocality: 'low' as const,
          scope: 'medium' as const,
          workFlow: 'moderate' as const,
          coordination: 'low' as const,
        },
        elementInteractivity: {
          totalElements: 12,
          interactingElements: 8,
          interactivityRatio: 0.35,
          cognitiveLoadLevel: 'moderate' as const,
          simultaneousProcessing: 3,
          workingMemoryLoad: 5,
          chunkableGroups: 2,
        },
        intendedTier: 'moderate' as const,
      };

      const result = calculateCompositeScore(input);

      expect(result.calculationBreakdown).toBeDefined();
      expect(result.calculationBreakdown.woodScore).toBeGreaterThanOrEqual(0);
      expect(result.calculationBreakdown.campbellScore).toBeGreaterThanOrEqual(0);
      expect(result.calculationBreakdown.liuLiScore).toBeGreaterThanOrEqual(0);
      expect(result.calculationBreakdown.interactivityScore).toBeGreaterThanOrEqual(0);
    });

    it('should include confidence score', () => {
      const input = {
        woodMetrics: {
          distinctActs: 3,
          informationCues: 4,
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
        },
        campbellAttributes: {
          multiplePaths: false,
          multipleOutcomes: false,
          conflictingInterdependence: false,
          uncertainLinkages: 'low' as const,
          pathCount: 1,
          outcomeCount: 1,
          conflictCount: 0,
          probabilisticElements: [],
        },
        liuLiDimensions: {
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
        },
        elementInteractivity: {
          totalElements: 5,
          interactingElements: 2,
          interactivityRatio: 0.1,
          cognitiveLoadLevel: 'low' as const,
          simultaneousProcessing: 2,
          workingMemoryLoad: 3,
          chunkableGroups: 2,
        },
        intendedTier: 'simple' as const,
      };

      const result = calculateCompositeScore(input);

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
    });
  });

  describe('isValidScenario', () => {
    it('should return true when tier matches', () => {
      const score = {
        overallScore: 12,
        predictedTier: 'simple' as const,
        intendedTier: 'simple' as const,
        tierMatch: true,
        confidenceScore: 0.9,
        woodMetrics: {} as any,
        campbellAttributes: {} as any,
        liuLiDimensions: {} as any,
        elementInteractivity: {} as any,
        calculationBreakdown: {
          woodScore: 3,
          campbellScore: 2,
          liuLiScore: 4,
          interactivityScore: 3,
        },
        validationFlags: {
          meetsMinimumCriteria: true,
          hasRequiredAttributes: true,
          withinTierBounds: true,
          interactivityMatches: true,
          criteriaChecks: {},
        },
        rejectionReasons: [],
        analyzerVersion: '1.0.0',
      };

      expect(isValidScenario(score)).toBe(true);
    });

    it('should return false when tier does not match', () => {
      const score = {
        overallScore: 35,
        predictedTier: 'complex' as const,
        intendedTier: 'simple' as const,
        tierMatch: false,
        confidenceScore: 0.85,
        woodMetrics: {} as any,
        campbellAttributes: {} as any,
        liuLiDimensions: {} as any,
        elementInteractivity: {} as any,
        calculationBreakdown: {
          woodScore: 10,
          campbellScore: 8,
          liuLiScore: 10,
          interactivityScore: 7,
        },
        validationFlags: {
          meetsMinimumCriteria: true,
          hasRequiredAttributes: true,
          withinTierBounds: false,
          interactivityMatches: false,
          criteriaChecks: {},
        },
        rejectionReasons: ['Score 35 exceeds simple tier maximum of 15'],
        analyzerVersion: '1.0.0',
      };

      expect(isValidScenario(score)).toBe(false);
    });

    it('should allow one tier deviation in non-strict mode', () => {
      const score = {
        overallScore: 16, // Just above simple threshold
        predictedTier: 'moderate' as const,
        intendedTier: 'simple' as const,
        tierMatch: false,
        confidenceScore: 0.7,
        woodMetrics: {} as any,
        campbellAttributes: {} as any,
        liuLiDimensions: {} as any,
        elementInteractivity: {} as any,
        calculationBreakdown: {
          woodScore: 5,
          campbellScore: 3,
          liuLiScore: 5,
          interactivityScore: 3,
        },
        validationFlags: {
          meetsMinimumCriteria: true,
          hasRequiredAttributes: true,
          withinTierBounds: false, // Just outside
          interactivityMatches: true,
          criteriaChecks: {},
        },
        rejectionReasons: [],
        analyzerVersion: '1.0.0',
      };

      // In non-strict mode, one tier deviation should be allowed
      expect(isValidScenario(score, { strictMode: false, allowedDeviation: 1 })).toBe(true);
    });
  });

  describe('DEFAULT_WEIGHTS', () => {
    it('should have all required weight keys', () => {
      expect(DEFAULT_WEIGHTS).toHaveProperty('woodDistinctActs');
      expect(DEFAULT_WEIGHTS).toHaveProperty('woodInformationCues');
      expect(DEFAULT_WEIGHTS).toHaveProperty('woodCoordinative');
      expect(DEFAULT_WEIGHTS).toHaveProperty('campbellAttribute');
      expect(DEFAULT_WEIGHTS).toHaveProperty('liuLiVariety');
      expect(DEFAULT_WEIGHTS).toHaveProperty('liuLiAmbiguity');
      expect(DEFAULT_WEIGHTS).toHaveProperty('elementInteractivity');
    });

    it('should have positive weights', () => {
      Object.values(DEFAULT_WEIGHTS).forEach((weight) => {
        expect(weight).toBeGreaterThan(0);
      });
    });
  });
});
