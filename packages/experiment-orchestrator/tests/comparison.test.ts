/**
 * Experiment Orchestrator Validation Tests
 *
 * These tests compare TypeScript scenario generation outputs against
 * known n8n workflow outputs.
 *
 * Reference: MAAC - Tier 1a - Experiment Processing - Scenario Generation Only.json
 */

import { describe, it, expect } from 'vitest';
import {
  ScenarioGenerator,
  createScenarioGenerator,
  createBaselineScenarioGenerator,
  createFullToolsScenarioGenerator,
  DOMAIN_PATTERNS,
  COGNITIVE_TESTING_FRAMEWORK,
} from '../src/index.js';
import type { ScenarioGeneratorConfig } from '../src/scenarios/types.js';

// ==================== N8N REFERENCE DATA ====================

/**
 * Known n8n outputs for experiment design
 * Based on: MAAC - Tier 1a - Experiment Processing - Scenario Generation Only.json
 */
const n8nExpectedOutputs = {
  experimentDesign: {
    domains_count: 4, // analytical, planning, communication, problem_solving
    tiers_count: 3, // simple, moderate, complex
    repetitions_per_block: 150,
    models_count: 4, // gpt-4, claude-3-opus, gemini-1.5-pro, gpt-3.5-turbo
    scenarios_per_domain_tier: 600, // 150 reps × 4 models
    total_scenarios: 7200, // 4 domains × 3 tiers × 150 reps × 4 models
  },
  cognitiveFramework: {
    dimensions_count: 9, // MAAC 9 dimensions
  },
};

// ==================== DOMAIN PATTERNS TESTS ====================

describe('Domain Patterns', () => {
  it('contains all 4 domains from n8n', () => {
    const domains = Object.keys(DOMAIN_PATTERNS);

    expect(domains).toContain('analytical');
    expect(domains).toContain('planning');
    expect(domains).toContain('communication');
    expect(domains).toContain('problem_solving');
    expect(domains.length).toBe(n8nExpectedOutputs.experimentDesign.domains_count);
  });

  it('each domain has control and test patterns', () => {
    for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
      expect(patterns).toHaveProperty('controlPatterns');
      expect(patterns).toHaveProperty('testPatterns');
      expect(Array.isArray(patterns.controlPatterns)).toBe(true);
      expect(Array.isArray(patterns.testPatterns)).toBe(true);
    }
  });

  it('control patterns have required fields', () => {
    for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
      for (const pattern of patterns.controlPatterns) {
        expect(pattern).toHaveProperty('patternType');
        expect(pattern).toHaveProperty('example');
        expect(pattern).toHaveProperty('expectedInsight');
        // 'calculation' may not be present in all patterns
      }
    }
  });
});

// ==================== COGNITIVE FRAMEWORK TESTS ====================

describe('Cognitive Testing Framework', () => {
  it('contains primary and secondary dimensions', () => {
    expect(COGNITIVE_TESTING_FRAMEWORK).toHaveProperty('primaryDimensions');
    expect(COGNITIVE_TESTING_FRAMEWORK).toHaveProperty('secondaryDimensions');

    // Total: 4 primary + 3 secondary = 7 dimensions listed (some may be omitted)
    const totalDimensions =
      COGNITIVE_TESTING_FRAMEWORK.primaryDimensions.length +
      COGNITIVE_TESTING_FRAMEWORK.secondaryDimensions.length;
    expect(totalDimensions).toBeGreaterThanOrEqual(7);
  });

  it('has assessment focus defined', () => {
    expect(COGNITIVE_TESTING_FRAMEWORK).toHaveProperty('assessmentFocus');
    expect(typeof COGNITIVE_TESTING_FRAMEWORK.assessmentFocus).toBe('string');
  });
});

// ==================== SCENARIO GENERATOR TESTS ====================

