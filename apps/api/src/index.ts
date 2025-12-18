import Fastify from 'fastify';
import cors from '@fastify/cors';
import { MAACFramework } from '@maac/framework';
import { ExperimentOrchestrator } from '@maac/experiment-orchestrator';
import { StatisticalAnalyzer } from '@maac/statistical-analysis';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

const port = parseInt(process.env.API_PORT || '3000', 10);

// Initialize services
const framework = new MAACFramework();
const orchestrator = new ExperimentOrchestrator();
const analyzer = new StatisticalAnalyzer();

// Register CORS
await fastify.register(cors, {
  origin: true,
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', service: 'MAAC API' };
});

// Evaluate cognitive input
fastify.post<{ Body: { input: string } }>('/evaluate', async (request) => {
  const { input } = request.body;
  const result = framework.evaluate(input);
  return result;
});

// Experiment management
fastify.get('/experiments', async () => {
  const runs = orchestrator.listExperimentRuns();
  return { experiments: runs };
});

fastify.get<{ Params: { id: string } }>('/experiments/:id', async (request) => {
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

// Start server
const start = async () => {
  try {
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 MAAC API running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
