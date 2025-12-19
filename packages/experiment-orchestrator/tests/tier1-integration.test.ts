/**
 * Tier 1 Integration Tests
 *
 * End-to-end tests validating the complete Tier 1 workflow:
 * 1. Scenario Generation (Tier 1a)
 * 2. MIMIC Cognitive Execution (Tier 1b)
 * 3. MAAC 9D Assessment (Tier 1b)
 * 4. Database Storage
 *
 * Reference:
 * - MAAC - Tier 1a - Experiment Processing - Scenario Generation Only.json
 * - MAAC - Tier 1 b- Experiment Processing MIMIC Only_Agentic MAAC_v2.json
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  ScenarioGenerator,
  createScenarioGenerator,
  AdvancedExperimentOrchestrator,
} from '../src/index.js';
import type { GeneratedScenario } from '../src/scenarios/types.js';
import type { CognitiveSystem, CognitiveResponse, ToolConfiguration } from '@maac/types';

// ==================== TEST DATA ====================

const TEST_CONFIG = {
  domains: ['analytical', 'planning'] as const,
  tiers: ['simple', 'moderate'] as const,
  repetitionsPerBlock: 2,
  models: ['deepseek_v3'] as const,
  configId: '111111000000', // 6 engines enabled
};

// ==================== MOCK IMPLEMENTATIONS ====================

/**
 * Mock Database Client matching Prisma interface
 */
function createMockDatabase() {
  const scenarios: Record<string, unknown>[] = [];
  const experimentalData: Record<string, unknown>[] = [];

  return {
    mAACExperimentScenario: {
      createMany: vi.fn(async (args: { data: Record<string, unknown>[] }) => {
        scenarios.push(...args.data);
        return { count: args.data.length };
      }),
      count: vi.fn(async () => scenarios.length),
      findMany: vi.fn(async () => scenarios),
      findUnique: vi.fn(async (args: { where: { scenarioId: string } }) => {
        return scenarios.find((s) => s.scenarioId === args.where.scenarioId) || null;
      }),
      update: vi.fn(
        async (args: { where: { scenarioId: string }; data: Record<string, unknown> }) => {
          const idx = scenarios.findIndex((s) => s.scenarioId === args.where.scenarioId);
          if (idx >= 0) {
            scenarios[idx] = { ...scenarios[idx], ...args.data };
          }
          return scenarios[idx];
        },
      ),
    },
    mAACExperimentalData: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        experimentalData.push(args.data);
        return args.data;
      }),
      count: vi.fn(async () => experimentalData.length),
      findMany: vi.fn(async () => experimentalData),
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
    _getScenarios: () => scenarios,
    _getExperimentalData: () => experimentalData,
  };
}

/**
 * Mock MIMIC Cognitive System
 */
function createMockCognitiveSystem(): CognitiveSystem {
  let callCount = 0;

  return {
    execute: vi.fn(async (task: string, options: Record<string, unknown>) => {
      callCount++;
      const configId = (options.configId as string) || '000000000000';

      // Simulate MIMIC processing
      const response: CognitiveResponse = {
        content:
          `Analysis of task: "${task.substring(0, 50)}..."\n\n` +
          `## Goal Setting\nIdentified primary objective: Complete the analytical task\n\n` +
          `## Planning\nStep 1: Parse input data\nStep 2: Apply calculations\nStep 3: Generate insights\n\n` +
          `## Execution\nCalculated quarterly growth: 12%\nIdentified trend: Upward trajectory\n\n` +
          `## Validation\nResults verified against success criteria\n\n` +
          `## Conclusion\nTask completed with high confidence.`,
        reasoning: 'Applied structured cognitive processing',
        confidence: 0.85 + Math.random() * 0.1,
        metadata: {
          sessionId: `session-${callCount}`,
          configId,
          wordCount: 150 + Math.floor(Math.random() * 50),
          cognitiveCyclesCount: 3 + Math.floor(Math.random() * 3),
          memoryOperationsCount: configId.includes('1') ? 2 + Math.floor(Math.random() * 3) : 0,
          toolsInvoked: ['goal_engine', 'planning_engine', 'validation_engine'],
          toolsInvokedCount: 3,
          processingMethod: 'mimic_structured',
          processingTime: 1000 + Math.floor(Math.random() * 2000),
        },
      };

      return response;
    }),
  };
}