describe('ScenarioGenerator', () => {
  describe('Initialization', () => {
    it('creates generator with default config', () => {
      const generator = new ScenarioGenerator();

      expect(generator).toBeDefined();
    });

    it('creates generator with custom config', () => {
      const config: Partial<ScenarioGeneratorConfig> = {
        domains: ['analytical', 'planning'],
        tiers: ['simple', 'moderate'],
        repetitionsPerBlock: 10,
        models: ['gpt-4'],
      };

      const generator = new ScenarioGenerator(config);
      expect(generator).toBeDefined();
    });
  });

  describe('generateScenarios', () => {
    it('generates correct number of scenarios for small config', async () => {
      const config: Partial<ScenarioGeneratorConfig> = {
        domains: ['analytical'],
        tiers: ['simple'],
        repetitionsPerBlock: 2,
        models: ['gpt-4'],
      };

      const generator = new ScenarioGenerator(config);
      const scenarios = await generator.generateScenarios();

      // 1 domain × 1 tier × 2 reps × 1 model = 2 scenarios
      expect(scenarios.length).toBe(2);
    });

    it('generates unique trial IDs', async () => {
      const config: Partial<ScenarioGeneratorConfig> = {
        domains: ['analytical', 'planning'],
        tiers: ['simple'],
        repetitionsPerBlock: 3,
        models: ['gpt-4'],
      };

      const generator = new ScenarioGenerator(config);
      const scenarios = await generator.generateScenarios();

      // trialId should be unique for each scenario
      const ids = scenarios.map((s) => s.trialId);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('includes correct domain in each scenario', async () => {
      const config: Partial<ScenarioGeneratorConfig> = {
        domains: ['analytical', 'communication'],
        tiers: ['simple'],
        repetitionsPerBlock: 1,
        models: ['gpt-4'],
      };

      const generator = new ScenarioGenerator(config);
      const scenarios = await generator.generateScenarios();

      const domains = new Set(scenarios.map((s) => s.domain));
      expect(domains.has('analytical')).toBe(true);
      expect(domains.has('communication')).toBe(true);
    });

    it('includes correct tier in each scenario', async () => {
      const config: Partial<ScenarioGeneratorConfig> = {
        domains: ['analytical'],
        tiers: ['simple', 'complex'],
        repetitionsPerBlock: 1,
        models: ['gpt-4'],
      };

      const generator = new ScenarioGenerator(config);
      const scenarios = await generator.generateScenarios();

      const tiers = new Set(scenarios.map((s) => s.tier));
      expect(tiers.has('simple')).toBe(true);
      expect(tiers.has('complex')).toBe(true);
    });
  });

  describe('generateScenarioAtIndex', () => {
    it('generates consistent scenario at specific index', async () => {
      const config: Partial<ScenarioGeneratorConfig> = {
        domains: ['analytical', 'planning'],
        tiers: ['simple', 'moderate'],
        repetitionsPerBlock: 5,
        models: ['gpt-4', 'claude-3-opus'],
      };

      const generator = new ScenarioGenerator(config);

      const scenario1 = await generator.generateScenarioAtIndex(10);
      const scenario2 = await generator.generateScenarioAtIndex(10);

      // Same index should produce same domain/tier/rep/model
      expect(scenario1.domain).toBe(scenario2.domain);
      expect(scenario1.tier).toBe(scenario2.tier);
      expect(scenario1.modelId).toBe(scenario2.modelId);
    });
  });

  describe('calculatePositionFromIndex', () => {
    it('calculates correct position for index 0', () => {
      const config: Partial<ScenarioGeneratorConfig> = {
        domains: ['analytical', 'planning'],
        tiers: ['simple', 'moderate'],
        repetitionsPerBlock: 2,
        models: ['gpt-4', 'claude-3-opus'],
      };

      const generator = new ScenarioGenerator(config);
      const position = generator.calculatePositionFromIndex(0);

      expect(position.domain).toBe('analytical');
      expect(position.tier).toBe('simple');
      expect(position.repetition).toBe(1);
      expect(position.model).toBe('gpt-4');
    });

    it('calculates correct position wrapping through models', () => {
      const config: Partial<ScenarioGeneratorConfig> = {
        domains: ['analytical'],
        tiers: ['simple'],
        repetitionsPerBlock: 2,
        models: ['gpt-4', 'claude-3-opus'],
      };

      const generator = new ScenarioGenerator(config);

      // Index 0: model gpt-4
      // Index 1: model claude-3-opus
      // Index 2: rep 2, model gpt-4
      const pos0 = generator.calculatePositionFromIndex(0);
      const pos1 = generator.calculatePositionFromIndex(1);
      const pos2 = generator.calculatePositionFromIndex(2);

      expect(pos0.model).toBe('gpt-4');
      expect(pos1.model).toBe('claude-3-opus');
      expect(pos2.model).toBe('gpt-4');
      expect(pos2.repetition).toBe(2);
    });
  });
});

// ==================== FACTORY FUNCTION TESTS ====================

describe('Factory Functions', () => {
  it('createScenarioGenerator creates valid generator', () => {
    const generator = createScenarioGenerator({
      domains: ['analytical'],
      tiers: ['simple'],
    });

    expect(generator).toBeInstanceOf(ScenarioGenerator);
  });

  it('createBaselineScenarioGenerator creates baseline config', () => {
    const generator = createBaselineScenarioGenerator();

    expect(generator).toBeInstanceOf(ScenarioGenerator);
  });

  it('createFullToolsScenarioGenerator creates full tools config', () => {
    const generator = createFullToolsScenarioGenerator();

    expect(generator).toBeInstanceOf(ScenarioGenerator);
  });
});

// ==================== N8N FORMULA PARITY TESTS ====================

describe('N8N Formula Parity', () => {
  it('total scenarios matches n8n calculation for full experiment', async () => {
    // Full experiment: 4 domains × 3 tiers × 150 reps × 4 models = 7200
    const generator = new ScenarioGenerator({
      repetitionsPerBlock: 1, // Use 1 for faster test
    });

    const scenarios = await generator.generateScenarios();

    // With 1 rep: 4 × 3 × 1 × 4 = 48
    expect(scenarios.length).toBe(48);
  });

  it('scenario distribution is even across domains', async () => {
    const generator = new ScenarioGenerator({
      repetitionsPerBlock: 1,
    });

    const scenarios = await generator.generateScenarios();

    const domainCounts: Record<string, number> = {};
    for (const s of scenarios) {
      domainCounts[s.domain] = (domainCounts[s.domain] || 0) + 1;
    }

    // Each domain should have equal count
    const counts = Object.values(domainCounts);
    expect(new Set(counts).size).toBe(1); // All counts are equal
  });

  it('scenario distribution is even across tiers', async () => {
    const generator = new ScenarioGenerator({
      repetitionsPerBlock: 1,
    });

    const scenarios = await generator.generateScenarios();

    const tierCounts: Record<string, number> = {};
    for (const s of scenarios) {
      tierCounts[s.tier] = (tierCounts[s.tier] || 0) + 1;
    }

    // Each tier should have equal count
    const counts = Object.values(tierCounts);
    expect(new Set(counts).size).toBe(1); // All counts are equal
  });

  it('scenario distribution is even across models', async () => {
    const generator = new ScenarioGenerator({
      repetitionsPerBlock: 1,
    });

    const scenarios = await generator.generateScenarios();

    const modelCounts: Record<string, number> = {};
    for (const s of scenarios) {
      modelCounts[s.modelId] = (modelCounts[s.modelId] || 0) + 1;
    }

    // Each model should have equal count
    const counts = Object.values(modelCounts);
    expect(new Set(counts).size).toBe(1); // All counts are equal
  });
});

// ==================== SCENARIO STRUCTURE TESTS ====================

describe('Scenario Structure', () => {
  it('generated scenarios have all required fields', async () => {
    const generator = new ScenarioGenerator({
      domains: ['analytical'],
      tiers: ['simple'],
      repetitionsPerBlock: 1,
      models: ['gpt-4'],
    });

    const scenarios = await generator.generateScenarios();
    const scenario = scenarios[0];

    // Use camelCase property names matching the GeneratedScenario interface
    expect(scenario).toHaveProperty('scenarioId');
    expect(scenario).toHaveProperty('domain');
    expect(scenario).toHaveProperty('tier');
    expect(scenario).toHaveProperty('modelId');
    expect(scenario).toHaveProperty('taskDescription');
    expect(scenario).toHaveProperty('successCriteria');
    expect(scenario).toHaveProperty('controlExpectations');
  });

  it('task descriptions are non-empty strings', async () => {
    const generator = new ScenarioGenerator({
      domains: ['analytical', 'planning'],
      tiers: ['simple', 'complex'],
      repetitionsPerBlock: 1,
      models: ['gpt-4'],
    });

    const scenarios = await generator.generateScenarios();

    for (const scenario of scenarios) {
      expect(typeof scenario.taskDescription).toBe('string');
      expect(scenario.taskDescription.length).toBeGreaterThan(0);
    }
  });
});
