import { ExperimentConfig } from '@maac/types';

/**
 * Experiment Orchestrator
 * Manages experiment execution, scheduling, and coordination
 *
 * Extracted from n8n workflows:
 * - MAAC - Tier 1a - Experiment Processing - Scenario Generation Only.json
 */

// Export scenario generation module
export * from './scenarios';

export interface ExperimentRun {
  id: string;
  configId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  results?: unknown;
}

export class ExperimentOrchestrator {
  private runs: Map<string, ExperimentRun> = new Map();

  async startExperiment(config: ExperimentConfig): Promise<ExperimentRun> {
    const run: ExperimentRun = {
      id: crypto.randomUUID(),
      configId: config.experimentId,
      status: 'pending',
    };

    this.runs.set(run.id, run);

    // Start execution
    run.status = 'running';
    run.startTime = new Date();

    return run;
  }

  getExperimentRun(id: string): ExperimentRun | undefined {
    return this.runs.get(id);
  }

  listExperimentRuns(): ExperimentRun[] {
    return Array.from(this.runs.values());
  }
}

export * from '@maac/types';
