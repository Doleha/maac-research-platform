import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { MAACFramework, MAACEvaluator, VercelAIProvider } from '@maac/framework';
import type { ScenarioContext, MAACAssessmentResult } from '@maac/framework';
import {
  ExperimentOrchestrator,
  AdvancedExperimentOrchestrator,
} from '@maac/experiment-orchestrator';
import type { DatabaseClient, MAACEvaluatorInterface } from '@maac/experiment-orchestrator';
import { StatisticalAnalyzer } from '@maac/statistical-analysis';
import type { CognitiveSystem, CognitiveResponse, SuccessCriterion } from '@maac/types';
import { experimentRoutes } from './routes/experiments.js';
import { scenarioRoutes } from './routes/scenarios.js';
import { llmRoutes } from './routes/llm.js';
import { billingRoutes } from './routes/billing.js';
import { settingsRoutes } from './routes/settings.js';
import { logsRoutes, logger } from './routes/logs.js';

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

const config = {
  port: parseInt(process.env.API_PORT || '3000', 10),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'anthropic', // anthropic, openai, deepseek
    model: process.env.LLM_MODEL || 'claude-sonnet-4-20250514',
    apiKey: process.env.LLM_API_KEY,
  },
  parallelism: parseInt(process.env.EXPERIMENT_PARALLELISM || '10', 10),
};

// =============================================================================
// VALIDATE REQUIRED ENVIRONMENT VARIABLES
// =============================================================================

function validateEnvironment(): void {
  const required = ['DATABASE_URL', 'LLM_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please set these variables before starting the API.');
    process.exit(1);
  }
}

validateEnvironment();

// =============================================================================
// INITIALIZE SERVICES
// =============================================================================

const fastify = Fastify({
  logger: true,
});

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Initialize LLM provider using Vercel AI SDK
async function createLLMProvider(): Promise<VercelAIProvider> {
  let model: any;

  switch (config.llm.provider) {
    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const anthropic = createAnthropic({ apiKey: config.llm.apiKey });
      model = anthropic(config.llm.model);
      break;
    }
    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const openai = createOpenAI({ apiKey: config.llm.apiKey });
      model = openai(config.llm.model);
      break;
    }
    default:
      throw new Error(`Unsupported LLM provider: ${config.llm.provider}`);
  }

  return new VercelAIProvider(config.llm.model, model);
}

// Create database adapter for orchestrator
function createDatabaseAdapter(prismaClient: PrismaClient): DatabaseClient {
  return {
    mAACExperimentalData: {
      create: async (args: { data: Record<string, unknown> }) =>
        prismaClient.mAACExperimentalData.create(
          args as Parameters<typeof prismaClient.mAACExperimentalData.create>[0],
        ),
      count: async (args?: { where?: Record<string, unknown> }) =>
        prismaClient.mAACExperimentalData.count(
          args as Parameters<typeof prismaClient.mAACExperimentalData.count>[0],
        ),
      findMany: async (args?: {
        where?: Record<string, unknown>;
        select?: Record<string, boolean>;
        orderBy?: Record<string, string>;
        take?: number;
        skip?: number;
      }) =>
        prismaClient.mAACExperimentalData.findMany(
          args as Parameters<typeof prismaClient.mAACExperimentalData.findMany>[0],
        ),
      updateMany: async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) =>
        prismaClient.mAACExperimentalData.updateMany(
          args as Parameters<typeof prismaClient.mAACExperimentalData.updateMany>[0],
        ),
    },
    mAACExperimentScenario: {
      createMany: async (args: { data: Record<string, unknown>[] }) =>
        prismaClient.mAACExperimentScenario.createMany(
          args as Parameters<typeof prismaClient.mAACExperimentScenario.createMany>[0],
        ),
      count: async (args?: { where?: Record<string, unknown> }) =>
        prismaClient.mAACExperimentScenario.count(
          args as Parameters<typeof prismaClient.mAACExperimentScenario.count>[0],
        ),
      findMany: async (args?: {
        where?: Record<string, unknown>;
        select?: Record<string, boolean>;
      }) =>
        prismaClient.mAACExperimentScenario.findMany(
          args as Parameters<typeof prismaClient.mAACExperimentScenario.findMany>[0],
        ),
      findUnique: async (args: { where: Record<string, unknown> }) =>
        prismaClient.mAACExperimentScenario.findUnique(
          args as Parameters<typeof prismaClient.mAACExperimentScenario.findUnique>[0],
        ),
      update: async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) =>
        prismaClient.mAACExperimentScenario.update(
          args as Parameters<typeof prismaClient.mAACExperimentScenario.update>[0],
        ),
    },
  };
}

