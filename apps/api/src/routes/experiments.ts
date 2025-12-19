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
    prefix?: string;
  },
): Promise<void> {
  const { orchestrator } = opts;

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
