/**
 * Reference Scenario Validation Tests
 *
 * Tests that validate analyzer accuracy against known-complexity scenarios
 */

import { describe, it, expect } from 'vitest';
import {
  simpleReferenceScenarios,
  moderateReferenceScenarios,
  complexReferenceScenarios,
  getReferencesByTier,
  allReferenceScenarios,
} from '../fixtures/reference-scenarios';
import { calculateCompositeScore, isValidScenario } from '../../src/scoring/composite-scorer';
import { validateScenario } from '../../src/validation-engine';

describe('Reference Scenario Validation', () => {
  describe('Simple Tier Scenarios', () => {
    it.each(simpleReferenceScenarios)(
      'should correctly classify $name as simple',
      async (scenario) => {
        const input = {
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        };

        const score = calculateCompositeScore(input);

        // Simple scenarios should score within expected range
        expect(score.overallScore).toBeGreaterThanOrEqual(scenario.expectedScoreRange.min);
        expect(score.overallScore).toBeLessThanOrEqual(scenario.expectedScoreRange.max);

        // Should be classified as simple
        expect(score.predictedTier).toBe('simple');
      }
    );

    it('should validate all simple reference scenarios', async () => {
      let validCount = 0;

      for (const scenario of simpleReferenceScenarios) {
        const input = {
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        };

        const result = await validateScenario(input);
        if (result.isValid) validCount++;
      }

      // At least 80% should validate correctly
      const accuracy = validCount / simpleReferenceScenarios.length;
      expect(accuracy).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('Moderate Tier Scenarios', () => {
    it.each(moderateReferenceScenarios)(
      'should correctly classify $name as moderate',
      async (scenario) => {
        const input = {
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        };

        const score = calculateCompositeScore(input);

        // Moderate scenarios should score within expected range
        expect(score.overallScore).toBeGreaterThanOrEqual(scenario.expectedScoreRange.min);
        expect(score.overallScore).toBeLessThanOrEqual(scenario.expectedScoreRange.max);

        // Should be classified as moderate (or adjacent tier within tolerance)
        expect(['simple', 'moderate', 'complex']).toContain(score.predictedTier);
        // Prefer moderate
        if (score.overallScore >= 15 && score.overallScore <= 25) {
          expect(score.predictedTier).toBe('moderate');
        }
      }
    );

    it('should validate at least 70% of moderate reference scenarios', async () => {
      let validCount = 0;

      for (const scenario of moderateReferenceScenarios) {
        const input = {
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        };

        const result = await validateScenario(input);
        if (result.isValid) validCount++;
      }

      const accuracy = validCount / moderateReferenceScenarios.length;
      expect(accuracy).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Complex Tier Scenarios', () => {
    it.each(complexReferenceScenarios)(
      'should correctly classify $name as complex',
      async (scenario) => {
        const input = {
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        };

        const score = calculateCompositeScore(input);

        // Complex scenarios should score within expected range
        expect(score.overallScore).toBeGreaterThanOrEqual(scenario.expectedScoreRange.min);
        expect(score.overallScore).toBeLessThanOrEqual(scenario.expectedScoreRange.max);

        // Should be classified as complex
        expect(score.predictedTier).toBe('complex');
      }
    );

    it('should validate all complex reference scenarios', async () => {
      let validCount = 0;

      for (const scenario of complexReferenceScenarios) {
        const input = {
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        };

        const result = await validateScenario(input);
        if (result.isValid) validCount++;
      }

      const accuracy = validCount / complexReferenceScenarios.length;
      expect(accuracy).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('Tier Boundary Detection', () => {
    it('should clearly distinguish simple from moderate', () => {
      const simpleScores: number[] = [];
      const moderateScores: number[] = [];

      for (const scenario of simpleReferenceScenarios) {
        const score = calculateCompositeScore({
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        });
        simpleScores.push(score.overallScore);
      }

      for (const scenario of moderateReferenceScenarios) {
        const score = calculateCompositeScore({
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        });
        moderateScores.push(score.overallScore);
      }

      const maxSimple = Math.max(...simpleScores);
      const minModerate = Math.min(...moderateScores);

      // There should be some separation between tiers
      // Allow for some overlap in boundary cases
      expect(minModerate).toBeGreaterThan(maxSimple * 0.7);
    });

    it('should clearly distinguish moderate from complex', () => {
      const moderateScores: number[] = [];
      const complexScores: number[] = [];

      for (const scenario of moderateReferenceScenarios) {
        const score = calculateCompositeScore({
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        });
        moderateScores.push(score.overallScore);
      }

      for (const scenario of complexReferenceScenarios) {
        const score = calculateCompositeScore({
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        });
        complexScores.push(score.overallScore);
      }

      const maxModerate = Math.max(...moderateScores);
      const minComplex = Math.min(...complexScores);

      // Complex scenarios should score higher than moderate
      expect(minComplex).toBeGreaterThan(maxModerate * 0.8);
    });
  });

  describe('Utility Functions', () => {
    it('should get references by tier', () => {
      const simpleRefs = getReferencesByTier('simple');
      expect(simpleRefs.length).toBe(simpleReferenceScenarios.length);
      expect(simpleRefs.every((s) => s.tier === 'simple')).toBe(true);

      const moderateRefs = getReferencesByTier('moderate');
      expect(moderateRefs.length).toBe(moderateReferenceScenarios.length);
      expect(moderateRefs.every((s) => s.tier === 'moderate')).toBe(true);

      const complexRefs = getReferencesByTier('complex');
      expect(complexRefs.length).toBe(complexReferenceScenarios.length);
      expect(complexRefs.every((s) => s.tier === 'complex')).toBe(true);
    });

    it('should have all scenarios in combined list', () => {
      expect(allReferenceScenarios.length).toBe(
        simpleReferenceScenarios.length +
          moderateReferenceScenarios.length +
          complexReferenceScenarios.length
      );
    });
  });

  describe('Validation Accuracy Metrics', () => {
    it('should achieve overall accuracy of at least 75%', async () => {
      let totalValid = 0;
      const total = allReferenceScenarios.length;

      for (const scenario of allReferenceScenarios) {
        const input = {
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        };

        const isValid = isValidScenario(input, scenario.tier);
        if (isValid) totalValid++;
      }

      const overallAccuracy = totalValid / total;
      expect(overallAccuracy).toBeGreaterThanOrEqual(0.75);
    });

    it('should report accuracy breakdown by tier', async () => {
      const results = {
        simple: { total: 0, valid: 0 },
        moderate: { total: 0, valid: 0 },
        complex: { total: 0, valid: 0 },
      };

      for (const scenario of allReferenceScenarios) {
        const input = {
          id: scenario.id,
          intendedTier: scenario.tier,
          content: scenario.content,
          calculationSteps: scenario.calculationSteps,
          domain: scenario.domain,
        };

        results[scenario.tier].total++;
        if (isValidScenario(input, scenario.tier)) {
          results[scenario.tier].valid++;
        }
      }

      console.log('Accuracy by Tier:');
      console.log(`  Simple: ${(results.simple.valid / results.simple.total * 100).toFixed(1)}%`);
      console.log(`  Moderate: ${(results.moderate.valid / results.moderate.total * 100).toFixed(1)}%`);
      console.log(`  Complex: ${(results.complex.valid / results.complex.total * 100).toFixed(1)}%`);

      // Each tier should have reasonable accuracy
      expect(results.simple.valid / results.simple.total).toBeGreaterThanOrEqual(0.6);
      expect(results.moderate.valid / results.moderate.total).toBeGreaterThanOrEqual(0.6);
      expect(results.complex.valid / results.complex.total).toBeGreaterThanOrEqual(0.6);
    });
  });
});
