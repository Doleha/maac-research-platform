import express from 'express';
import { MAACFramework } from '@maac/framework';
import { ExperimentOrchestrator } from '@maac/infrastructure';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3000;

const framework = new MAACFramework();
const orchestrator = new ExperimentOrchestrator();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MAAC API' });
});

app.post('/evaluate', (req, res) => {
  const { input } = req.body;
  const result = framework.evaluate(input);
  res.json(result);
});

app.get('/experiments', (req, res) => {
  const experiments = orchestrator.listExperiments();
  res.json(experiments);
});

app.listen(port, () => {
  console.log(`🚀 MAAC API running on port ${port}`);
});
