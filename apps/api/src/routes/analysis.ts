/**
 * Statistical Analysis API Routes (Tier 2)
 *
 * RESTful API endpoints for MAAC Tier 2 statistical analysis:
 * - POST /analysis/:experimentId - Run Tier 2 analysis on experiment data
 * - GET /analysis/:experimentId/latest - Get latest analysis results
 * - GET /analysis/:sessionId - Get specific analysis session
 *
 * Extracted from: MAAC - Tier 2 - Dataset-Level Advanced Analysis-Python.json
 */

import type { FastifyInstance } from 'fastify';
import { StatisticalAnalysisEngine, StatisticalResults } from '@maac/statistical-analysis';
import { randomUUID } from 'crypto';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface AnalysisParams {
  experimentId: string;
}

interface SessionParams {
  sessionId: string;
}

interface AnalysisQuerystring {
  pythonEngineUrl?: string;
  llmProvider?: 'openai' | 'anthropic' | 'deepseek';
  llmModel?: string;
}

interface AnalysisResponse {
  sessionId: string;
  experimentId: string;
  results: StatisticalResults;
  storedAt: string;
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

export async function analysisRoutes(
  fastify: FastifyInstance,
  opts: {
    database: any; // Prisma client
    llmApiKey?: string;
    pythonEngineUrl?: string;
    prefix?: string;
  },
): Promise<void> {
  const { database, llmApiKey, pythonEngineUrl = 'http://localhost:8000' } = opts;

  // ==========================================================================
  // RUN TIER 2 ANALYSIS
  // ==========================================================================

  /**
   * POST /analysis/:experimentId
   * Run Tier 2 statistical analysis on experiment data
   */
  fastify.post<{
    Params: AnalysisParams;
    Querystring: AnalysisQuerystring;
    Reply: AnalysisResponse;
  }>(
    '/analysis/:experimentId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['experimentId'],
          properties: {
            experimentId: { type: 'string', minLength: 1 },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            pythonEngineUrl: { type: 'string' },
            llmProvider: { type: 'string', enum: ['openai', 'anthropic', 'deepseek'] },
            llmModel: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              experimentId: { type: 'string' },
              results: { type: 'object' },
              storedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const { experimentId } = request.params;
      const { pythonEngineUrl: overrideUrl, llmProvider, llmModel } = request.query;

      const sessionId = randomUUID();

      fastify.log.info({ experimentId, sessionId }, 'Starting Tier 2 analysis');

      // Create engine with proper config
      const engine = new StatisticalAnalysisEngine(
        {
          pythonEngineUrl: overrideUrl || pythonEngineUrl,
          llmProvider: llmProvider || 'deepseek',
          llmModel: llmModel || 'deepseek-chat',
          llmApiKey: llmApiKey || process.env.DEEPSEEK_API_KEY || '',
          enableDetailedLogging: true,
        },
        database,
      );

      // Run dataset analysis
      const results = await engine.analyzeDataset(experimentId);

      // Compute experiments analyzed count
      const experimentsAnalyzed = results.coreStatistics?.descriptiveStatistics?.meanScores
        ? Object.keys(results.coreStatistics.descriptiveStatistics.meanScores).length
        : 0;

      // Determine readiness based on actual results
      const allAgentsCompleted =
        !!results.coreStatistics &&
        !!results.advancedStatistics &&
        !!results.businessAnalysis &&
        !!results.cognitiveArchitecture &&
        !!results.experimentalDesign &&
        !!results.synthesisResults;

      // Store results in database
      await database.mAACTier2Analysis.create({
        data: {
          sessionId,
          analysisTimestamp: new Date(),
          maacFrameworkVersion: 'nine_dimensional_v1.0',
          experimentsAnalyzed,
          analysisBatchId: `batch-${experimentId}-${Date.now()}`,
          batchNumber: 1,
          batchSize: experimentsAnalyzed,

          // Statistical results (stored as JSON)
          coreStatistics: results.coreStatistics || {},
          advancedStatistics: results.advancedStatistics || {},
          businessAnalysis: results.businessAnalysis || {},
          cognitiveArchitectureAnalysis: results.cognitiveArchitecture || {},
          experimentalDesignValidation: results.experimentalDesign || {},
          synthesisResults: results.synthesisResults || {},

          // Agent completion tracking (based on actual results)
          coreStatisticalAgentCompleted: !!results.coreStatistics,
          advancedStatisticalAgentCompleted: !!results.advancedStatistics,
          businessAnalysisAgentCompleted: !!results.businessAnalysis,
          cognitiveArchitectureAgentCompleted: !!results.cognitiveArchitecture,
          experimentalDesignAgentCompleted: !!results.experimentalDesign,
          synthesisAgentCompleted: !!results.synthesisResults,

          // Publication readiness
          readyForPublication: allAgentsCompleted,
        },
      });

      fastify.log.info({ sessionId, experimentsAnalyzed }, 'Tier 2 analysis completed');

      return {
        sessionId,
        experimentId,
        results,
        storedAt: new Date().toISOString(),
      };
    },
  );

  // ==========================================================================
  // GET LATEST ANALYSIS FOR EXPERIMENT
  // ==========================================================================

  /**
   * GET /analysis/:experimentId/latest
   * Get the most recent Tier 2 analysis for an experiment
   */
  fastify.get<{ Params: AnalysisParams }>(
    '/analysis/:experimentId/latest',
    {
      schema: {
        params: {
          type: 'object',
          required: ['experimentId'],
          properties: {
            experimentId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { experimentId } = request.params;

      // Find latest analysis that matches this experiment's batch pattern
      const analysis = await database.mAACTier2Analysis.findFirst({
        where: {
          analysisBatchId: {
            contains: experimentId,
          },
        },
        orderBy: { analysisTimestamp: 'desc' },
      });

      if (!analysis) {
        return reply.status(404).send({
          error: 'Not Found',
          message: `No analysis found for experiment ${experimentId}`,
        });
      }

      return analysis;
    },
  );

  // ==========================================================================
  // GET ANALYSIS BY SESSION ID
  // ==========================================================================

  /**
   * GET /analysis/session/:sessionId
   * Get a specific Tier 2 analysis session
   */
  fastify.get<{ Params: SessionParams }>(
    '/analysis/session/:sessionId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['sessionId'],
          properties: {
            sessionId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { sessionId } = request.params;

      const analysis = await database.mAACTier2Analysis.findFirst({
        where: { sessionId },
      });

      if (!analysis) {
        return reply.status(404).send({
          error: 'Not Found',
          message: `Analysis session ${sessionId} not found`,
        });
      }

      return analysis;
    },
  );

  // ==========================================================================
  // LIST ANALYSES READY FOR PUBLICATION (TIER 3)
  // ==========================================================================

  /**
   * GET /analysis/ready-for-publication
   * List all Tier 2 analyses ready for Tier 3 publication synthesis
   */
  fastify.get(
    '/analysis/ready-for-publication',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
      },
    },
    async (request, _reply) => {
      const { limit = 20, offset = 0 } = request.query as { limit?: number; offset?: number };

      const analyses = await database.mAACTier2Analysis.findMany({
        where: { readyForPublication: true },
        orderBy: { analysisTimestamp: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          sessionId: true,
          analysisTimestamp: true,
          experimentsAnalyzed: true,
          analysisBatchId: true,
          readyForPublication: true,
        },
      });

      const total = await database.mAACTier2Analysis.count({
        where: { readyForPublication: true },
      });

      return {
        analyses,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + analyses.length < total,
        },
      };
    },
  );
}
