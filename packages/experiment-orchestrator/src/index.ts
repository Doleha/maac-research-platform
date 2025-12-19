/**
 * Experiment Orchestrator
 * Manages experiment execution, scheduling, and coordination
 *
 * Extracted from n8n workflows:
 * - MAAC - Tier 1a - Experiment Processing - Scenario Generation Only.json
 * - MAAC - Tier 1b - Experiment Processing MIMIC Only
 */

// Export scenario generation module
export * from './scenarios';

// Export advanced orchestrator with BullMQ
export { AdvancedExperimentOrchestrator, CreateExperimentSchema } from './orchestrator';

// Export types separately
export type {
  OrchestratorConfig,
  DatabaseClient,
  MAACEvaluatorInterface,
  MAACAssessmentResult,
  RedisConfig,
  ExperimentRunResult,
  ExperimentStatus,
  CreateExperimentInput,
} from './orchestrator';

// Re-export types from @maac/types
export type {
  ExperimentConfig,
  Scenario,
  Trial,
  Domain,
  Tier,
  ModelId,
  SuccessCriterion,
  ToolConfigBlock,
} from '@maac/types';

// Legacy ExperimentOrchestrator for backward compatibility
export interface ExperimentRun {
  id: string;
  configId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  results?: unknown;
}

/**
 * @deprecated Use AdvancedExperimentOrchestrator instead
 */
export class ExperimentOrchestrator {
  private runs: Map<string, ExperimentRun> = new Map();

  async startExperiment(config: { experimentId: string }): Promise<ExperimentRun> {
    const run: ExperimentRun = {
      id: crypto.randomUUID(),
      configId: config.experimentId,
      status: 'pending',
    };

    this.runs.set(run.id, run);
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