/**
 * Mock MAAC Evaluator
 */
function createMockMAACEvaluator() {
  return {
    evaluate: vi.fn(
      async (_response: CognitiveResponse, _criteria: unknown[], _metadata?: unknown) => {
        // Simulate MAAC 9D assessment with realistic 1-5 Likert scores
        const baseScore = 3.5 + Math.random() * 1;

        return {
          cognitiveLoad: Math.min(5, Math.max(1, baseScore + (Math.random() - 0.5) * 0.5)),
          toolExecution: Math.min(5, Math.max(1, baseScore + (Math.random() - 0.5) * 0.7)),
          contentQuality: Math.min(5, Math.max(1, baseScore + (Math.random() - 0.5) * 0.5)),
          memoryIntegration: Math.min(5, Math.max(1, baseScore + (Math.random() - 0.5) * 0.4)),
          complexityHandling: Math.min(5, Math.max(1, baseScore + (Math.random() - 0.5) * 0.5)),
          hallucinationControl: Math.min(
            5,
            Math.max(1, baseScore + 0.3 + (Math.random() - 0.5) * 0.5),
          ),
          knowledgeTransfer: Math.min(5, Math.max(1, baseScore + (Math.random() - 0.5) * 0.5)),
          processingEfficiency: Math.min(5, Math.max(1, baseScore + (Math.random() - 0.5) * 0.6)),
          constructValidity: Math.min(5, Math.max(1, baseScore + (Math.random() - 0.5) * 0.5)),
          overallScore: baseScore,
          confidence: 0.85 + Math.random() * 0.1,
        };
      },
    ),
  };
}

// ==================== PHASE 1: SCENARIO GENERATION (Tier 1a) ====================

describe('Tier 1 Integration: Phase 1 - Scenario Generation', () => {
  let generator: ScenarioGenerator;
  let scenarios: GeneratedScenario[];

  beforeAll(async () => {
    generator = createScenarioGenerator({
      domains: [...TEST_CONFIG.domains],
      tiers: [...TEST_CONFIG.tiers],
      repetitionsPerBlock: TEST_CONFIG.repetitionsPerBlock,
      models: [...TEST_CONFIG.models],
      configId: TEST_CONFIG.configId,
    });

    scenarios = await generator.generateScenarios();
  });

  it('generates correct number of scenarios', () => {
    // 2 domains × 2 tiers × 2 reps × 1 model = 8 scenarios
    const expected =
      TEST_CONFIG.domains.length *
      TEST_CONFIG.tiers.length *
      TEST_CONFIG.repetitionsPerBlock *
      TEST_CONFIG.models.length;

    expect(scenarios.length).toBe(expected);
  });

  it('each scenario has required fields', () => {
    for (const scenario of scenarios) {
      expect(scenario).toHaveProperty('trialId');
      expect(scenario).toHaveProperty('domain');
      expect(scenario).toHaveProperty('tier');
      expect(scenario).toHaveProperty('taskTitle');
      expect(scenario).toHaveProperty('taskDescription');
      expect(scenario).toHaveProperty('businessContext');
      expect(scenario).toHaveProperty('successCriteria');
      // Control expectations and MAAC requirements (part of structure)
      expect(scenario).toHaveProperty('controlExpectations');
      expect(scenario).toHaveProperty('maacCognitiveRequirements');
    }
  });

  it('scenarios cover all domain-tier combinations', () => {
    const combinations = new Set<string>();

    for (const scenario of scenarios) {
      combinations.add(`${scenario.domain}-${scenario.tier}`);
    }

    expect(combinations.size).toBe(TEST_CONFIG.domains.length * TEST_CONFIG.tiers.length);

    for (const domain of TEST_CONFIG.domains) {
      for (const tier of TEST_CONFIG.tiers) {
        expect(combinations.has(`${domain}-${tier}`)).toBe(true);
      }
    }
  });

  it('generates unique trial IDs', () => {
    const trialIds = scenarios.map((s) => s.trialId);
    const uniqueIds = new Set(trialIds);

    expect(uniqueIds.size).toBe(scenarios.length);
  });

  it('includes BLIND success criteria not given to LLM', () => {
    for (const scenario of scenarios) {
      expect(Array.isArray(scenario.successCriteria)).toBe(true);
      expect(scenario.successCriteria.length).toBeGreaterThan(0);

      for (const criterion of scenario.successCriteria) {
        expect(criterion).toHaveProperty('criterion');
        expect(criterion).toHaveProperty('weight');
        expect(typeof criterion.weight).toBe('number');
        expect(criterion.weight).toBeGreaterThan(0);
        expect(criterion.weight).toBeLessThanOrEqual(1);
      }
    }
  });

  it('scenario complexity reflects tier requirements', () => {
    const simpleTasks = scenarios.filter((s) => s.tier === 'simple');
    const moderateTasks = scenarios.filter((s) => s.tier === 'moderate');

    // Each tier should have scenarios
    expect(simpleTasks.length).toBeGreaterThan(0);
    expect(moderateTasks.length).toBeGreaterThan(0);

    // Check that maacCognitiveRequirements reflect complexity
    for (const simple of simpleTasks) {
      expect(simple.complexityLevel).toBe('simple');
      expect(simple.maacCognitiveRequirements).toBeDefined();
    }

    for (const moderate of moderateTasks) {
      expect(moderate.complexityLevel).toBe('moderate');
      expect(moderate.maacCognitiveRequirements).toBeDefined();
    }
  });
});

