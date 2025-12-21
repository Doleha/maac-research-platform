/**
 * Tier 1a Scenario Generation Routes
 *
 * RESTful API endpoints for generating and storing experimental scenarios:
 * - POST /scenarios/generate - Generate scenarios and store to database
 * - GET /scenarios - List stored scenarios
 * - GET /scenarios/:id - Get specific scenario
 *
 * Reference: MAAC - Tier 1a - Experiment Processing - Scenario Generation Only.json
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import {
  ScenarioGenerator,
  createFullToolsScenarioGenerator,
  createBaselineScenarioGenerator,
  createLLMScenarioGenerator,
  type LLMScenarioGeneratorConfig,
  type ScenarioGenerationProgress,
  type GeneratedLLMScenario,
} from '@maac/experiment-orchestrator';
import type { Domain, Tier, ModelId } from '@maac/types';
import { logger } from './logs.js';

/**
 * Input schema for scenario generation
 */
interface GenerateScenariosInput {
  domains?: Domain[];
  tiers?: Tier[];
  repetitions?: number; // Per domain-tier combination
  models?: ModelId[];
  configId?: string;
  configType?: 'full_tools' | 'baseline' | 'custom';
}

/**
 * Input schema for LLM-based scenario generation
 */
interface GenerateLLMScenariosInput {
  domains?: Domain[];
  tiers?: Tier[];
  repetitions?: number;
  model?: ModelId;
  configId?: string;
}

/**
 * Register scenario routes
 */
