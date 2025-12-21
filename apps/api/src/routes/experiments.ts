/**
 * Experiment API Routes
 *
 * RESTful API endpoints for managing MAAC experiments:
 * - POST /experiments - Create and start a new experiment
 * - GET /experiments/:id/status - Get experiment progress
 * - GET /experiments/:id/results - Get experiment results
 * - POST /experiments/:id/pause - Pause experiment
 * - POST /experiments/:id/resume - Resume experiment
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import {
  AdvancedExperimentOrchestrator,
  CreateExperimentSchema,
  CreateExperimentInput,
} from '@maac/experiment-orchestrator';
import type { Domain, Tier, SuccessCriterion } from '@maac/types';
import { logger } from './logs.js';

/**
 * Register experiment routes
 */
export async function experimentRoutes(
  fastify: FastifyInstance,
  opts: {
    orchestrator: AdvancedExperimentOrchestrator;
    prisma: PrismaClient;
    prefix?: string;
  },
): Promise<void> {
  const { orchestrator, prisma } = opts;

  // ==========================================================================
  // CREATE EXPERIMENT
  // ==========================================================================

  /**
   * POST /experiments
   * Create and start a new experiment
   *
   * Supports two modes:
   * 1. scenarioIds provided: Uses existing MAACExperimentScenario records
   * 2. domains/tiers provided: Creates trials based on domain/tier combinations
   */
  fastify.post<{ Body: CreateExperimentInput }>(
    '/experiments',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'models', 'toolConfigs'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', maxLength: 2000 },
            // Mode 1: Use existing scenarios
            scenarioIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs of existing MAACExperimentScenario records to use',
            },
            // Mode 2: Generate trials from domain/tier combinations
            domains: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['analytical', 'planning', 'communication', 'problem_solving'],
              },
            },
            tiers: {
              type: 'array',
              items: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
            },
            repetitionsPerDomainTier: { type: 'integer', minimum: 1, maximum: 200 },
            models: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['deepseek_v3', 'sonnet_37', 'gpt_4o', 'llama_maverick'],
              },
              minItems: 1,
            },
            toolConfigs: {
              type: 'array',
              items: {
                type: 'object',
                required: ['configId', 'name'],
                properties: {
                  configId: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  toolConfiguration: {
                    type: 'object',
                    properties: {
                      enableGoalEngine: { type: 'boolean' },
                      enablePlanningEngine: { type: 'boolean' },
                      enableClarificationEngine: { type: 'boolean' },
                      enableValidationEngine: { type: 'boolean' },
                      enableEvaluationEngine: { type: 'boolean' },
                      enableReflectionEngine: { type: 'boolean' },
                      enableMemoryStore: { type: 'boolean' },
                      enableMemoryQuery: { type: 'boolean' },
                      enableThinkTool: { type: 'boolean' },
                    },
                  },
                },
              },
              minItems: 1,
            },
            parallelism: { type: 'integer', minimum: 1, maximum: 100 },
            timeout: { type: 'integer', minimum: 1000 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              experimentId: { type: 'string' },
              totalTrials: { type: 'integer' },
              status: { type: 'string' },
              queuedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateExperimentInput }>, reply: FastifyReply) => {
      try {
        // Validate input
        const validated = CreateExperimentSchema.parse(request.body);

        // Generate experiment ID
        const experimentId = crypto.randomUUID();

        // Determine mode and calculate trials
        const isScenarioMode = validated.scenarioIds && validated.scenarioIds.length > 0;
        let totalTrials: number;
        let scenarioRecords: Array<{
          id: number;
          scenarioId: string;
          domain: string;
          tier: string;
          repetition: number;
          taskTitle: string;
          taskDescription: string;
          businessContext: string;
          successCriteria: unknown;
          expectedCalculations: unknown;
          expectedInsights: unknown;
          scenarioRequirements: unknown;
          dataElements: unknown;
          configId: string;
          modelId: string;
        }> = [];
        let domains: string[] = [];
        let tiers: string[] = [];

        if (isScenarioMode) {
          // Fetch full scenarios from database
          const dbRecords = await prisma.mAACExperimentScenario.findMany({
            where: {
              scenarioId: { in: validated.scenarioIds },
            },
          });

          if (dbRecords.length === 0) {
            return reply.code(400).send({
              error: 'No scenarios found',
              message: 'None of the provided scenario IDs were found in the database',
            });
          }

          scenarioRecords = dbRecords as typeof scenarioRecords;
          // Each scenario runs once per model per tool config
          totalTrials =
            scenarioRecords.length * validated.models.length * validated.toolConfigs.length;
          // Extract unique domains and tiers from scenarios
          domains = [...new Set(scenarioRecords.map((s) => s.domain))];
          tiers = [...new Set(scenarioRecords.map((s) => s.tier))];

          logger.info('experiment', `Creating experiment (scenario mode): ${validated.name}`, {
            experimentId,
            totalTrials,
            scenarioCount: scenarioRecords.length,
            domains,
            tiers,
            models: validated.models,
          });
        } else {
          // Matrix mode - existing logic
          domains = validated.domains || [];
          tiers = validated.tiers || [];
          const repetitions = validated.repetitionsPerDomainTier || 1;
          totalTrials =
            domains.length * tiers.length * repetitions * validated.models.length * validated.toolConfigs.length;

          logger.info('experiment', `Creating experiment (matrix mode): ${validated.name}`, {
            experimentId,
            totalTrials,
            domains,
            tiers,
            models: validated.models,
          });
        }

        fastify.log.info(`Creating experiment ${experimentId} with ${totalTrials} trials`);

        // Save experiment metadata to database
        await prisma.experiment.create({
          data: {
            experimentId,
            name: validated.name,
            description: validated.description || '',
            status: 'pending',
            domains: domains as Domain[],
            tiers: tiers as Tier[],
            models: validated.models,
            toolConfigs: validated.toolConfigs, // Store as JSON
            repetitionsPerDomainTier: validated.repetitionsPerDomainTier || 1,
            parallelism: validated.parallelism || 10,
            timeout: validated.timeout || 60000,
            totalTrials,
            completedTrials: 0,
            failedTrials: 0,
          },
        });

        // Update status to running when experiment starts
        await prisma.experiment.update({
          where: { experimentId },
          data: { status: 'running', startedAt: new Date() },
        });

        // Build tool configs for orchestrator
        const toolConfigs = validated.toolConfigs.map((tc) => {
          const apiConfig = tc.toolConfiguration || {};
          return {
            configId: tc.configId,
            name: tc.name,
            description: tc.description || '',
            toolConfiguration: {
              memoryAccess: apiConfig.enableMemoryStore || apiConfig.enableMemoryQuery || false,
              externalSearch: false,
              structuredReasoning: apiConfig.enableThinkTool || false,
              configId: tc.configId,
              goalEngine: apiConfig.enableGoalEngine,
              planningEngine: apiConfig.enablePlanningEngine,
              validationEngine: apiConfig.enableValidationEngine,
              clarificationEngine: apiConfig.enableClarificationEngine,
              reflectionEngine: apiConfig.enableReflectionEngine,
              evaluationEngine: apiConfig.enableEvaluationEngine,
              memoryStore: apiConfig.enableMemoryStore,
            },
            scenarioCount: 0,
          };
        });

        // Start experiment
        let result;
        if (isScenarioMode && scenarioRecords.length > 0) {
          // For scenario mode, pass full scenario data
          result = await orchestrator.runExperimentWithScenarios({
            experimentId,
            name: validated.name,
            description: validated.description || '',
            scenarios: scenarioRecords.map((s) => ({
              scenarioId: s.scenarioId,
              domain: s.domain as Domain,
              tier: s.tier as Tier,
              repetition: s.repetition,
              taskTitle: s.taskTitle,
              taskDescription: s.taskDescription,
              businessContext: s.businessContext,
              successCriteria: s.successCriteria as SuccessCriterion[],
              expectedCalculations: s.expectedCalculations as string[],
              expectedInsights: s.expectedInsights as string[],
              scenarioRequirements: s.scenarioRequirements as string[],
              dataElements: s.dataElements as string[] | undefined,
              configId: s.configId,
            })),
            models: validated.models,
            toolConfigs,
            parallelism: validated.parallelism || 10,
            timeout: validated.timeout || 60000,
          });
        } else {
          // Matrix mode - existing logic
          result = await orchestrator.runExperiment({
            experimentId,
            name: validated.name,
            description: validated.description || '',
            domains: domains as Domain[],
            tiers: tiers as Tier[],
            repetitionsPerDomainTier: validated.repetitionsPerDomainTier || 1,
            models: validated.models,
            toolConfigs,
            parallelism: validated.parallelism || 10,
            timeout: validated.timeout || 60000,
          });
        }

        return reply.code(201).send(result);
      } catch (error) {
        fastify.log.error(error);
        if (error instanceof Error) {
          return reply.code(400).send({
            error: 'Invalid experiment configuration',
            message: error.message,
          });
        }
        throw error;
      }
    },
  );

  // ==========================================================================
  // LIST EXPERIMENTS
  // ==========================================================================

  /**
   * GET /experiments
   * List experiments with optional filtering and pagination
   */
  fastify.get<{
    Querystring: {
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    };
  }>(
    '/experiments',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'running', 'completed', 'failed', 'paused'],
            },
            sortBy: {
              type: 'string',
              enum: ['createdAt', 'name', 'status', 'totalTrials'],
              default: 'createdAt',
            },
            sortOrder: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
            },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              experiments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    experimentId: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string' },
                    domains: { type: 'array', items: { type: 'string' } },
                    tiers: { type: 'array', items: { type: 'string' } },
                    models: { type: 'array', items: { type: 'string' } },
                    totalTrials: { type: 'integer' },
                    completedTrials: { type: 'integer' },
                    failedTrials: { type: 'integer' },
                    createdAt: { type: 'string', format: 'date-time' },
                    startedAt: { type: 'string', format: 'date-time' },
                    completedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              total: { type: 'integer' },
              limit: { type: 'integer' },
              offset: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        limit = 50,
        offset = 0,
      } = request.query;

      // Build where clause
      const where = status ? { status } : {};

      // Query experiments
      const [experiments, total] = await Promise.all([
        prisma.experiment.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: offset,
          select: {
            id: true,
            experimentId: true,
            name: true,
            description: true,
            status: true,
            domains: true,
            tiers: true,
            models: true,
            totalTrials: true,
            completedTrials: true,
            failedTrials: true,
            createdAt: true,
            startedAt: true,
            completedAt: true,
          },
        }),
        prisma.experiment.count({ where }),
      ]);

      return reply.send({
        experiments,
        total,
        limit,
        offset,
      });
    },
  );

  // ==========================================================================
  // GET EXPERIMENT DETAILS
  // ==========================================================================

  /**
   * GET /experiments/:id
   * Get full experiment details including metadata
   */
  fastify.get<{ Params: { id: string } }>(
    '/experiments/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const experiment = await prisma.experiment.findFirst({
        where: {
          OR: [{ experimentId: id }, { id: isNaN(Number(id)) ? -1 : Number(id) }],
        },
      });

      if (!experiment) {
        return reply.code(404).send({ error: 'Experiment not found' });
      }

      return reply.send(experiment);
    },
  );

  // ==========================================================================
  // GET EXPERIMENT STATUS
  // ==========================================================================

  /**
   * GET /experiments/:id/status
   * Get experiment progress and status
   */
  fastify.get<{ Params: { id: string } }>(
    '/experiments/:id/status',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              experimentId: { type: 'string' },
              total: { type: 'integer' },
              completed: { type: 'integer' },
              waiting: { type: 'integer' },
              active: { type: 'integer' },
              failed: { type: 'integer' },
              progress: { type: 'number' },
              estimatedTimeRemaining: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        const status = await orchestrator.getExperimentStatus(id);
        return status;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(404).send({
          error: 'Experiment not found',
          experimentId: id,
        });
      }
    },
  );

  // ==========================================================================
  // STREAM EXPERIMENT PROGRESS (SSE)
  // ==========================================================================

  /**
   * GET /experiments/:id/stream
   * Server-Sent Events stream for real-time experiment progress
   */
  fastify.get<{ Params: { id: string } }>(
    '/experiments/:id/stream',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      // Set up SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const sendEvent = (type: string, data: Record<string, unknown>) => {
        reply.raw.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
      };

      let lastCompleted = 0;
      let experimentDone = false;

      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const experiment = await prisma.experiment.findUnique({
            where: { experimentId: id },
          });

          if (!experiment) {
            sendEvent('error', { message: 'Experiment not found' });
            clearInterval(pollInterval);
            reply.raw.end();
            return;
          }

          // Send progress update if there are new completed trials
          if (experiment.completedTrials > lastCompleted) {
            sendEvent('trial_complete', {
              completedTrials: experiment.completedTrials,
              totalTrials: experiment.totalTrials,
              failedTrials: experiment.failedTrials,
            });
            lastCompleted = experiment.completedTrials;
          }

          // Check if experiment is done
          if (
            experiment.status === 'completed' ||
            experiment.status === 'failed' ||
            experiment.status === 'stopped'
          ) {
            if (!experimentDone) {
              experimentDone = true;
              if (experiment.status === 'completed') {
                sendEvent('experiment_complete', {
                  experimentId: id,
                  completedTrials: experiment.completedTrials,
                  failedTrials: experiment.failedTrials,
                });
              } else {
                sendEvent('error', {
                  message: `Experiment ${experiment.status}`,
                  status: experiment.status,
                });
              }
              clearInterval(pollInterval);
              reply.raw.end();
            }
          }
        } catch (error) {
          console.error('SSE poll error:', error);
          sendEvent('error', { message: 'Failed to fetch experiment status' });
          clearInterval(pollInterval);
          reply.raw.end();
        }
      }, 1000); // Poll every second

      // Clean up on client disconnect
      request.raw.on('close', () => {
        clearInterval(pollInterval);
      });
    },
  );

  // ==========================================================================
  // GET EXPERIMENT RESULTS
  // ==========================================================================

  /**
   * GET /experiments/:id/results
   * Get experiment results with optional filtering
   */
  fastify.get<{
    Params: { id: string };
    Querystring: {
      limit?: number;
      offset?: number;
      domain?: Domain;
      tier?: Tier;
    };
  }>(
    '/experiments/:id/results',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
            offset: { type: 'integer', minimum: 0, default: 0 },
            domain: {
              type: 'string',
              enum: ['analytical', 'planning', 'communication', 'problem_solving'],
            },
            tier: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              experimentId: { type: 'string' },
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    trialId: { type: 'string' },
                    domain: { type: 'string' },
                    tier: { type: 'string' },
                    modelId: { type: 'string' },
                    maacOverallScore: { type: 'number' },
                    maacConfidence: { type: 'number' },
                    maacCognitiveLoad: { type: 'number' },
                    maacToolExecution: { type: 'number' },
                    maacContentQuality: { type: 'number' },
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
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { limit?: number; offset?: number; domain?: Domain; tier?: Tier };
      }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const { limit = 100, offset = 0, domain, tier } = request.query;

      try {
        const results = await orchestrator.getExperimentResults(id, {
          limit,
          offset,
          domain,
          tier,
        });

        const status = await orchestrator.getExperimentStatus(id);

        return {
          experimentId: id,
          results,
          pagination: {
            limit,
            offset,
            total: status.completed,
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(404).send({
          error: 'Experiment not found',
          experimentId: id,
        });
      }
    },
  );

  // ==========================================================================
  // STOP EXPERIMENT
  // ==========================================================================

  /**
   * POST /experiments/:id/stop
   * Stop experiment execution completely
   */
  fastify.post<{ Params: { id: string } }>(
    '/experiments/:id/stop',
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
              experimentId: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        // Update experiment status to failed/stopped
        const experiment = await prisma.experiment.findFirst({
          where: {
            OR: [{ experimentId: id }, { id: isNaN(Number(id)) ? -1 : Number(id) }],
          },
        });

        if (!experiment) {
          return reply.code(404).send({ error: 'Experiment not found' });
        }

        // Update status to failed (stopping)
        await prisma.experiment.update({
          where: { id: experiment.id },
          data: { status: 'failed', completedAt: new Date() },
        });

        // Pause the orchestrator to stop new trials
        await orchestrator.pauseExperiment();

        return reply.send({
          message: 'Experiment stopped',
          experimentId: id,
          status: 'failed',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Failed to stop experiment',
          experimentId: id,
        });
      }
    },
  );

  // ==========================================================================
  // PAUSE EXPERIMENT
  // ==========================================================================

  /**
   * POST /experiments/:id/pause
   * Pause experiment execution
   */
  fastify.post<{ Params: { id: string } }>(
    '/experiments/:id/pause',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              experimentId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        // Update experiment status in database
        await prisma.experiment.updateMany({
          where: { experimentId: id },
          data: { status: 'paused' },
        });

        await orchestrator.pauseExperiment();
        return {
          message: 'Experiment paused',
          experimentId: id,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Failed to pause experiment',
          experimentId: id,
        });
      }
    },
  );

  // ==========================================================================
  // RESUME EXPERIMENT
  // ==========================================================================

  /**
   * POST /experiments/:id/resume
   * Resume experiment execution
   */
  fastify.post<{ Params: { id: string } }>(
    '/experiments/:id/resume',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              experimentId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        // Update experiment status in database
        await prisma.experiment.updateMany({
          where: { experimentId: id },
          data: { status: 'running' },
        });

        await orchestrator.resumeExperiment();
        return {
          message: 'Experiment resumed',
          experimentId: id,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Failed to resume experiment',
          experimentId: id,
        });
      }
    },
  );

  // ==========================================================================
  // SSE PROGRESS STREAMING
  // ==========================================================================

  /**
   * GET /experiments/:id/progress
   * Server-Sent Events stream for real-time experiment progress
   */
  fastify.get<{ Params: { id: string } }>(
    '/experiments/:id/progress',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      // Verify experiment exists
      const experiment = await prisma.experiment.findFirst({
        where: { experimentId: id },
      });

      if (!experiment) {
        return reply.code(404).send({ error: 'Experiment not found' });
      }

      // Set SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Send initial state
      const sendEvent = (data: object) => {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Send initial experiment state
      sendEvent({
        type: 'init',
        experimentId: id,
        status: experiment.status,
        totalTrials: experiment.totalTrials,
        completedTrials: experiment.completedTrials,
        failedTrials: experiment.failedTrials,
        progress:
          experiment.totalTrials > 0
            ? Math.round((experiment.completedTrials / experiment.totalTrials) * 100)
            : 0,
      });

      // Poll for updates every 2 seconds
      const interval = setInterval(async () => {
        try {
          const current = await prisma.experiment.findFirst({
            where: { experimentId: id },
          });

          if (!current) {
            clearInterval(interval);
            sendEvent({ type: 'error', message: 'Experiment not found' });
            reply.raw.end();
            return;
          }

          // Get recent trial results
          const recentTrials = await prisma.mAACExperimentalData.findMany({
            where: { experimentId: id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              trialId: true,
              domain: true,
              tier: true,
              modelId: true,
              maacOverallScore: true,
              processingTime: true,
              createdAt: true,
            },
          });

          sendEvent({
            type: 'progress',
            experimentId: id,
            status: current.status,
            totalTrials: current.totalTrials,
            completedTrials: current.completedTrials,
            failedTrials: current.failedTrials,
            progress:
              current.totalTrials > 0
                ? Math.round((current.completedTrials / current.totalTrials) * 100)
                : 0,
            recentTrials: recentTrials.map((t) => ({
              ...t,
              maacOverallScore: t.maacOverallScore ? Number(t.maacOverallScore) : null,
            })),
          });

          // Stop streaming if experiment is complete or failed
          if (['completed', 'failed', 'stopped'].includes(current.status)) {
            clearInterval(interval);
            sendEvent({ type: 'complete', status: current.status });
            reply.raw.end();
          }
        } catch (error) {
          fastify.log.error(error);
        }
      }, 2000);

      // Clean up on client disconnect
      request.raw.on('close', () => {
        clearInterval(interval);
      });
    },
  );

  // ==========================================================================
  // RETRY FAILED TRIALS
  // ==========================================================================

  /**
   * POST /experiments/:id/retry
   * Retry failed trials in an experiment
   */
  fastify.post<{ Params: { id: string } }>(
    '/experiments/:id/retry',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              experimentId: { type: 'string' },
              retriedTrials: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        const experiment = await prisma.experiment.findFirst({
          where: { experimentId: id },
        });

        if (!experiment) {
          return reply.code(404).send({ error: 'Experiment not found' });
        }

        // Reset failed trials count and update status
        await prisma.experiment.updateMany({
          where: { experimentId: id },
          data: {
            status: 'running',
            failedTrials: 0,
            completedAt: null,
          },
        });

        // Note: Actual retry logic would re-queue failed scenarios
        // This is a simplified version that just resets the counts
        return {
          message: 'Experiment retry initiated',
          experimentId: id,
          retriedTrials: experiment.failedTrials,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Failed to retry experiment',
          experimentId: id,
        });
      }
    },
  );

  // ==========================================================================
  // EXPORT RESULTS
  // ==========================================================================

  /**
   * GET /experiments/:id/export
   * Export experiment results to JSON or CSV
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { format?: 'json' | 'csv' };
  }>(
    '/experiments/:id/export',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['json', 'csv'], default: 'json' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { format?: 'json' | 'csv' };
      }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const format = request.query.format || 'json';

      try {
        const experiment = await prisma.experiment.findFirst({
          where: { experimentId: id },
        });

        if (!experiment) {
          return reply.code(404).send({ error: 'Experiment not found' });
        }

        // Get all trial data for this experiment
        const trials = await prisma.mAACExperimentalData.findMany({
          where: { experimentId: id },
          orderBy: { createdAt: 'asc' },
        });

        if (format === 'csv') {
          // Generate CSV
          const headers = [
            'trialId',
            'domain',
            'tier',
            'modelId',
            'configId',
            'maacOverallScore',
            'maacCognitiveLoad',
            'maacToolExecution',
            'maacContentQuality',
            'maacMemoryIntegration',
            'maacComplexityHandling',
            'maacHallucinationControl',
            'maacKnowledgeTransfer',
            'maacProcessingEfficiency',
            'maacConstructValidity',
            'processingTime',
            'wordCount',
            'createdAt',
          ];

          const rows = trials.map((t) =>
            [
              t.trialId,
              t.domain,
              t.tier,
              t.modelId,
              t.configId,
              t.maacOverallScore?.toString() || '',
              t.maacCognitiveLoad?.toString() || '',
              t.maacToolExecution?.toString() || '',
              t.maacContentQuality?.toString() || '',
              t.maacMemoryIntegration?.toString() || '',
              t.maacComplexityHandling?.toString() || '',
              t.maacHallucinationControl?.toString() || '',
              t.maacKnowledgeTransfer?.toString() || '',
              t.maacProcessingEfficiency?.toString() || '',
              t.maacConstructValidity?.toString() || '',
              t.processingTime.toString(),
              t.wordCount.toString(),
              t.createdAt.toISOString(),
            ].join(','),
          );

          const csv = [headers.join(','), ...rows].join('\n');

          reply.header('Content-Type', 'text/csv');
          reply.header('Content-Disposition', `attachment; filename="${id}-results.csv"`);
          return csv;
        }

        // JSON format
        const exportData = {
          experiment: {
            id: experiment.experimentId,
            name: experiment.name,
            description: experiment.description,
            status: experiment.status,
            domains: experiment.domains,
            tiers: experiment.tiers,
            models: experiment.models,
            totalTrials: experiment.totalTrials,
            completedTrials: experiment.completedTrials,
            failedTrials: experiment.failedTrials,
            createdAt: experiment.createdAt,
            startedAt: experiment.startedAt,
            completedAt: experiment.completedAt,
          },
          trials: trials.map((t) => ({
            trialId: t.trialId,
            domain: t.domain,
            tier: t.tier,
            modelId: t.modelId,
            configId: t.configId,
            maacScores: {
              overall: t.maacOverallScore ? Number(t.maacOverallScore) : null,
              cognitiveLoad: t.maacCognitiveLoad ? Number(t.maacCognitiveLoad) : null,
              toolExecution: t.maacToolExecution ? Number(t.maacToolExecution) : null,
              contentQuality: t.maacContentQuality ? Number(t.maacContentQuality) : null,
              memoryIntegration: t.maacMemoryIntegration ? Number(t.maacMemoryIntegration) : null,
              complexityHandling: t.maacComplexityHandling
                ? Number(t.maacComplexityHandling)
                : null,
              hallucinationControl: t.maacHallucinationControl
                ? Number(t.maacHallucinationControl)
                : null,
              knowledgeTransfer: t.maacKnowledgeTransfer ? Number(t.maacKnowledgeTransfer) : null,
              processingEfficiency: t.maacProcessingEfficiency
                ? Number(t.maacProcessingEfficiency)
                : null,
              constructValidity: t.maacConstructValidity ? Number(t.maacConstructValidity) : null,
            },
            processingTime: t.processingTime,
            wordCount: t.wordCount,
            createdAt: t.createdAt,
          })),
          summary: {
            totalTrials: trials.length,
            avgOverallScore:
              trials.length > 0
                ? trials.reduce((sum, t) => sum + (Number(t.maacOverallScore) || 0), 0) /
                  trials.length
                : null,
            avgProcessingTime:
              trials.length > 0
                ? trials.reduce((sum, t) => sum + t.processingTime, 0) / trials.length
                : null,
          },
        };

        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${id}-results.json"`);
        return exportData;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Failed to export experiment',
          experimentId: id,
        });
      }
    },
  );
}

export default experimentRoutes;