// ==================== PHASE 2: DATABASE STORAGE OF SCENARIOS ====================

describe('Tier 1 Integration: Phase 2 - Scenario Database Storage', () => {
  let mockDb: ReturnType<typeof createMockDatabase>;
  let scenarios: GeneratedScenario[];

  beforeAll(async () => {
    mockDb = createMockDatabase();

    const generator = createScenarioGenerator({
      domains: [...TEST_CONFIG.domains],
      tiers: [...TEST_CONFIG.tiers],
      repetitionsPerBlock: TEST_CONFIG.repetitionsPerBlock,
      models: [...TEST_CONFIG.models],
      configId: TEST_CONFIG.configId,
    });

    scenarios = await generator.generateScenarios();

    // Store scenarios in mock database
    await mockDb.mAACExperimentScenario.createMany({
      data: scenarios.map((s) => ({
        experimentId: 'test-experiment-001',
        scenarioId: s.trialId,
        domain: s.domain,
        tier: s.tier,
        repetition: s.repetition || 0,
        configId: s.configId,
        modelId: s.modelId,
        taskTitle: s.taskTitle,
        taskDescription: s.taskDescription,
        businessContext: s.businessContext,
        successCriteria: s.successCriteria,
        expectedCalculations: s.expectedCalculations,
        expectedInsights: s.expectedInsights,
        scenarioRequirements: s.scenarioRequirements || [],
        dataElements: s.dataElements || [],
        completed: false,
      })),
    });
  });

  it('stores all scenarios in database', async () => {
    const count = await mockDb.mAACExperimentScenario.count();
    expect(count).toBe(scenarios.length);
  });

  it('createMany was called with correct data', () => {
    expect(mockDb.mAACExperimentScenario.createMany).toHaveBeenCalledTimes(1);

    const callArgs = mockDb.mAACExperimentScenario.createMany.mock.calls[0][0];
    expect(callArgs.data.length).toBe(scenarios.length);
  });

  it('stored scenarios have correct structure', () => {
    const storedScenarios = mockDb._getScenarios();

    for (const stored of storedScenarios) {
      expect(stored).toHaveProperty('experimentId');
      expect(stored).toHaveProperty('scenarioId');
      expect(stored).toHaveProperty('domain');
      expect(stored).toHaveProperty('tier');
      expect(stored).toHaveProperty('taskTitle');
      expect(stored).toHaveProperty('taskDescription');
      expect(stored).toHaveProperty('successCriteria');
      expect(stored.completed).toBe(false);
    }
  });

  it('can retrieve scenario by ID', async () => {
    const firstScenario = scenarios[0];
    const retrieved = await mockDb.mAACExperimentScenario.findUnique({
      where: { scenarioId: firstScenario.trialId },
    });

    expect(retrieved).not.toBeNull();
    expect((retrieved as any).scenarioId).toBe(firstScenario.trialId);
  });
});

