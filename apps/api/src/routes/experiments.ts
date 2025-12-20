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
import type { Domain, Tier } from '@maac/types';

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
   */
  fastify.post<{ Body: CreateExperimentInput }>(
    '/experiments',
    {
      schema: {
        body: {
          type: 'object',
          required: [
            'name',
            'domains',
            'tiers',
            'repetitionsPerDomainTier',
            'models',
            'toolConfigs',
          ],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', maxLength: 2000 },
            domains: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['analytical', 'planning', 'communication', 'problem_solving'],
              },
              minItems: 1,
            },
            tiers: {
              type: 'array',
              items: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
              minItems: 1,
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

        // Calculate total trials
        const totalTrials =
          validated.domains.length *
          validated.tiers.length *
          validated.repetitionsPerDomainTier *
          validated.models.length *
          validated.toolConfigs.length;

        fastify.log.info(`Creating experiment ${experimentId} with ${totalTrials} trials`);

        // Save experiment metadata to database
        await prisma.experiment.create({
          data: {
            experimentId,
            name: validated.name,
            description: validated.description || '',
            status: 'pending',
            domains: validated.domains,
            tiers: validated.tiers,
            models: validated.models,
            toolConfigs: validated.toolConfigs, // Store as JSON
            repetitionsPerDomainTier: validated.repetitionsPerDomainTier,
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

        // Start experiment
        const result = await orchestrator.runExperiment({
          experimentId,
          name: validated.name,
          description: validated.description || '',
          domains: validated.domains,
          tiers: validated.tiers,
          repetitionsPerDomainTier: validated.repetitionsPerDomainTier,
          models: validated.models,
          toolConfigs: validated.toolConfigs.map((tc) => {
            // Map from API schema to ToolConfiguration interface
            const apiConfig = tc.toolConfiguration || {};
            return {
              configId: tc.configId,
              name: tc.name,
              description: tc.description || '',
              toolConfiguration: {
                // Required properties
                memoryAccess: apiConfig.enableMemoryStore || apiConfig.enableMemoryQuery || false,
                externalSearch: false,
                structuredReasoning: apiConfig.enableThinkTool || false,
                configId: tc.configId,
                // Optional engine flags
                goalEngine: apiConfig.enableGoalEngine,
                planningEngine: apiConfig.enablePlanningEngine,
                validationEngine: apiConfig.enableValidationEngine,
                clarificationEngine: apiConfig.enableClarificationEngine,
                reflectionEngine: apiConfig.enableReflectionEngine,
                evaluationEngine: apiConfig.enableEvaluationEngine,
                // Memory subsystems
                memoryStore: apiConfig.enableMemoryStore,
              },
              scenarioCount: 0,
            };
          }),
          parallelism: validated.parallelism || 10,
          timeout: validated.timeout || 60000,
        });

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
      const { status, sortBy = 'createdAt', sortOrder = 'desc', limit = 50, offset = 0 } = request.query;

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
          OR: [
            { experimentId: id },
            { id: isNaN(Number(id)) ? -1 : Number(id) },
          ],
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
            OR: [
              { experimentId: id },
              { id: isNaN(Number(id)) ? -1 : Number(id) },
            ],
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
}

export default experimentRoutes;
