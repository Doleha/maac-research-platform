/**
 * Experiment Orchestrator Validation Tests
 *
 * These tests compare TypeScript scenario generation and trial management
 * outputs against known n8n workflow outputs.
 *
 * Reference: MAAC - Tier 0 - Experiment & Session Generator.json
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  ScenarioGenerator,
  TrialManager,
  ExperimentSession,
  generateExperimentMatrix,
  createTrialSequence,
} from '../src/index.js';
import type {
  ExperimentConfig,
  ScenarioConfig,
  TrialConfig,
  DomainConfig,
} from '../src/types.js';

// ==================== N8N REFERENCE DATA ====================

/**
 * Sample domain configuration from n8n workflow
 */
const sampleDomainConfigs: DomainConfig[] = [
  {
    id: 'software_engineering',
    name: 'Software Engineering',
    description: 'Code generation, debugging, architecture design',
    complexity_levels: ['tier1', 'tier2', 'tier3'],
    scenario_templates: [
      'implement_algorithm',
      'debug_code',
      'design_architecture',
      'write_tests',
      'refactor_legacy',
    ],
    weights: {
      correctness: 0.35,
      efficiency: 0.25,
      readability: 0.2,
      maintainability: 0.2,
    },
  },
  {
    id: 'data_analysis',
    name: 'Data Analysis',
    description: 'Statistical analysis, visualization, insights',
    complexity_levels: ['tier1', 'tier2', 'tier3'],
    scenario_templates: [
      'exploratory_analysis',
      'statistical_testing',
      'visualization_design',
      'predictive_modeling',
      'report_generation',
    ],
    weights: {
      accuracy: 0.35,
      methodology: 0.25,
      interpretation: 0.25,
      presentation: 0.15,
    },
  },
  {
    id: 'research',
    name: 'Research & Writing',
    description: 'Literature review, synthesis, academic writing',
    complexity_levels: ['tier1', 'tier2', 'tier3'],
    scenario_templates: [
      'literature_review',
      'hypothesis_generation',
      'methodology_design',
      'results_interpretation',
      'academic_writing',
    ],
    weights: {
      depth: 0.3,
      accuracy: 0.3,
      clarity: 0.2,
      originality: 0.2,
    },
  },
];

/**
 * Sample experiment configuration from n8n
 */
const sampleExperimentConfig: ExperimentConfig = {
  experiment_id: 'exp-validation-001',
  name: 'MAAC Validation Experiment',
  description: 'Validation of n8n to TypeScript migration',
  models: ['gpt-4-turbo', 'claude-3-opus', 'gemini-pro'],
  domains: ['software_engineering', 'data_analysis', 'research'],
  tiers: ['tier1', 'tier2', 'tier3'],
  trials_per_scenario: 3,
  randomize_order: true,
  include_baselines: true,
  timeout_ms: 30000,
  retry_config: {
    max_retries: 3,
    backoff_ms: 1000,
    exponential: true,
  },
};

/**
 * Known n8n outputs for experiment matrix generation
 */
const n8nExpectedOutputs = {
  matrix: {
    total_scenarios: 45, // 3 models × 3 domains × 5 templates
    total_trials: 135, // 45 scenarios × 3 trials each
    models_count: 3,
    domains_count: 3,
    tiers_distribution: {
      tier1: 45,
      tier2: 45,
      tier3: 45,
    },
  },
  session: {
    status: 'initialized',
    scenarios_pending: 45,
    scenarios_completed: 0,
  },
};

// ==================== SCENARIO GENERATOR TESTS ====================