export async function scenarioRoutes(
  fastify: FastifyInstance,
  opts: {
    prisma: PrismaClient;
  },
): Promise<void> {
  const { prisma } = opts;

  // ==========================================================================
  // GENERATE SCENARIOS (Tier 1a)
  // ==========================================================================

  /**
   * POST /scenarios/generate
   * Generate experimental scenarios and store to database
   */
  fastify.post<{ Body: GenerateScenariosInput }>(
    '/scenarios/generate',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            domains: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['analytical', 'planning', 'communication', 'problem_solving'],
              },
              default: ['analytical', 'planning'],
            },
            tiers: {
              type: 'array',
              items: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
              default: ['simple', 'moderate'],
            },
            repetitions: {
              type: 'integer',
              minimum: 1,
              maximum: 150,
              default: 5,
            },
            models: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['deepseek_v3', 'sonnet_37', 'gpt_4o', 'llama_maverick'],
              },
              default: ['deepseek_v3'],
            },
            configType: {
              type: 'string',
              enum: ['full_tools', 'baseline', 'custom'],
              default: 'full_tools',
            },
            configId: {
              type: 'string',
              pattern: '^[01]{12}$',
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              experimentId: { type: 'string' },
              count: { type: 'integer' },
              scenarios: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scenarioId: { type: 'string' },
                    domain: { type: 'string' },
                    tier: { type: 'string' },
                    taskTitle: { type: 'string' },
                  },
                },
              },
              configuration: {
                type: 'object',
                properties: {
                  domains: { type: 'array', items: { type: 'string' } },
                  tiers: { type: 'array', items: { type: 'string' } },
                  repetitions: { type: 'integer' },
                  models: { type: 'array', items: { type: 'string' } },
                  configId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: GenerateScenariosInput }>, reply: FastifyReply) => {
      const {
        domains = ['analytical', 'planning'],
        tiers = ['simple', 'moderate'],
        repetitions = 5,
        models = ['deepseek_v3'],
        configType = 'full_tools',
        configId: customConfigId,
      } = request.body;

      fastify.log.info(
        `Generating scenarios: ${domains.length} domains × ${tiers.length} tiers × ${repetitions} reps × ${models.length} models`,
      );

      try {
        // Create scenario generator based on config type
        let generator: ScenarioGenerator;
        let configId: string;

        switch (configType) {
          case 'full_tools':
            generator = createFullToolsScenarioGenerator();
            configId = '111111111111';
            break;
          case 'baseline':
            generator = createBaselineScenarioGenerator();
            configId = '000000000000';
            break;
          case 'custom':
            if (!customConfigId) {
              return reply.code(400).send({
                error: 'configId required when configType is "custom"',
              });
            }
            generator = new ScenarioGenerator({ configId: customConfigId });
            configId = customConfigId;
            break;
          default:
            generator = createFullToolsScenarioGenerator();
            configId = '111111111111';
        }

        // Override generator config with request parameters
        generator = new ScenarioGenerator({
          domains,
          tiers,
          repetitionsPerBlock: repetitions,
          models,
          configId,
        });

        // Generate scenarios
        const startTime = Date.now();
        const scenarios = await generator.generateScenarios();
        const generationTime = Date.now() - startTime;

        fastify.log.info(`Generated ${scenarios.length} scenarios in ${generationTime}ms`);

        // Store scenarios to database
        const experimentId = scenarios[0]?.experimentId || crypto.randomUUID();

        // Convert scenarios to database records with JSON serialization
        const scenarioRecords = scenarios.map((scenario) => ({
          experimentId: scenario.experimentId,
          scenarioId: scenario.scenarioId,
          domain: scenario.domain,
          tier: scenario.tier,
          repetition: scenario.repetition,
          configId: scenario.configId,
          modelId: scenario.modelId,
          taskTitle: scenario.taskTitle,
          taskDescription: scenario.taskDescription,
          businessContext: scenario.businessContext,
          successCriteria: JSON.parse(JSON.stringify(scenario.successCriteria)),
          expectedCalculations: JSON.parse(
            JSON.stringify(scenario.controlExpectations.expectedCalculations),
          ),
          expectedInsights: JSON.parse(
            JSON.stringify(scenario.controlExpectations.expectedInsights),
          ),
          scenarioRequirements: JSON.parse(JSON.stringify(scenario.requirements)),
          dataElements: JSON.parse(JSON.stringify(scenario.domainSpecificData)),
          completed: false,
        }));

        // Insert in batches to avoid timeout
        const batchSize = 100;
        let insertedCount = 0;

        for (let i = 0; i < scenarioRecords.length; i += batchSize) {
          const batch = scenarioRecords.slice(i, i + batchSize);
          await prisma.mAACExperimentScenario.createMany({
            data: batch,
            skipDuplicates: true,
          });
          insertedCount += batch.length;
          fastify.log.info(`Inserted batch ${i / batchSize + 1}: ${batch.length} scenarios`);
        }

        // Return summary
        return reply.code(201).send({
          message: `Successfully generated and stored ${scenarios.length} scenarios`,
          experimentId,
          count: scenarios.length,
          scenarios: scenarios.slice(0, 10).map((s) => ({
            scenarioId: s.scenarioId,
            domain: s.domain,
            tier: s.tier,
            taskTitle: s.taskTitle,
          })),
          configuration: {
            domains,
            tiers,
            repetitions,
            models,
            configId,
            generationTimeMs: generationTime,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        if (error instanceof Error) {
          return reply.code(500).send({
            error: 'Scenario generation failed',
            message: error.message,
          });
        }
        throw error;
      }
    },
  );

  // ==========================================================================
  // GENERATE SCENARIOS WITH LLM (Production - Tier 1a)
  // ==========================================================================

  /**
   * POST /scenarios/generate-llm
   * Generate scenarios using DeepSeek LLM (matches n8n production workflow)
   *
   * This endpoint calls DeepSeek with the exact n8n Tier 1a system prompt
   * to generate unique, detailed scenarios with embedded calculations.
   */
  fastify.post<{ Body: GenerateLLMScenariosInput }>(
    '/scenarios/generate-llm',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            domains: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['analytical', 'planning', 'communication', 'problem_solving'],
              },
              default: ['analytical'],
            },
            tiers: {
              type: 'array',
              items: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
              default: ['simple'],
            },
            repetitions: {
              type: 'integer',
              minimum: 1,
              maximum: 150,
              default: 1,
            },
            model: {
              type: 'string',
              enum: ['deepseek_v3', 'sonnet_37', 'gpt_4o', 'llama_maverick'],
              default: 'deepseek_v3',
            },
            configId: {
              type: 'string',
              pattern: '^[01]{12}$',
              default: '111111111111',
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              experimentId: { type: 'string' },
              count: { type: 'integer' },
              generationMethod: { type: 'string' },
              scenarios: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scenarioId: { type: 'string' },
                    domain: { type: 'string' },
                    tier: { type: 'string' },
                    task_title: { type: 'string' },
                    task_description: { type: 'string' },
                    expected_calculations: { type: 'object' },
                    success_thresholds: { type: 'object' },
                    generationDurationMs: { type: 'integer' },
                  },
                },
              },
              totalGenerationTimeMs: { type: 'integer' },
              configuration: {
                type: 'object',
                properties: {
                  domains: { type: 'array', items: { type: 'string' } },
                  tiers: { type: 'array', items: { type: 'string' } },
                  repetitions: { type: 'integer' },
                  model: { type: 'string' },
                  configId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: GenerateLLMScenariosInput }>, reply: FastifyReply) => {
      const {
        domains = ['analytical'],
        tiers = ['simple'],
        repetitions = 1,
        model = 'deepseek_v3',
        configId = '111111111111',
      } = request.body;

      // Get DeepSeek API key from environment
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      if (!deepseekApiKey) {
        return reply.code(500).send({
          error: 'DEEPSEEK_API_KEY not configured',
          message: 'LLM-based scenario generation requires DeepSeek API key',
        });
      }

      const totalScenarios = domains.length * tiers.length * repetitions;
      fastify.log.info(
        `LLM Generating ${totalScenarios} scenarios: ${domains.length} domains × ${tiers.length} tiers × ${repetitions} reps`,
      );

      try {
        // Create LLM scenario generator
        const generatorConfig: LLMScenarioGeneratorConfig = {
          deepseekApiKey,
          domains,
          tiers,
          models: [model],
          configId,
          maxRetries: 3,
          rateLimitDelayMs: 1500, // 1.5s between API calls
        };

        const generator = createLLMScenarioGenerator(generatorConfig);

        // Generate scenarios with LLM
        const startTime = Date.now();
        const scenarios = await generator.generateScenarios({
          domains,
          tiers,
          repetitions,
          model,
        });
        const totalGenerationTime = Date.now() - startTime;

        fastify.log.info(
          `LLM generated ${scenarios.length} scenarios in ${totalGenerationTime}ms (avg ${Math.round(totalGenerationTime / scenarios.length)}ms each)`,
        );

        // Store scenarios to database
        const experimentId = scenarios[0]?.metadata?.experiment_id || crypto.randomUUID();

        // Convert LLM scenarios to database records
        const scenarioRecords = scenarios.map((scenario) => ({
          experimentId: scenario.metadata.experiment_id,
          scenarioId: scenario.scenarioId,
          domain: scenario.metadata.business_domain,
          tier: scenario.complexity_level,
          repetition: scenario.scenario_number,
          configId: scenario.configId,
          modelId: scenario.modelId,
          taskTitle: scenario.task_title,
          taskDescription: scenario.task_description,
          businessContext: scenario.business_context,
          successCriteria: JSON.parse(JSON.stringify(scenario.success_criteria)),
          expectedCalculations: JSON.parse(
            JSON.stringify(scenario.control_expectations.expected_calculations),
          ),
          expectedInsights: JSON.parse(
            JSON.stringify(scenario.control_expectations.expected_insights),
          ),
          scenarioRequirements: JSON.parse(JSON.stringify(scenario.requirements)),
          dataElements: JSON.parse(JSON.stringify(scenario.domain_specific_data)),
          completed: false,
        }));

        // Insert in batches
        const batchSize = 50;
        let insertedCount = 0;

        for (let i = 0; i < scenarioRecords.length; i += batchSize) {
          const batch = scenarioRecords.slice(i, i + batchSize);
          await prisma.mAACExperimentScenario.createMany({
            data: batch,
            skipDuplicates: true,
          });
          insertedCount += batch.length;
          fastify.log.info(`Inserted LLM batch ${i / batchSize + 1}: ${batch.length} scenarios`);
        }

        // Return detailed summary
        return reply.code(201).send({
          message: `Successfully generated ${scenarios.length} LLM-based scenarios`,
          experimentId,
          count: scenarios.length,
          generationMethod: 'deepseek-llm',
          scenarios: scenarios.map((s) => ({
            scenarioId: s.scenarioId,
            domain: s.metadata.business_domain,
            tier: s.complexity_level,
            task_title: s.task_title,
            task_description: s.task_description.substring(0, 200) + '...',
            expected_calculations: s.control_expectations.expected_calculations,
            success_thresholds: s.control_expectations.success_thresholds,
            generationDurationMs: s.generationDurationMs,
          })),
          totalGenerationTimeMs: totalGenerationTime,
          configuration: {
            domains,
            tiers,
            repetitions,
            model,
            configId,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        if (error instanceof Error) {
          return reply.code(500).send({
            error: 'LLM scenario generation failed',
            message: error.message,
            hint: 'Check DeepSeek API key and rate limits',
          });
        }
        throw error;
      }
    },
  );

  // ==========================================================================
  // GENERATE SCENARIOS WITH LLM + STREAMING PROGRESS (SSE)
  // ==========================================================================

  /**
   * POST /scenarios/generate-llm-stream
   * Generate scenarios using DeepSeek LLM with Server-Sent Events for real-time progress
   *
   * Returns an SSE stream with progress updates as each scenario is generated.
   * Use this for UI feedback with progress bars.
   */
  fastify.post<{ Body: GenerateLLMScenariosInput }>(
    '/scenarios/generate-llm-stream',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            domains: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['analytical', 'planning', 'communication', 'problem_solving'],
              },
              default: ['analytical'],
            },
            tiers: {
              type: 'array',
              items: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
              default: ['simple'],
            },
            repetitions: {
              type: 'integer',
              minimum: 1,
              maximum: 150,
              default: 1,
            },
            model: {
              type: 'string',
              enum: ['deepseek_v3', 'sonnet_37', 'gpt_4o', 'llama_maverick'],
              default: 'deepseek_v3',
            },
            configId: {
              type: 'string',
              pattern: '^[01]{12}$',
              default: '111111111111',
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: GenerateLLMScenariosInput }>, reply: FastifyReply) => {
      const {
        domains = ['analytical'],
        tiers = ['simple'],
        repetitions = 1,
        model = 'deepseek_v3',
        configId = '111111111111',
      } = request.body;

      // Get DeepSeek API key from environment
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      if (!deepseekApiKey) {
        return reply.code(500).send({
          error: 'DEEPSEEK_API_KEY not configured',
          message: 'LLM-based scenario generation requires DeepSeek API key',
        });
      }

      const totalScenarios = domains.length * tiers.length * repetitions;
      fastify.log.info(`[SSE] LLM Generating ${totalScenarios} scenarios with streaming progress`);

      // Set SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      });

      // Helper to send SSE event
      const sendEvent = (event: string, data: unknown) => {
        reply.raw.write(`event: ${event}\n`);
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Store generated scenarios for final database insert
      const generatedScenarios: GeneratedLLMScenario[] = [];

      try {
        // Create LLM scenario generator
        const generatorConfig: LLMScenarioGeneratorConfig = {
          deepseekApiKey,
          domains,
          tiers,
          models: [model],
          configId,
          maxRetries: 3,
          rateLimitDelayMs: 1500,
        };

        const generator = createLLMScenarioGenerator(generatorConfig);
        const startTime = Date.now();

        // Generate scenarios with progress callback
        const scenarios = await generator.generateScenarios({
          domains,
          tiers,
          repetitions,
          model,
          onProgress: (progress: ScenarioGenerationProgress) => {
            // Send progress event
            sendEvent('progress', {
              type: progress.type,
              current: progress.current,
              total: progress.total,
              percentage: progress.percentage,
              domain: progress.domain,
              tier: progress.tier,
              repetition: progress.repetition,
              scenarioId: progress.scenarioId,
              taskTitle: progress.taskTitle,
              message: progress.message,
              error: progress.error,
              elapsedMs: progress.elapsedMs,
              estimatedRemainingMs: progress.estimatedRemainingMs,
            });

            // Track scenarios for database insert
            if (progress.type === 'scenario_complete' && progress.scenario) {
              generatedScenarios.push(progress.scenario);
            }
          },
        });

        const totalGenerationTime = Date.now() - startTime;

        // Send storing event
        sendEvent('progress', {
          type: 'storing',
          current: scenarios.length,
          total: scenarios.length,
          percentage: 100,
          message: `Storing ${scenarios.length} scenarios to database...`,
        });

        // Store scenarios to database
        const experimentId = scenarios[0]?.metadata?.experiment_id || crypto.randomUUID();

        const scenarioRecords = scenarios.map((scenario) => ({
          experimentId: scenario.metadata.experiment_id,
          scenarioId: scenario.scenarioId,
          domain: scenario.metadata.business_domain,
          tier: scenario.complexity_level,
          repetition: scenario.scenario_number,
          configId: scenario.configId,
          modelId: scenario.modelId,
          taskTitle: scenario.task_title,
          taskDescription: scenario.task_description,
          businessContext: scenario.business_context,
          successCriteria: JSON.parse(JSON.stringify(scenario.success_criteria)),
          expectedCalculations: JSON.parse(
            JSON.stringify(scenario.control_expectations.expected_calculations),
          ),
          expectedInsights: JSON.parse(
            JSON.stringify(scenario.control_expectations.expected_insights),
          ),
          scenarioRequirements: JSON.parse(JSON.stringify(scenario.requirements)),
          dataElements: JSON.parse(JSON.stringify(scenario.domain_specific_data)),
          completed: false,
        }));

        // Insert in batches
        const batchSize = 50;
        for (let i = 0; i < scenarioRecords.length; i += batchSize) {
          const batch = scenarioRecords.slice(i, i + batchSize);
          await prisma.mAACExperimentScenario.createMany({
            data: batch,
            skipDuplicates: true,
          });

          // Send storage progress
          sendEvent('progress', {
            type: 'storing',
            current: Math.min(i + batchSize, scenarioRecords.length),
            total: scenarioRecords.length,
            percentage: Math.round(((i + batchSize) / scenarioRecords.length) * 100),
            message: `Stored ${Math.min(i + batchSize, scenarioRecords.length)}/${scenarioRecords.length} scenarios...`,
          });
        }

        // Send final complete event
        sendEvent('complete', {
          message: `Successfully generated and stored ${scenarios.length} scenarios`,
          experimentId,
          count: scenarios.length,
          generationMethod: 'deepseek-llm-streaming',
          totalGenerationTimeMs: totalGenerationTime,
          avgTimePerScenarioMs: Math.round(totalGenerationTime / scenarios.length),
          scenarios: scenarios.map((s) => ({
            scenarioId: s.scenarioId,
            domain: s.metadata.business_domain,
            tier: s.complexity_level,
            task_title: s.task_title,
          })),
          configuration: {
            domains,
            tiers,
            repetitions,
            model,
            configId,
          },
        });

        // End the stream
        reply.raw.end();
      } catch (error) {
        fastify.log.error(error);

        // Send error event
        sendEvent('error', {
          error: 'LLM scenario generation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          hint: 'Check DeepSeek API key and rate limits',
          scenariosGenerated: generatedScenarios.length,
        });

        reply.raw.end();
      }
    },
  );

  // ==========================================================================
  // LIST SCENARIOS
  // ==========================================================================

  /**
   * GET /scenarios
   * List stored scenarios with optional filtering
   */
  fastify.get<{
    Querystring: {
      limit?: number;
      offset?: number;
      domain?: Domain;
      tier?: Tier;
      experimentId?: string;
      completed?: boolean;
    };
  }>(
    '/scenarios',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
            offset: { type: 'integer', minimum: 0, default: 0 },
            domain: {
              type: 'string',
              enum: ['analytical', 'planning', 'communication', 'problem_solving'],
            },
            tier: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
            experimentId: { type: 'string' },
            completed: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              scenarios: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    scenarioId: { type: 'string' },
                    experimentId: { type: 'string' },
                    domain: { type: 'string' },
                    tier: { type: 'string' },
                    taskTitle: { type: 'string' },
                    completed: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  limit: { type: 'integer' },
                  offset: { type: 'integer' },
                  total: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const { limit = 50, offset = 0, domain, tier, experimentId, completed } = request.query;

      const where: Record<string, unknown> = {};
      if (domain) where.domain = domain;
      if (tier) where.tier = tier;
      if (experimentId) where.experimentId = experimentId;
      if (completed !== undefined) where.completed = completed;

      const [scenarios, total] = await Promise.all([
        prisma.mAACExperimentScenario.findMany({
          where,
          select: {
            id: true,
            scenarioId: true,
            experimentId: true,
            domain: true,
            tier: true,
            taskTitle: true,
            completed: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.mAACExperimentScenario.count({ where }),
      ]);

      return {
        scenarios,
        pagination: {
          limit,
          offset,
          total,
        },
      };
    },
  );

  // ==========================================================================
  // GET SCENARIO BY ID
  // ==========================================================================

  /**
   * GET /scenarios/:scenarioId
   * Get full scenario details
   */
  fastify.get<{ Params: { scenarioId: string } }>(
    '/scenarios/:scenarioId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['scenarioId'],
          properties: {
            scenarioId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { scenarioId } = request.params;

      const scenario = await prisma.mAACExperimentScenario.findUnique({
        where: { scenarioId },
      });

      if (!scenario) {
        return reply.code(404).send({
          error: 'Scenario not found',
          scenarioId,
        });
      }

      return scenario;
    },
  );

  // ==========================================================================
  // GET SCENARIO STATISTICS
  // ==========================================================================

  /**
   * GET /scenarios/stats
   * Get scenario statistics by domain and tier
   */
  fastify.get(
    '/scenarios/stats',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              completed: { type: 'integer' },
              pending: { type: 'integer' },
              byDomain: { type: 'object' },
              byTier: { type: 'object' },
              recentExperiments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    experimentId: { type: 'string' },
                    count: { type: 'integer' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      const [total, completed, byDomain, byTier, recentExperiments] = await Promise.all([
        prisma.mAACExperimentScenario.count(),
        prisma.mAACExperimentScenario.count({ where: { completed: true } }),
        prisma.mAACExperimentScenario.groupBy({
          by: ['domain'],
          _count: true,
        }),
        prisma.mAACExperimentScenario.groupBy({
          by: ['tier'],
          _count: true,
        }),
        prisma.$queryRaw`
            SELECT experiment_id, COUNT(*) as count, MIN(created_at) as created_at
            FROM maac_experiment_scenarios
            GROUP BY experiment_id
            ORDER BY MIN(created_at) DESC
            LIMIT 5
          ` as Promise<Array<{ experiment_id: string; count: bigint; created_at: Date }>>,
      ]);

      return {
        total,
        completed,
        pending: total - completed,
        byDomain: Object.fromEntries(byDomain.map((d) => [d.domain, d._count])),
        byTier: Object.fromEntries(byTier.map((t) => [t.tier, t._count])),
        recentExperiments: recentExperiments.map((e) => ({
          experimentId: e.experiment_id,
          count: Number(e.count),
          createdAt: e.created_at.toISOString(),
        })),
      };
    },
  );

  // ==========================================================================
  // UPDATE SCENARIO
  // ==========================================================================

  /**
   * PUT /scenarios/:id
   * Update an existing scenario
   */
  fastify.put<{
    Params: { id: string };
    Body: {
      taskTitle?: string;
      taskDescription?: string;
      businessContext?: string;
      successCriteria?: object;
      expectedInsights?: object;
    };
  }>(
    '/scenarios/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            taskTitle: { type: 'string' },
            taskDescription: { type: 'string' },
            businessContext: { type: 'string' },
            successCriteria: { type: 'object' },
            expectedInsights: { type: 'object' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              scenario: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const updates = request.body;

      try {
        const scenario = await prisma.mAACExperimentScenario.findFirst({
          where: { scenarioId: id },
        });

        if (!scenario) {
          return reply.code(404).send({ error: 'Scenario not found' });
        }

        const updated = await prisma.mAACExperimentScenario.update({
          where: { id: scenario.id },
          data: {
            taskTitle: updates.taskTitle ?? scenario.taskTitle,
            taskDescription: updates.taskDescription ?? scenario.taskDescription,
            businessContext: updates.businessContext ?? scenario.businessContext,
            successCriteria: (updates.successCriteria ?? scenario.successCriteria) as object,
            expectedInsights: (updates.expectedInsights ?? scenario.expectedInsights) as object,
          },
        });

        return {
          message: 'Scenario updated',
          scenario: {
            id: updated.id,
            scenarioId: updated.scenarioId,
            domain: updated.domain,
            tier: updated.tier,
            taskTitle: updated.taskTitle,
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to update scenario' });
      }
    },
  );

  // ==========================================================================
  // DELETE SCENARIO
  // ==========================================================================

  /**
   * DELETE /scenarios/:id
   * Delete a scenario
   */
  fastify.delete<{ Params: { id: string } }>(
    '/scenarios/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              scenarioId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        const scenario = await prisma.mAACExperimentScenario.findFirst({
          where: { scenarioId: id },
        });

        if (!scenario) {
          return reply.code(404).send({ error: 'Scenario not found' });
        }

        await prisma.mAACExperimentScenario.delete({
          where: { id: scenario.id },
        });

        return {
          message: 'Scenario deleted',
          scenarioId: id,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to delete scenario' });
      }
    },
  );

  // ==========================================================================
  // BULK IMPORT SCENARIOS
  // ==========================================================================

  /**
   * POST /scenarios/bulk-import
   * Import multiple scenarios from JSON array
   */
  fastify.post<{
    Body: {
      scenarios: Array<{
        domain: string;
        tier: string;
        taskTitle: string;
        taskDescription: string;
        businessContext: string;
        successCriteria: object;
        expectedCalculations?: object;
        expectedInsights: object;
        scenarioRequirements?: object;
        dataElements?: object;
      }>;
      experimentId?: string;
      configId?: string;
      modelId?: string;
    };
  }>(
    '/scenarios/bulk-import',
    {
      schema: {
        body: {
          type: 'object',
          required: ['scenarios'],
          properties: {
            scenarios: {
              type: 'array',
              items: {
                type: 'object',
                required: [
                  'domain',
                  'tier',
                  'taskTitle',
                  'taskDescription',
                  'businessContext',
                  'successCriteria',
                  'expectedInsights',
                ],
                properties: {
                  domain: { type: 'string' },
                  tier: { type: 'string' },
                  taskTitle: { type: 'string' },
                  taskDescription: { type: 'string' },
                  businessContext: { type: 'string' },
                  successCriteria: { type: 'object' },
                  expectedCalculations: { type: 'object' },
                  expectedInsights: { type: 'object' },
                  scenarioRequirements: { type: 'object' },
                  dataElements: { type: 'object' },
                },
              },
              minItems: 1,
            },
            experimentId: { type: 'string' },
            configId: { type: 'string' },
            modelId: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              imported: { type: 'integer' },
              scenarioIds: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { scenarios, experimentId, configId, modelId } = request.body;

      try {
        const imported: string[] = [];
        const expId = experimentId || crypto.randomUUID();
        const config = configId || 'imported';
        const model = modelId || 'imported';

        for (let i = 0; i < scenarios.length; i++) {
          const s = scenarios[i];
          const scenarioId = `${s.domain}-${s.tier}-${String(i).padStart(3, '0')}-${Date.now()}`;

          await prisma.mAACExperimentScenario.create({
            data: {
              experimentId: expId,
              scenarioId,
              domain: s.domain,
              tier: s.tier,
              repetition: i + 1,
              configId: config,
              modelId: model,
              taskTitle: s.taskTitle,
              taskDescription: s.taskDescription,
              businessContext: s.businessContext,
              successCriteria: s.successCriteria,
              expectedCalculations: s.expectedCalculations || {},
              expectedInsights: s.expectedInsights,
              scenarioRequirements: s.scenarioRequirements || {},
              dataElements: s.dataElements || undefined,
              completed: false,
            },
          });

          imported.push(scenarioId);
        }

        return reply.code(201).send({
          message: `Imported ${imported.length} scenarios`,
          imported: imported.length,
          scenarioIds: imported,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to import scenarios' });
      }
    },
  );

  // ==========================================================================
  // COST ESTIMATION
  // ==========================================================================

  /**
   * POST /scenarios/generate/estimate
   * Estimate tokens and cost for scenario generation
   */
  fastify.post<{
    Body: {
      domains?: string[];
      tiers?: string[];
      repetitions?: number;
      models?: string[];
    };
  }>(
    '/scenarios/generate/estimate',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            domains: { type: 'array', items: { type: 'string' } },
            tiers: { type: 'array', items: { type: 'string' } },
            repetitions: { type: 'integer', minimum: 1 },
            models: { type: 'array', items: { type: 'string' } },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              scenarioCount: { type: 'integer' },
              estimatedInputTokens: { type: 'integer' },
              estimatedOutputTokens: { type: 'integer' },
              estimatedCost: { type: 'object' },
            },
          },
        },
      },
    },
    async (request) => {
      const {
        domains = ['analytical', 'planning', 'communication', 'problem_solving'],
        tiers = ['simple', 'moderate', 'complex'],
        repetitions = 10,
        models = ['gpt_4o'],
      } = request.body;

      const scenarioCount = domains.length * tiers.length * repetitions * models.length;

      // Estimate tokens per scenario (based on typical MAAC scenario size)
      const inputTokensPerScenario = 2000; // Prompt tokens
      const outputTokensPerScenario = 1500; // Response tokens

      const totalInputTokens = scenarioCount * inputTokensPerScenario;
      const totalOutputTokens = scenarioCount * outputTokensPerScenario;

      // Cost estimates per 1M tokens (as of 2025)
      const costs: Record<string, { input: number; output: number }> = {
        gpt_4o: { input: 2.5, output: 10.0 },
        sonnet_37: { input: 3.0, output: 15.0 },
        deepseek_v3: { input: 0.27, output: 1.1 },
        llama_maverick: { input: 0.2, output: 0.2 },
      };

      const estimatedCostByModel: Record<string, number> = {};
      for (const model of models) {
        const modelCost = costs[model] || costs['gpt_4o'];
        const inputCost = (totalInputTokens / 1_000_000) * modelCost.input;
        const outputCost = (totalOutputTokens / 1_000_000) * modelCost.output;
        estimatedCostByModel[model] = Math.round((inputCost + outputCost) * 100) / 100;
      }

      return {
        scenarioCount,
        estimatedInputTokens: totalInputTokens,
        estimatedOutputTokens: totalOutputTokens,
        estimatedCost: {
          byModel: estimatedCostByModel,
          total: Object.values(estimatedCostByModel).reduce((a, b) => a + b, 0),
          currency: 'USD',
        },
      };
    },
  );
}

export default scenarioRoutes;
