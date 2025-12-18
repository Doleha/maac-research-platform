import { ExperimentConfig } from '@maac/types';

/**
 * Experimental Infrastructure
 * Orchestration and monitoring for research experiments
 */

export class ExperimentOrchestrator {
  private experiments: Map<string, ExperimentConfig> = new Map();

  registerExperiment(config: ExperimentConfig): void {
    this.experiments.set(config.experimentId, config);
  }

  getExperiment(id: string): ExperimentConfig | undefined {
    return this.experiments.get(id);
  }

  listExperiments(): ExperimentConfig[] {
    return Array.from(this.experiments.values());
  }
}

export * from '@maac/types';