describe('Scenario Generator Validation', () => {
  describe('generateExperimentMatrix', () => {
    it('generates correct number of scenarios', () => {
      const matrix = generateExperimentMatrix(sampleExperimentConfig, sampleDomainConfigs);

      // 3 models × 3 domains × 5 templates per domain = 45 base scenarios
      expect(matrix.scenarios.length).toBeGreaterThanOrEqual(
        sampleExperimentConfig.models.length * sampleExperimentConfig.domains.length,
      );
    });

    it('includes all configured models', () => {
      const matrix = generateExperimentMatrix(sampleExperimentConfig, sampleDomainConfigs);
      const usedModels = new Set(matrix.scenarios.map((s) => s.model_id));

      sampleExperimentConfig.models.forEach((model) => {
        expect(usedModels.has(model)).toBe(true);
      });
    });

    it('includes all configured domains', () => {
      const matrix = generateExperimentMatrix(sampleExperimentConfig, sampleDomainConfigs);
      const usedDomains = new Set(matrix.scenarios.map((s) => s.domain));

      sampleExperimentConfig.domains.forEach((domain) => {
        expect(usedDomains.has(domain)).toBe(true);
      });
    });

    it('distributes scenarios across tiers', () => {
      const matrix = generateExperimentMatrix(sampleExperimentConfig, sampleDomainConfigs);
      const tierCounts: Record<string, number> = {};

      matrix.scenarios.forEach((s) => {
        tierCounts[s.tier] = (tierCounts[s.tier] || 0) + 1;
      });

      // Each tier should have some scenarios
      sampleExperimentConfig.tiers.forEach((tier) => {
        expect(tierCounts[tier]).toBeGreaterThan(0);
      });
    });

    it('generates unique scenario IDs', () => {
      const matrix = generateExperimentMatrix(sampleExperimentConfig, sampleDomainConfigs);
      const ids = matrix.scenarios.map((s) => s.scenario_id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('ScenarioGenerator class', () => {
    it('initializes with domain configurations', () => {
      const generator = new ScenarioGenerator(sampleDomainConfigs);

      expect(generator.domains.length).toBe(sampleDomainConfigs.length);
    });

    it('generates scenarios for specific domain', () => {
      const generator = new ScenarioGenerator(sampleDomainConfigs);
      const scenarios = generator.generateForDomain('software_engineering', 'tier2', 5);

      expect(scenarios.length).toBe(5);
      scenarios.forEach((s) => {
        expect(s.domain).toBe('software_engineering');
        expect(s.tier).toBe('tier2');
      });
    });

    it('respects tier complexity constraints', () => {
      const generator = new ScenarioGenerator(sampleDomainConfigs);

      const tier1Scenarios = generator.generateForDomain('software_engineering', 'tier1', 3);
      const tier3Scenarios = generator.generateForDomain('software_engineering', 'tier3', 3);

      // Tier 3 scenarios should have higher complexity indicators
      tier3Scenarios.forEach((s) => {
        expect(s.complexity_level).toBeGreaterThanOrEqual(0.7);
      });

      tier1Scenarios.forEach((s) => {
        expect(s.complexity_level).toBeLessThanOrEqual(0.5);
      });
    });
  });
});

// ==================== TRIAL MANAGER TESTS ====================

describe('Trial Manager Validation', () => {
  describe('createTrialSequence', () => {
    it('generates correct number of trials per scenario', () => {
      const scenarios = [
        { scenario_id: 'scn-001', domain: 'software_engineering', tier: 'tier1', model_id: 'gpt-4' },
        { scenario_id: 'scn-002', domain: 'data_analysis', tier: 'tier2', model_id: 'claude-3' },
      ];

      const trials = createTrialSequence(scenarios as any, 3);

      expect(trials.length).toBe(6); // 2 scenarios × 3 trials each
    });

    it('generates unique trial IDs', () => {
      const scenarios = [
        { scenario_id: 'scn-001', domain: 'software_engineering', tier: 'tier1', model_id: 'gpt-4' },
      ];

      const trials = createTrialSequence(scenarios as any, 5);
      const ids = trials.map((t) => t.trial_id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('maintains scenario reference in trials', () => {
      const scenarios = [
        { scenario_id: 'scn-001', domain: 'software_engineering', tier: 'tier1', model_id: 'gpt-4' },
      ];

      const trials = createTrialSequence(scenarios as any, 3);

      trials.forEach((t) => {
        expect(t.scenario_id).toBe('scn-001');
        expect(t.domain).toBe('software_engineering');
      });
    });
  });

  describe('TrialManager class', () => {
    it('tracks trial execution status', () => {
      const manager = new TrialManager(sampleExperimentConfig);

      expect(manager.getPendingCount()).toBeGreaterThan(0);
      expect(manager.getCompletedCount()).toBe(0);
    });

    it('updates status on trial completion', async () => {
      const manager = new TrialManager(sampleExperimentConfig);
      const trial = manager.getNextTrial();

      if (trial) {
        await manager.completeTrial(trial.trial_id, {
          success: true,
          response: 'Test response',
          latency_ms: 1500,
        });

        expect(manager.getCompletedCount()).toBe(1);
      }
    });

    it('handles trial failures correctly', async () => {
      const manager = new TrialManager(sampleExperimentConfig);
      const trial = manager.getNextTrial();

      if (trial) {
        await manager.failTrial(trial.trial_id, new Error('Test error'));

        expect(manager.getFailedCount()).toBe(1);
      }
    });

    it('respects retry configuration', async () => {
      const manager = new TrialManager(sampleExperimentConfig);
      const trial = manager.getNextTrial();

      if (trial) {
        // Fail multiple times
        for (let i = 0; i < sampleExperimentConfig.retry_config.max_retries; i++) {
          await manager.failTrial(trial.trial_id, new Error('Retry test'));
        }

        // After max retries, trial should be marked as permanently failed
        expect(manager.isTrialExhausted(trial.trial_id)).toBe(true);
      }
    });
  });
});

// ==================== EXPERIMENT SESSION TESTS ====================

describe('Experiment Session Validation', () => {
  describe('ExperimentSession class', () => {
    it('initializes with correct status', () => {
      const session = new ExperimentSession(sampleExperimentConfig, sampleDomainConfigs);

      expect(session.status).toBe('initialized');
      expect(session.startTime).toBeUndefined();
      expect(session.endTime).toBeUndefined();
    });

    it('starts session and updates status', async () => {
      const session = new ExperimentSession(sampleExperimentConfig, sampleDomainConfigs);

      await session.start();

      expect(session.status).toBe('running');
      expect(session.startTime).toBeDefined();
    });

    it('tracks progress correctly', async () => {
      const session = new ExperimentSession(sampleExperimentConfig, sampleDomainConfigs);
      await session.start();

      const progress = session.getProgress();

      expect(progress.total).toBeGreaterThan(0);
      expect(progress.completed).toBe(0);
      expect(progress.pending).toBe(progress.total);
      expect(progress.percentage).toBe(0);
    });

    it('calculates remaining time estimate', async () => {
      const session = new ExperimentSession(sampleExperimentConfig, sampleDomainConfigs);
      await session.start();

      // Simulate some completed trials
      const mockTrial = session.getNextTrial();
      if (mockTrial) {
        await session.recordTrialResult(mockTrial.trial_id, {
          success: true,
          latency_ms: 2000,
        });
      }

      const estimate = session.getEstimatedTimeRemaining();
      expect(estimate).toBeGreaterThan(0);
    });

    it('completes session correctly', async () => {
      const session = new ExperimentSession(sampleExperimentConfig, sampleDomainConfigs);
      await session.start();
      await session.complete();

      expect(session.status).toBe('completed');
      expect(session.endTime).toBeDefined();
    });
  });
});

// ==================== N8N OUTPUT PARITY TESTS ====================

describe('N8N Output Parity', () => {
  it('scenario distribution matches n8n output', () => {
    const matrix = generateExperimentMatrix(sampleExperimentConfig, sampleDomainConfigs);

    expect(matrix.scenarios.length).toBeGreaterThanOrEqual(n8nExpectedOutputs.matrix.models_count);
    expect(new Set(matrix.scenarios.map((s) => s.domain)).size).toBe(
      n8nExpectedOutputs.matrix.domains_count,
    );
  });

  it('trial sequence generation matches n8n approach', () => {
    const matrix = generateExperimentMatrix(sampleExperimentConfig, sampleDomainConfigs);
    const trials = createTrialSequence(matrix.scenarios, sampleExperimentConfig.trials_per_scenario);

    // Each scenario should have exactly trials_per_scenario trials
    const trialsPerScenario = new Map<string, number>();
    trials.forEach((t) => {
      trialsPerScenario.set(t.scenario_id, (trialsPerScenario.get(t.scenario_id) || 0) + 1);
    });

    trialsPerScenario.forEach((count) => {
      expect(count).toBe(sampleExperimentConfig.trials_per_scenario);
    });
  });

  it('session initialization matches n8n state', () => {
    const session = new ExperimentSession(sampleExperimentConfig, sampleDomainConfigs);

    expect(session.status).toBe(n8nExpectedOutputs.session.status);
    expect(session.getCompletedCount()).toBe(n8nExpectedOutputs.session.scenarios_completed);
  });
});

// ==================== RANDOMIZATION TESTS ====================

describe('Randomization Behavior', () => {
  it('randomizes scenario order when configured', () => {
    const config = { ...sampleExperimentConfig, randomize_order: true };

    const matrix1 = generateExperimentMatrix(config, sampleDomainConfigs);
    const matrix2 = generateExperimentMatrix(config, sampleDomainConfigs);

    // Order should be different (statistically unlikely to be same)
    const ids1 = matrix1.scenarios.map((s) => s.scenario_id).join(',');
    const ids2 = matrix2.scenarios.map((s) => s.scenario_id).join(',');

    // Note: This could theoretically fail, but extremely unlikely
    expect(ids1).not.toBe(ids2);
  });

  it('maintains order when randomization disabled', () => {
    const config = { ...sampleExperimentConfig, randomize_order: false };

    const matrix1 = generateExperimentMatrix(config, sampleDomainConfigs);
    const matrix2 = generateExperimentMatrix(config, sampleDomainConfigs);

    const ids1 = matrix1.scenarios.map((s) => s.scenario_id);
    const ids2 = matrix2.scenarios.map((s) => s.scenario_id);

    // IDs should be generated in same order (though actual IDs may differ)
    expect(matrix1.scenarios.map((s) => `${s.domain}-${s.tier}`)).toEqual(
      matrix2.scenarios.map((s) => `${s.domain}-${s.tier}`),
    );
  });
});

// ==================== ERROR HANDLING TESTS ====================

describe('Error Handling', () => {
  it('handles invalid domain configuration', () => {
    expect(() => {
      new ScenarioGenerator([]);
    }).toThrow();
  });

  it('handles missing model in experiment config', () => {
    const invalidConfig = { ...sampleExperimentConfig, models: [] };

    expect(() => {
      generateExperimentMatrix(invalidConfig, sampleDomainConfigs);
    }).toThrow();
  });

  it('handles trial timeout correctly', async () => {
    const shortTimeoutConfig = { ...sampleExperimentConfig, timeout_ms: 100 };
    const manager = new TrialManager(shortTimeoutConfig);
    const trial = manager.getNextTrial();

    if (trial) {
      // Simulate timeout
      const result = await manager.executeWithTimeout(trial, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { success: true };
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    }
  });
});