// ==================== PHASE 3: MIMIC EXECUTION ====================

describe('Tier 1 Integration: Phase 3 - MIMIC Cognitive Execution', () => {
  let mockCognitiveSystem: ReturnType<typeof createMockCognitiveSystem>;
  let scenarios: GeneratedScenario[];
  let responses: CognitiveResponse[];

  beforeAll(async () => {
    mockCognitiveSystem = createMockCognitiveSystem();

    const generator = createScenarioGenerator({
      domains: [...TEST_CONFIG.domains],
      tiers: [...TEST_CONFIG.tiers],
      repetitionsPerBlock: TEST_CONFIG.repetitionsPerBlock,
      models: [...TEST_CONFIG.models],
      configId: TEST_CONFIG.configId,
    });

    scenarios = await generator.generateScenarios();

    // Execute each scenario through MIMIC
    responses = [];
    for (const scenario of scenarios) {
      const response = await mockCognitiveSystem.execute(scenario.taskDescription, {
        configId: scenario.configId,
        memoryAccess: true,
        structuredReasoning: scenario.tier === 'complex',
      });
      responses.push(response);
    }
  });

  it('executes all scenarios through cognitive system', () => {
    expect(mockCognitiveSystem.execute).toHaveBeenCalledTimes(scenarios.length);
    expect(responses.length).toBe(scenarios.length);
  });

  it('cognitive responses have required structure', () => {
    for (const response of responses) {
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('reasoning');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('metadata');

      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(50);
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('metadata contains MIMIC execution details', () => {
    for (const response of responses) {
      const metadata = response.metadata;

      expect(metadata).toHaveProperty('sessionId');
      expect(metadata).toHaveProperty('configId');
      expect(metadata).toHaveProperty('wordCount');
      expect(metadata).toHaveProperty('cognitiveCyclesCount');
      expect(metadata).toHaveProperty('memoryOperationsCount');
      expect(metadata).toHaveProperty('toolsInvoked');
      expect(metadata).toHaveProperty('toolsInvokedCount');
    }
  });

  it('tools are invoked based on configuration', () => {
    for (const response of responses) {
      const metadata = response.metadata;
      const configId = metadata?.configId as string;

      // If config has engines enabled, tools should be invoked
      if (configId && configId.includes('1')) {
        expect((metadata?.toolsInvoked as string[])?.length).toBeGreaterThan(0);
      }
    }
  });
});

// ==================== PHASE 4: MAAC ASSESSMENT ====================

describe('Tier 1 Integration: Phase 4 - MAAC 9D Assessment', () => {
  let mockMAACEvaluator: ReturnType<typeof createMockMAACEvaluator>;
  let responses: CognitiveResponse[];
  let assessments: any[];

  beforeAll(async () => {
    mockMAACEvaluator = createMockMAACEvaluator();
    const mockCognitiveSystem = createMockCognitiveSystem();

    const generator = createScenarioGenerator({
      domains: [...TEST_CONFIG.domains],
      tiers: [...TEST_CONFIG.tiers],
      repetitionsPerBlock: TEST_CONFIG.repetitionsPerBlock,
      models: [...TEST_CONFIG.models],
      configId: TEST_CONFIG.configId,
    });

    const scenarios = await generator.generateScenarios();

    // Execute and assess each scenario
    responses = [];
    assessments = [];

    for (const scenario of scenarios) {
      const response = await mockCognitiveSystem.execute(scenario.taskDescription, {
        configId: scenario.configId,
      });
      responses.push(response);

      const assessment = await mockMAACEvaluator.evaluate(
        response,
        scenario.successCriteria,
        response.metadata,
      );
      assessments.push(assessment);
    }
  });

  it('assesses all cognitive responses', () => {
    expect(mockMAACEvaluator.evaluate).toHaveBeenCalledTimes(responses.length);
    expect(assessments.length).toBe(responses.length);
  });

  it('assessments have all 9 MAAC dimensions', () => {
    const dimensions = [
      'cognitiveLoad',
      'toolExecution',
      'contentQuality',
      'memoryIntegration',
      'complexityHandling',
      'hallucinationControl',
      'knowledgeTransfer',
      'processingEfficiency',
      'constructValidity',
    ];

    for (const assessment of assessments) {
      for (const dim of dimensions) {
        expect(assessment).toHaveProperty(dim);
        expect(typeof assessment[dim]).toBe('number');
      }
    }
  });

  it('assessment scores are in valid range (1-5 Likert)', () => {
    for (const assessment of assessments) {
      expect(assessment.cognitiveLoad).toBeGreaterThanOrEqual(1);
      expect(assessment.cognitiveLoad).toBeLessThanOrEqual(5);
      expect(assessment.overallScore).toBeGreaterThanOrEqual(1);
      expect(assessment.overallScore).toBeLessThanOrEqual(5);
    }
  });

  it('assessments include confidence score', () => {
    for (const assessment of assessments) {
      expect(assessment).toHaveProperty('confidence');
      expect(assessment.confidence).toBeGreaterThan(0);
      expect(assessment.confidence).toBeLessThanOrEqual(1);
    }
  });
});

// ==================== PHASE 5: FULL PIPELINE STORAGE ====================

describe('Tier 1 Integration: Phase 5 - Full Pipeline with Database Storage', () => {
  let mockDb: ReturnType<typeof createMockDatabase>;
  let scenarios: GeneratedScenario[];

  beforeAll(async () => {
    mockDb = createMockDatabase();
    const mockCognitiveSystem = createMockCognitiveSystem();
    const mockMAACEvaluator = createMockMAACEvaluator();

    const generator = createScenarioGenerator({
      domains: [...TEST_CONFIG.domains],
      tiers: [...TEST_CONFIG.tiers],
      repetitionsPerBlock: TEST_CONFIG.repetitionsPerBlock,
      models: [...TEST_CONFIG.models],
      configId: TEST_CONFIG.configId,
    });

    scenarios = await generator.generateScenarios();

    // Store scenarios
    await mockDb.mAACExperimentScenario.createMany({
      data: scenarios.map((s) => ({
        experimentId: 'test-experiment-001',
        scenarioId: s.trialId,
        domain: s.domain,
        tier: s.tier,
        repetition: s.repetition || 0,
        configId: s.configId,
        modelId: s.modelId,
        taskTitle: s.taskTitle,
        taskDescription: s.taskDescription,
        businessContext: s.businessContext,
        successCriteria: s.successCriteria,
        expectedCalculations: s.expectedCalculations,
        expectedInsights: s.expectedInsights,
        scenarioRequirements: s.scenarioRequirements || [],
        dataElements: s.dataElements || [],
        completed: false,
      })),
    });

    // Execute full pipeline for each scenario
    for (const scenario of scenarios) {
      // 1. Execute via MIMIC
      const response = await mockCognitiveSystem.execute(scenario.taskDescription, {
        configId: scenario.configId,
      });

      // 2. Assess via MAAC
      const assessment = await mockMAACEvaluator.evaluate(
        response,
        scenario.successCriteria,
        response.metadata,
      );

      // 3. Store results
      await mockDb.mAACExperimentalData.create({
        data: {
          experimentId: 'test-experiment-001',
          sessionId: (response.metadata?.sessionId as string) || 'unknown',
          trialId: scenario.trialId,
          configId: scenario.configId,
          domain: scenario.domain,
          tier: scenario.tier,
          repetition: scenario.repetition || 0,
          modelId: scenario.modelId,

          // MIMIC response
          mimicResponseText: response.content,
          wordCount: (response.metadata?.wordCount as number) || 0,
          processingMetadata: response.metadata,
          cognitiveCyclesCount: (response.metadata?.cognitiveCyclesCount as number) || 0,
          memoryOperationsCount: (response.metadata?.memoryOperationsCount as number) || 0,
          toolsInvokedCount: (response.metadata?.toolsInvokedCount as number) || 0,
          processingTime: (response.metadata?.processingTime as number) || 0,

          // MAAC scores
          maacCognitiveLoad: assessment.cognitiveLoad,
          maacToolExecution: assessment.toolExecution,
          maacContentQuality: assessment.contentQuality,
          maacMemoryIntegration: assessment.memoryIntegration,
          maacComplexityHandling: assessment.complexityHandling,
          maacHallucinationControl: assessment.hallucinationControl,
          maacKnowledgeTransfer: assessment.knowledgeTransfer,
          maacProcessingEfficiency: assessment.processingEfficiency,
          maacConstructValidity: assessment.constructValidity,
          maacOverallScore: assessment.overallScore,
          maacConfidence: assessment.confidence,
          maacCompleted: true,
        },
      });

      // 4. Mark scenario as completed
      await mockDb.mAACExperimentScenario.update({
        where: { scenarioId: scenario.trialId },
        data: { completed: true },
      });
    }
  });

  it('stores all experimental data', async () => {
    const count = await mockDb.mAACExperimentalData.count();
    expect(count).toBe(scenarios.length);
  });

  it('marks all scenarios as completed', () => {
    const storedScenarios = mockDb._getScenarios();

    for (const scenario of storedScenarios) {
      expect(scenario.completed).toBe(true);
    }
  });

  it('experimental data includes MIMIC response', () => {
    const data = mockDb._getExperimentalData();

    for (const record of data) {
      expect(record).toHaveProperty('mimicResponseText');
      expect(typeof record.mimicResponseText).toBe('string');
      expect((record.mimicResponseText as string).length).toBeGreaterThan(0);

      expect(record).toHaveProperty('wordCount');
      expect(record).toHaveProperty('cognitiveCyclesCount');
      expect(record).toHaveProperty('memoryOperationsCount');
    }
  });

  it('experimental data includes all MAAC scores', () => {
    const data = mockDb._getExperimentalData();
    const maacFields = [
      'maacCognitiveLoad',
      'maacToolExecution',
      'maacContentQuality',
      'maacMemoryIntegration',
      'maacComplexityHandling',
      'maacHallucinationControl',
      'maacKnowledgeTransfer',
      'maacProcessingEfficiency',
      'maacConstructValidity',
      'maacOverallScore',
      'maacConfidence',
    ];

    for (const record of data) {
      for (const field of maacFields) {
        expect(record).toHaveProperty(field);
        expect(typeof record[field]).toBe('number');
      }
      expect(record.maacCompleted).toBe(true);
    }
  });

  it('data is ready for Tier 2 analysis', () => {
    const data = mockDb._getExperimentalData();

    // Should have scores across all domains and tiers
    const domains = new Set(data.map((d) => d.domain));
    const tiers = new Set(data.map((d) => d.tier));

    expect(domains.size).toBe(TEST_CONFIG.domains.length);
    expect(tiers.size).toBe(TEST_CONFIG.tiers.length);

    // All records should be MAAC completed
    for (const record of data) {
      expect(record.maacCompleted).toBe(true);
    }
  });

  it('produces summary statistics', () => {
    const data = mockDb._getExperimentalData();

    // Calculate summary stats
    const overallScores = data.map((d) => d.maacOverallScore as number);
    const avgScore = overallScores.reduce((a, b) => a + b, 0) / overallScores.length;
    const minScore = Math.min(...overallScores);
    const maxScore = Math.max(...overallScores);

    console.log('\n📊 Tier 1 Pipeline Summary:');
    console.log(`  Scenarios Generated: ${scenarios.length}`);
    console.log(`  Trials Executed: ${data.length}`);
    console.log(`  Average MAAC Score: ${avgScore.toFixed(2)}`);
    console.log(`  Score Range: ${minScore.toFixed(2)} - ${maxScore.toFixed(2)}`);
    console.log(`  Domains: ${[...new Set(data.map((d) => d.domain))].join(', ')}`);
    console.log(`  Tiers: ${[...new Set(data.map((d) => d.tier))].join(', ')}`);

    // MAAC scores use 1-5 Likert scale
    expect(avgScore).toBeGreaterThan(2.5);
    expect(avgScore).toBeLessThan(4.5);
  });
});