// Create MAAC evaluator adapter
function createMAACEvaluatorAdapter(
  evaluator: MAACEvaluator,
  defaultModel: string,
): MAACEvaluatorInterface {
  return {
    evaluate: async (
      response: CognitiveResponse,
      successCriteria: SuccessCriterion[],
      _metadata?: Record<string, unknown>,
    ): Promise<MAACAssessmentResult> => {
      const scenarioContext: ScenarioContext = {
        domain: 'analytical',
        tier: 'simple',
        configId: '000000000000',
        modelId: defaultModel as 'deepseek_v3' | 'sonnet_37' | 'gpt_4o' | 'llama_maverick',
        taskTitle: 'Experiment Trial',
        taskDescription: '',
        businessContext: '',
        successCriteria,
        expectedCalculations: [],
        expectedInsights: [],
        scenarioRequirements: [],
        enabledTools: [],
        memoryToolsEnabled: [],
      };
      return evaluator.evaluate(response, scenarioContext, response.metadata);
    },
  };
}

// =============================================================================
// MAIN STARTUP
// =============================================================================

async function main() {
  // Initialize LLM provider
  const llmProvider = await createLLMProvider();
  fastify.log.info(`LLM Provider initialized: ${config.llm.provider}/${config.llm.model}`);

  // Initialize MAAC Framework and Evaluator
  const framework = new MAACFramework(llmProvider);
  const maacEvaluator = new MAACEvaluator({
    llmProvider,
    model: config.llm.model,
    confidenceThreshold: 0.7,
    parallelAssessment: true,
    includeReasoningChains: true,
    formulaValidation: true,
    statisticalMode: true,
  });

  // Legacy orchestrator (for backward compatibility)
  const orchestrator = new ExperimentOrchestrator();
  const analyzer = new StatisticalAnalyzer();

  // Database adapter
  const database = createDatabaseAdapter(prisma);

  // MAAC evaluator adapter
  const maacEvaluatorAdapter = createMAACEvaluatorAdapter(maacEvaluator, config.llm.model);

  // CognitiveSystem must be provided externally (MIMIC is private)
  // For now, we'll create the orchestrator without it and require it to be set
  let cognitiveSystem: CognitiveSystem | null = null;

  // Function to set the cognitive system (called when MIMIC is loaded)
  const setCognitiveSystem = (system: CognitiveSystem) => {
    cognitiveSystem = system;
    fastify.log.info('Cognitive system registered');
  };

  // Expose for external registration
  (fastify as any).setCognitiveSystem = setCognitiveSystem;

  // Advanced orchestrator - requires cognitive system before use
  let advancedOrchestrator: AdvancedExperimentOrchestrator | null = null;

  const initializeOrchestrator = (): AdvancedExperimentOrchestrator => {
    if (!cognitiveSystem) {
      throw new Error('Cognitive system not registered. Call setCognitiveSystem first.');
    }
    if (!advancedOrchestrator) {
      advancedOrchestrator = new AdvancedExperimentOrchestrator({
        cognitiveSystem,
        maacEvaluator: maacEvaluatorAdapter,
        database,
        redis: config.redis,
        parallelism: config.parallelism,
        verbose: true,
      });
    }
    return advancedOrchestrator;
  };

  // =============================================================================
  // REGISTER MIDDLEWARE
  // =============================================================================

  await fastify.register(cors, {
    origin: true,
  });

  // =============================================================================
  // ROUTES
  // =============================================================================

  // Health check
  fastify.get('/health', async () => {
    const redisStatus = 'connected'; // Could add actual Redis ping
    const dbStatus = await prisma.$queryRaw`SELECT 1`
      .then(() => 'connected')
      .catch(() => 'disconnected');

    return {
      status: 'ok',
      service: 'MAAC API',
      cognitiveSystemReady: !!cognitiveSystem,
      database: dbStatus,
      redis: redisStatus,
      llm: `${config.llm.provider}/${config.llm.model}`,
    };
  });

  // =============================================================================
  // SYSTEM MONITORING ENDPOINTS
  // =============================================================================

  /**
   * GET /system/status
   * Comprehensive system status including all services
   */
  fastify.get('/system/status', async () => {
    // Database status
    const dbStatus = await prisma.$queryRaw`SELECT 1`
      .then(() => ({ status: 'connected', latency: null }))
      .catch((e: Error) => ({ status: 'error', error: e.message }));

    // Get database stats
    const dbStats = await Promise.all([
      prisma.experiment.count(),
      prisma.mAACExperimentScenario.count(),
      prisma.mAACExperimentalData.count(),
    ]).catch(() => [0, 0, 0]);

    // Memory usage
    const memUsage = process.memoryUsage();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        api: { status: 'running', version: '0.1.0' },
        database: dbStatus,
        redis: { status: 'connected', host: config.redis.host, port: config.redis.port },
        llm: {
          status: 'configured',
          provider: config.llm.provider,
          model: config.llm.model,
        },
        cognitiveSystem: {
          status: cognitiveSystem ? 'registered' : 'not-registered',
        },
      },
      database: {
        experiments: dbStats[0],
        scenarios: dbStats[1],
        trials: dbStats[2],
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        unit: 'MB',
      },
      config: {
        parallelism: config.parallelism,
        port: config.port,
      },
    };
  });

  /**
   * GET /system/metrics
   * Experiment and trial metrics
   */
  fastify.get('/system/metrics', async () => {
    const [
      totalExperiments,
      runningExperiments,
      completedExperiments,
      failedExperiments,
      totalTrials,
      completedTrials,
      avgProcessingTime,
    ] = await Promise.all([
      prisma.experiment.count(),
      prisma.experiment.count({ where: { status: 'running' } }),
      prisma.experiment.count({ where: { status: 'completed' } }),
      prisma.experiment.count({ where: { status: 'failed' } }),
      prisma.mAACExperimentalData.count(),
      prisma.mAACExperimentalData.count({ where: { maacCompleted: true } }),
      prisma.mAACExperimentalData.aggregate({
        _avg: { processingTime: true },
      }),
    ]);

    // Get recent experiment activity
    const recentExperiments = await prisma.experiment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        experimentId: true,
        name: true,
        status: true,
        completedTrials: true,
        totalTrials: true,
        createdAt: true,
      },
    });

    return {
      experiments: {
        total: totalExperiments,
        running: runningExperiments,
        completed: completedExperiments,
        failed: failedExperiments,
      },
      trials: {
        total: totalTrials,
        completed: completedTrials,
        avgProcessingTimeMs: avgProcessingTime._avg.processingTime || 0,
      },
      recent: recentExperiments,
    };
  });

  // Evaluate cognitive input
  fastify.post<{ Body: { input: string } }>('/evaluate', async (request) => {
    const { input } = request.body;
    const result = framework.evaluate(input);
    return result;
  });

  // Legacy experiment management (renamed to avoid conflict with new routes)
  fastify.get('/legacy/experiments', async () => {
    const runs = orchestrator.listExperimentRuns();
    return { experiments: runs };
  });

  fastify.get<{ Params: { id: string } }>('/legacy/experiments/:id', async (request) => {
    const { id } = request.params;
    const run = orchestrator.getExperimentRun(id);
    if (!run) {
      throw new Error('Experiment not found');
    }
    return run;
  });

  // Statistical analysis
  fastify.post<{ Body: { data: number[] } }>('/analyze', async (request) => {
    const { data } = request.body;
    const results = analyzer.analyze(data);
    return results;
  });

  // Register advanced experiment routes with lazy orchestrator initialization
  await fastify.register(async (instance) => {
    await experimentRoutes(instance, {
      orchestrator: new Proxy({} as AdvancedExperimentOrchestrator, {
        get(_target, prop) {
          const orch = initializeOrchestrator();
          const value = orch[prop as keyof AdvancedExperimentOrchestrator];
          if (typeof value === 'function') {
            return value.bind(orch);
          }
          return value;
        },
      }),
      prisma,
    });
  });

  // Register Tier 1a scenario generation routes
  await fastify.register(async (instance) => {
    await scenarioRoutes(instance, { prisma });
  });

  // Register LLM provider routes
  await fastify.register(async (instance) => {
    instance.register(llmRoutes, { prefix: '/llm' });
  });

  // Register billing & credits routes
  await fastify.register(async (instance) => {
    instance.register(billingRoutes, { prefix: '/billing' });
  });

  // Register settings routes
  await fastify.register(async (instance) => {
    await settingsRoutes(instance, { prisma });
  });

  // Register logs routes
  await fastify.register(async (instance) => {
    await logsRoutes(instance);
  });

  // =============================================================================
  // REQUEST LOGGING HOOK
  // =============================================================================

  fastify.addHook('onRequest', async (request) => {
    logger.debug('api', `${request.method} ${request.url}`, {
      ip: request.ip,
      headers: request.headers['user-agent'],
    });
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const level = reply.statusCode >= 400 ? 'error' : 'info';
    logger[level]('api', `${request.method} ${request.url} - ${reply.statusCode}`, {
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    });
  });

  // =============================================================================
  // START SERVER
  // =============================================================================

  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    logger.info('server', `MAAC API started on port ${config.port}`);
    logger.info('server', `LLM Provider: ${config.llm.provider}/${config.llm.model}`);
    logger.info('server', `Redis: ${config.redis.host}:${config.redis.port}`);
    console.log(`🚀 MAAC API running on port ${config.port}`);
    console.log(`   LLM: ${config.llm.provider}/${config.llm.model}`);
    console.log(`   Redis: ${config.redis.host}:${config.redis.port}`);
    console.log(`   Parallelism: ${config.parallelism}`);
    console.log(
      `   ⚠️  Cognitive system not registered - call /register-cognitive-system or use setCognitiveSystem()`,
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
