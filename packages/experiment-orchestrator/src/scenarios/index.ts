/**
 * Scenario Generation Module
 *
 * Extracted from n8n workflow: MAAC - Tier 1a - Experiment Processing - Scenario Generation Only.json
 *
 * This module provides:
 * - ScenarioGenerator class for generating experimental scenarios
 * - Domain patterns for 4 business domains × 3 complexity tiers
 * - MAAC cognitive requirements for 9-dimensional assessment
 * - Validation utilities for scenario quality assurance
 *
 * Experiment Design:
 * - 4 domains (analytical, planning, communication, problem_solving)
 * - 3 tiers (simple, moderate, complex)
 * - 150 repetitions per domain-tier combination
 * - 4 models for comparison study
 * - Total: 1,800 unique scenarios × 4 models = 7,200 trials
 */

// Types
export * from './types';

// Domain Patterns
export {
  DOMAIN_PATTERNS,
  getPatternForScenario,
  MAAC_USAGE_GUIDANCE,
  COGNITIVE_TESTING_FRAMEWORK,
} from './domain-patterns';

// Scenario Generator
export {
  ScenarioGenerator,
  createScenarioGenerator,
  createBaselineScenarioGenerator,
  createFullToolsScenarioGenerator,
} from './scenario-generator';
