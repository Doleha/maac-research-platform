/**
 * Experiment Orchestrator
 *
 * Manages the full experimental pipeline:
 * 1. Generate scenarios across domains/tiers
 * 2. Queue trials for execution via BullMQ
 * 3. Execute via CognitiveSystem (MIMIC or others)
 * 4. Assess via MAAC framework
 * 5. Store results in PostgreSQL via Prisma
 *
 * This is the glue connecting MIMIC + MAAC + Database
 */

import { Queue, Worker, Job } from 'bullmq';
import { z } from 'zod';
import { EventEmitter } from 'events';
import type {
  ExperimentConfig,
  Scenario,
  Domain,
  Tier,
  ModelId,
  SuccessCriterion,
  CognitiveSystem,
  CognitiveResponse,
  ToolConfiguration,
  ToolConfigBlock,
} from '@maac/types';
import { validateScenario, type ScenarioInput } from '@maac/complexity-analyzer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Database client interface (Prisma-compatible)
 * This allows dependency injection without hard coupling to Prisma
 */
export interface DatabaseClient {
  mAACExperimentalData: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
    findMany: (args?: {
      where?: Record<string, unknown>;
      select?: Record<string, boolean>;
      orderBy?: Record<string, string>;
      take?: number;
      skip?: number;
    }) => Promise<unknown[]>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
  mAACExperimentScenario: {
    createMany: (args: { data: Record<string, unknown>[] }) => Promise<{ count: number }>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
    findMany: (args?: {
      where?: Record<string, unknown>;
      select?: Record<string, boolean>;
    }) => Promise<unknown[]>;
    findUnique: (args: { where: Record<string, unknown> }) => Promise<unknown | null>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  mAACExperiment?: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    findUnique: (args: { where: Record<string, unknown> }) => Promise<unknown | null>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
}

/**
 * MAAC Evaluator interface
 */
export interface MAACEvaluatorInterface {
  evaluate: (
    response: CognitiveResponse,
    successCriteria: SuccessCriterion[],
    metadata?: Record<string, unknown>,
  ) => Promise<MAACAssessmentResult>;
}

/**
 * MAAC Assessment Result
 */
export interface MAACAssessmentResult {
  cognitiveLoad: number;
  toolExecution: number;
  contentQuality: number;
  memoryIntegration: number;
  complexityHandling: number;
  hallucinationControl: number;
  knowledgeTransfer: number;
  processingEfficiency: number;
  constructValidity: number;
  overallScore: number;
  confidence: number;
  dimensionReasonings?: Record<string, string>;
  assessmentReasoning?: string;
}

/**
 * Redis connection configuration
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  /** The cognitive system to use for trial execution (e.g., MIMIC) */
  cognitiveSystem: CognitiveSystem;

  /** MAAC evaluator for assessing responses */
  maacEvaluator: MAACEvaluatorInterface;

  /** Database client (Prisma) */
  database: DatabaseClient;

  /** Redis connection for BullMQ */
  redis: RedisConfig;

  /** Number of concurrent trials to run (default: 10) */
  parallelism?: number;

  /** Queue name prefix (default: 'maac') */
  queuePrefix?: string;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Trial job data structure
 */
interface TrialJobData {
  experimentId: string;
  scenario: Scenario;
  toolConfig: ToolConfiguration;
  attempt?: number;
}

/**
 * Experiment run result
 */
export interface ExperimentRunResult {
  experimentId: string;
  totalTrials: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  queuedAt: Date;
}

/**
 * Experiment status
 */
export interface ExperimentStatus {
  experimentId: string;
  total: number;
  completed: number;
  waiting: number;
  active: number;
  failed: number;
  progress: number;
  estimatedTimeRemaining?: number;
}

// ============================================================================
// TASK TEMPLATES
// ============================================================================

interface TaskTemplate {
  title: string;
  description: string;
  context: string;
  successCriteria: SuccessCriterion[];
  expectedCalculations: string[];
  expectedInsights: string[];
  requirements: string[];
  dataElements: string[];
}

type TaskTemplates = {
  [D in Domain]: {
    [T in Tier]: TaskTemplate;
  };
};

const TASK_TEMPLATES: TaskTemplates = {
  analytical: {
    simple: {
      title: 'Quarterly Sales Data Analysis',
      description:
        'Analyze quarterly sales data: Q1=$2.5M, Q2=$2.8M, Q3=$3.2M, Q4=$3.5M. Calculate growth rate, identify trends, and provide recommendations.',
      context: 'Technology company quarterly review',
      successCriteria: [
        { criterion: 'Calculate correct growth rate', weight: 0.4, category: 'accuracy' },
        { criterion: 'Identify meaningful trends', weight: 0.3, category: 'completeness' },
        { criterion: 'Provide actionable recommendations', weight: 0.3, category: 'reasoning' },
      ],
      expectedCalculations: ['Growth rate', 'Average quarterly revenue', 'YoY comparison'],
      expectedInsights: ['Trend direction', 'Growth acceleration', 'Seasonal patterns'],
      requirements: ['Financial calculation', 'Trend analysis', 'Strategic thinking'],
      dataElements: ['Q1-Q4 revenue figures'],
    },
    moderate: {
      title: 'Multi-Variable Regional Performance Analysis',
      description:
        'Analyze performance across regions: North (Rev=$5M, Cost=$3M), South (Rev=$4M, Cost=$2.5M), East (Rev=$6M, Cost=$4M), West (Rev=$3M, Cost=$2M). Calculate ROI per region, rank by profitability, and recommend resource allocation.',
      context: 'Regional performance optimization for national retail chain',
      successCriteria: [
        { criterion: 'Calculate ROI for each region', weight: 0.3, category: 'accuracy' },
        { criterion: 'Correct ranking by profitability', weight: 0.3, category: 'accuracy' },
        { criterion: 'Justify resource allocation', weight: 0.4, category: 'reasoning' },
      ],
      expectedCalculations: ['ROI per region', 'Profit margins', 'Rankings'],
      expectedInsights: ['Best/worst performers', 'Allocation strategy', 'Risk factors'],
      requirements: ['Multi-dimensional analysis', 'Comparative reasoning', 'Strategic planning'],
      dataElements: ['Regional revenue data', 'Regional cost data'],
    },
    complex: {
      title: 'Integrated Business Analysis with Market Benchmarking',
      description:
        'Multi-quarter financial analysis with market context. Q1: Budget $2.5M, Actual $2.1M, Industry Growth 8%; Q2: Budget $2.8M, Actual $3.1M, Industry Growth 12%; Q3: Budget $3.2M, Actual $3.6M, Industry Growth 10%; Q4: Budget $3.5M, Actual $3.9M, Industry Growth 9%. Calculate variances, compare to industry, assess execution effectiveness, and provide strategic recommendations.',
      context: 'Executive decision-making with market benchmarking for board presentation',
      successCriteria: [
        { criterion: 'Calculate all budget variances', weight: 0.25, category: 'accuracy' },
        { criterion: 'Compare performance vs industry', weight: 0.25, category: 'completeness' },
        { criterion: 'Assess execution quality', weight: 0.25, category: 'reasoning' },
        { criterion: 'Strategic recommendations', weight: 0.25, category: 'reasoning' },
      ],
      expectedCalculations: ['Budget variances', 'Industry comparison ratios', 'Trend analysis'],
      expectedInsights: ['Execution effectiveness', 'Market position', 'Strategic adjustments'],
      requirements: ['Complex financial analysis', 'Market benchmarking', 'Strategic synthesis'],
      dataElements: ['Quarterly budgets', 'Actuals', 'Industry growth rates'],
    },
  },
  planning: {
    simple: {
      title: 'Website Redesign Project Planning',
      description:
        'Plan a website redesign project with $50K budget and 3-month timeline. Define phases, resources, and milestones.',
      context: 'Small business website refresh for e-commerce company',
      successCriteria: [
        { criterion: 'Define clear project phases', weight: 0.4, category: 'completeness' },
        { criterion: 'Resource allocation within budget', weight: 0.3, category: 'accuracy' },
        { criterion: 'Realistic timeline', weight: 0.3, category: 'reasoning' },
      ],
      expectedCalculations: ['Budget allocation', 'Timeline estimates', 'Resource hours'],
      expectedInsights: ['Critical path', 'Risk factors', 'Success metrics'],
      requirements: ['Project decomposition', 'Resource planning', 'Risk assessment'],
      dataElements: ['Budget constraint', 'Timeline constraint'],
    },
    moderate: {
      title: 'Multi-Department Product Launch Planning',
      description:
        'Plan a product launch involving Marketing ($100K budget), Engineering (3 developers for 4 months), and Sales (training 20 reps). Coordinate dependencies, identify critical path, and create launch timeline.',
      context: 'SaaS company launching new enterprise feature',
      successCriteria: [
        {
          criterion: 'Identify cross-department dependencies',
          weight: 0.3,
          category: 'completeness',
        },
        {
          criterion: 'Create realistic timeline with milestones',
          weight: 0.35,
          category: 'accuracy',
        },
        { criterion: 'Risk mitigation strategies', weight: 0.35, category: 'reasoning' },
      ],
      expectedCalculations: ['Timeline dependencies', 'Resource utilization', 'Budget breakdown'],
      expectedInsights: ['Critical path', 'Bottlenecks', 'Contingency plans'],
      requirements: ['Multi-stakeholder coordination', 'Dependency management', 'Risk planning'],
      dataElements: ['Department budgets', 'Resource constraints', 'Launch deadline'],
    },
    complex: {
      title: 'Enterprise Digital Transformation Roadmap',
      description:
        'Create 18-month digital transformation roadmap for a 500-employee company. Current state: legacy ERP, manual HR, fragmented CRM. Target: integrated cloud platform. Budget: $2M. Constraints: 0% downtime for critical systems, union workforce, regulatory compliance in finance.',
      context: 'Manufacturing company modernization initiative',
      successCriteria: [
        { criterion: 'Comprehensive phase breakdown', weight: 0.25, category: 'completeness' },
        { criterion: 'Address all constraints explicitly', weight: 0.25, category: 'accuracy' },
        { criterion: 'Change management strategy', weight: 0.25, category: 'reasoning' },
        {
          criterion: 'Measurable success criteria per phase',
          weight: 0.25,
          category: 'completeness',
        },
      ],
      expectedCalculations: [
        'Phased budget allocation',
        'Timeline with dependencies',
        'Risk scoring',
      ],
      expectedInsights: ['Change management approach', 'Technical architecture', 'Training needs'],
      requirements: [
        'Strategic planning',
        'Stakeholder analysis',
        'Technical architecture',
        'Change management',
      ],
      dataElements: ['Current systems inventory', 'Budget', 'Timeline', 'Workforce constraints'],
    },
  },
  communication: {
    simple: {
      title: 'Team Announcement Email',
      description:
        'Draft an email announcing a new remote work policy allowing 2 days work-from-home per week, starting next month.',
      context: 'HR communication to 50-person department',
      successCriteria: [
        { criterion: 'Clear policy explanation', weight: 0.4, category: 'completeness' },
        { criterion: 'Appropriate tone', weight: 0.3, category: 'reasoning' },
        { criterion: 'Actionable next steps', weight: 0.3, category: 'completeness' },
      ],
      expectedCalculations: [],
      expectedInsights: ['Key message clarity', 'Employee concerns addressed'],
      requirements: ['Professional writing', 'Clear structure', 'Empathetic tone'],
      dataElements: ['Policy details', 'Start date', 'Audience'],
    },
    moderate: {
      title: 'Stakeholder Update Presentation',
      description:
        'Create an executive summary presentation for quarterly board meeting. Include: revenue up 15% YoY, two new product launches, one delayed project, and hiring 20 new engineers.',
      context: 'Board of directors quarterly update',
      successCriteria: [
        { criterion: 'Balanced positive/negative news', weight: 0.3, category: 'completeness' },
        { criterion: 'Executive-appropriate detail level', weight: 0.35, category: 'reasoning' },
        { criterion: 'Clear recommendations/asks', weight: 0.35, category: 'completeness' },
      ],
      expectedCalculations: ['YoY metrics', 'Project status summary'],
      expectedInsights: ['Key takeaways', 'Strategic implications', 'Resource needs'],
      requirements: ['Executive communication', 'Data visualization concepts', 'Strategic framing'],
      dataElements: ['Revenue data', 'Project statuses', 'Hiring plans'],
    },
    complex: {
      title: 'Crisis Communication Plan',
      description:
        'Develop communication plan for data breach affecting 10,000 customers. Personal info (names, emails, phone numbers) exposed. No financial data compromised. Breach discovered 2 hours ago. Stakeholders: affected customers, all customers, employees, board, regulators, press.',
      context: 'Fintech startup crisis response',
      successCriteria: [
        { criterion: 'Timeline with immediate actions', weight: 0.25, category: 'accuracy' },
        { criterion: 'Stakeholder-specific messaging', weight: 0.25, category: 'completeness' },
        { criterion: 'Legal/regulatory considerations', weight: 0.25, category: 'reasoning' },
        { criterion: 'Long-term trust rebuilding', weight: 0.25, category: 'reasoning' },
      ],
      expectedCalculations: ['Timeline of actions', 'Stakeholder priority matrix'],
      expectedInsights: ['Message framing', 'Channel selection', 'Escalation criteria'],
      requirements: [
        'Crisis communication',
        'Legal awareness',
        'Multi-stakeholder management',
        'Reputation management',
      ],
      dataElements: ['Breach scope', 'Stakeholder list', 'Regulatory requirements'],
    },
  },
  problem_solving: {
    simple: {
      title: 'Meeting Room Scheduling Conflict',
      description:
        'Resolve recurring double-booking of main conference room. Current system: shared calendar. Problem: 3-4 conflicts per week causing meeting delays.',
      context: 'Small office with 30 employees and 2 meeting rooms',
      successCriteria: [
        { criterion: 'Root cause identification', weight: 0.4, category: 'reasoning' },
        { criterion: 'Practical solution', weight: 0.4, category: 'completeness' },
        { criterion: 'Implementation steps', weight: 0.2, category: 'completeness' },
      ],
      expectedCalculations: [],
      expectedInsights: ['Process gaps', 'Behavioral factors', 'Tool recommendations'],
      requirements: ['Problem analysis', 'Solution design', 'Process improvement'],
      dataElements: ['Current system', 'Conflict frequency', 'Office size'],
    },
    moderate: {
      title: 'Customer Churn Root Cause Analysis',
      description:
        'Investigate 25% increase in customer churn over last quarter. Data points: NPS dropped from 45 to 32, support tickets up 40%, recent price increase of 10%, and competitor launched similar product at lower price.',
      context: 'B2B SaaS company with 500 customers',
      successCriteria: [
        { criterion: 'Multi-factor analysis', weight: 0.3, category: 'completeness' },
        { criterion: 'Prioritized root causes', weight: 0.35, category: 'reasoning' },
        { criterion: 'Actionable retention strategies', weight: 0.35, category: 'reasoning' },
      ],
      expectedCalculations: ['Correlation analysis concepts', 'Impact prioritization'],
      expectedInsights: ['Primary drivers', 'Secondary factors', 'Quick wins vs long-term fixes'],
      requirements: ['Data interpretation', 'Multi-causal analysis', 'Strategic recommendations'],
      dataElements: [
        'Churn rate',
        'NPS scores',
        'Support metrics',
        'Pricing data',
        'Competitive info',
      ],
    },
    complex: {
      title: 'Supply Chain Resilience Redesign',
      description:
        'Redesign supply chain strategy after disruption exposed vulnerabilities. Current state: 80% components from single region, 2-week inventory buffer, 4 critical single-source suppliers. Recent event: 6-week supply disruption caused $5M revenue loss. Constraints: Cannot increase COGS by more than 8%, must maintain current delivery times.',
      context: 'Electronics manufacturer serving enterprise clients',
      successCriteria: [
        { criterion: 'Comprehensive risk assessment', weight: 0.25, category: 'completeness' },
        { criterion: 'Multi-scenario modeling approach', weight: 0.25, category: 'reasoning' },
        { criterion: 'Cost-benefit analysis', weight: 0.25, category: 'accuracy' },
        { criterion: 'Phased implementation plan', weight: 0.25, category: 'completeness' },
      ],
      expectedCalculations: ['Risk scoring', 'Cost impact', 'ROI of changes'],
      expectedInsights: [
        'Diversification strategy',
        'Buffer optimization',
        'Supplier relationships',
      ],
      requirements: [
        'Systems thinking',
        'Risk management',
        'Financial modeling',
        'Strategic planning',
      ],
      dataElements: ['Current supply chain map', 'Cost constraints', 'Historical disruption data'],
    },
  },
};

// ============================================================================
// MAIN ORCHESTRATOR CLASS
// ============================================================================

/**
 * Experiment Orchestrator
 *
 * Manages the complete experimental pipeline:
 * 1. Generate scenarios (4 domains × 3 tiers × N repetitions)
 * 2. Validate scenarios with complexity analysis (NEW)
 * 3. Queue trials for execution via BullMQ
 * 4. Execute via CognitiveSystem (MIMIC)
 * 5. Assess via MAAC framework
 * 6. Store results in PostgreSQL
 */
export class AdvancedExperimentOrchestrator extends EventEmitter {
  private trialQueue: Queue<TrialJobData>;
  private trialWorker: Worker<TrialJobData>;
  private readonly config: Required<OrchestratorConfig>;
  private _isRunning = false;

  /** Whether the orchestrator is currently running */
  get isRunning(): boolean {
    return this._isRunning;
  }

  constructor(config: OrchestratorConfig) {
    super(); // Initialize EventEmitter

    this.config = {
      cognitiveSystem: config.cognitiveSystem,
      maacEvaluator: config.maacEvaluator,
      database: config.database,
      redis: config.redis,
      parallelism: config.parallelism ?? 10,
      queuePrefix: config.queuePrefix ?? 'maac',
      verbose: config.verbose ?? false,
    };

    // Initialize BullMQ Queue
    this.trialQueue = new Queue<TrialJobData>(`${this.config.queuePrefix}-trials`, {
      connection: this.config.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          count: 5000, // Keep last 5000 failed jobs for debugging
        },
      },
    });

    // Initialize Worker
    this.trialWorker = new Worker<TrialJobData>(
      `${this.config.queuePrefix}-trials`,
      async (job: Job<TrialJobData>) => this.executeTrial(job),
      {
        connection: this.config.redis,
        concurrency: this.config.parallelism,
        limiter: {
          max: this.config.parallelism,
          duration: 1000, // Max N jobs per second
        },
      },
    );

    this.setupWorkerHandlers();
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Run a complete experiment
   */
  async runExperiment(experimentConfig: ExperimentConfig): Promise<ExperimentRunResult> {
    this.log(`Starting experiment: ${experimentConfig.name}`);
    this._isRunning = true;

    try {
      // Generate all scenarios
      const scenarios = await this.generateScenarios(experimentConfig);
      this.log(`Generated ${scenarios.length} scenarios`);

      // Store scenarios in database
      await this.storeScenarios(scenarios);
      this.log(`Stored ${scenarios.length} scenarios in database`);

      // Queue all trials
      const jobs = await this.queueTrials(experimentConfig, scenarios);
      this.log(`Queued ${jobs.length} trials`);

      return {
        experimentId: experimentConfig.experimentId,
        totalTrials: scenarios.length,
        status: 'queued',
        queuedAt: new Date(),
      };
    } catch (error) {
      this._isRunning = false;
      throw error;
    }
  }

  /**
   * Run experiment with pre-generated scenarios from the database
   * This method uses existing MAACExperimentScenario records instead of generating new ones
   */
  async runExperimentWithScenarios(config: {
    experimentId: string;
    name: string;
    description: string;
    scenarios: Array<{
      scenarioId: string;
      domain: Domain;
      tier: Tier;
      repetition?: number;
      taskTitle: string;
      taskDescription: string;
      businessContext: string;
      successCriteria: SuccessCriterion[];
      expectedCalculations?: string[];
      expectedInsights?: string[];
      scenarioRequirements?: string[];
      dataElements?: string[];
      configId: string;
      modelId?: ModelId;
    }>;
    models: ModelId[];
    toolConfigs: ToolConfigBlock[];
    parallelism?: number;
    timeout?: number;
  }): Promise<ExperimentRunResult> {
    this.log(`Starting experiment with pre-generated scenarios: ${config.name}`);
    this._isRunning = true;

    try {
      // Expand scenarios across all models and tool configs
      // Each scenario runs once per model per toolConfig
      const scenarios: Scenario[] = [];
      let scenarioIndex = 0;

      for (const inputScenario of config.scenarios) {
        for (const modelId of config.models) {
          for (const toolConfig of config.toolConfigs) {
            scenarios.push({
              scenarioId: `${inputScenario.scenarioId}-${modelId}-${toolConfig.configId.slice(0, 6)}-${scenarioIndex}`,
              experimentId: config.experimentId,
              domain: inputScenario.domain,
              tier: inputScenario.tier,
              repetition: inputScenario.repetition ?? 0,
              taskTitle: inputScenario.taskTitle,
              taskDescription: inputScenario.taskDescription,
              businessContext: inputScenario.businessContext,
              successCriteria: inputScenario.successCriteria,
              expectedCalculations: inputScenario.expectedCalculations ?? [],
              expectedInsights: inputScenario.expectedInsights ?? [],
              scenarioRequirements: inputScenario.scenarioRequirements ?? [],
              dataElements: inputScenario.dataElements,
              configId: toolConfig.configId,
              modelId: modelId,
            });
            scenarioIndex++;
          }
        }
      }

      this.log(`Expanded ${config.scenarios.length} input scenarios to ${scenarios.length} trials`);

      // Store expanded scenarios in database
      await this.storeScenarios(scenarios);
      this.log(`Stored ${scenarios.length} scenarios in database`);

      // Queue all trials
      const experimentConfig: ExperimentConfig = {
        experimentId: config.experimentId,
        name: config.name,
        description: config.description,
        domains: [...new Set(scenarios.map((s) => s.domain))],
        tiers: [...new Set(scenarios.map((s) => s.tier))],
        repetitionsPerDomainTier: 1,
        models: config.models,
        toolConfigs: config.toolConfigs,
        parallelism: config.parallelism || 10,
        timeout: config.timeout || 60000,
      };

      const jobs = await this.queueTrials(experimentConfig, scenarios);
      this.log(`Queued ${jobs.length} trials`);

      return {
        experimentId: config.experimentId,
        totalTrials: scenarios.length,
        status: 'queued',
        queuedAt: new Date(),
      };
    } catch (error) {
      this._isRunning = false;
      throw error;
    }
  }

  /**
   * Get experiment status
   */
  async getExperimentStatus(experimentId: string): Promise<ExperimentStatus> {
    const total = await this.config.database.mAACExperimentScenario.count({
      where: { experimentId },
    });

    const completed = await this.config.database.mAACExperimentalData.count({
      where: { experimentId, maacCompleted: true },
    });

    const waiting = await this.trialQueue.getWaitingCount();
    const active = await this.trialQueue.getActiveCount();
    const failed = await this.trialQueue.getFailedCount();

    const progress = total > 0 ? (completed / total) * 100 : 0;

    return {
      experimentId,
      total,
      completed,
      waiting,
      active,
      failed,
      progress,
    };
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(
    experimentId: string,
    options?: {
      limit?: number;
      offset?: number;
      domain?: Domain;
      tier?: Tier;
    },
  ): Promise<unknown[]> {
    const where: Record<string, unknown> = {
      experimentId,
      maacCompleted: true,
    };

    if (options?.domain) where.domain = options.domain;
    if (options?.tier) where.tier = options.tier;

    return this.config.database.mAACExperimentalData.findMany({
      where,
      take: options?.limit ?? 100,
      skip: options?.offset ?? 0,
    });
  }

  /**
   * Pause experiment execution
   */
  async pauseExperiment(): Promise<void> {
    await this.trialWorker.pause();
    this._isRunning = false;
    this.log('Experiment execution paused');
  }

  /**
   * Resume experiment execution
   */
  async resumeExperiment(): Promise<void> {
    await this.trialWorker.resume();
    this._isRunning = true;
    this.log('Experiment execution resumed');
  }

  /**
   * Close orchestrator (cleanup)
   */
  async close(): Promise<void> {
    this.log('Closing orchestrator...');
    await this.trialWorker.close();
    await this.trialQueue.close();
    this._isRunning = false;
    this.log('Orchestrator closed');
  }

  // ==========================================================================
  // SCENARIO GENERATION
  // ==========================================================================

  /**
   * Generate all scenarios for an experiment
   */
  private async generateScenarios(config: ExperimentConfig): Promise<Scenario[]> {
    const scenarios: Scenario[] = [];
    let scenarioIndex = 0;

    // Iterate: domain → tier → repetition → model → toolConfig
    for (const domain of config.domains) {
      for (const tier of config.tiers) {
        for (let rep = 0; rep < config.repetitionsPerDomainTier; rep++) {
          for (const modelId of config.models) {
            for (const toolConfig of config.toolConfigs) {
              const scenario = this.generateScenario({
                experimentId: config.experimentId,
                scenarioIndex: scenarioIndex++,
                domain,
                tier,
                repetition: rep,
                modelId,
                configId: toolConfig.configId,
              });

              scenarios.push(scenario);
            }
          }
        }
      }
    }

    return scenarios;
  }

  /**
   * Generate a single scenario
   */
  private generateScenario(params: {
    experimentId: string;
    scenarioIndex: number;
    domain: Domain;
    tier: Tier;
    repetition: number;
    modelId: ModelId;
    configId: string;
  }): Scenario {
    const template = TASK_TEMPLATES[params.domain][params.tier];

    // Generate unique scenario ID
    const scenarioId = [
      params.domain,
      params.tier,
      params.repetition.toString().padStart(3, '0'),
      params.modelId,
      params.configId.slice(0, 6),
    ].join('-');

    // Vary task description slightly for each repetition to avoid memorization
    const variedDescription = this.varyTaskDescription(
      template.description,
      params.domain,
      params.tier,
      params.repetition,
    );

    return {
      scenarioId,
      experimentId: params.experimentId,
      domain: params.domain,
      tier: params.tier,
      repetition: params.repetition,
      taskTitle: `${template.title} (Rep ${params.repetition + 1})`,
      taskDescription: variedDescription,
      businessContext: template.context,
      successCriteria: template.successCriteria,
      expectedCalculations: template.expectedCalculations,
      expectedInsights: template.expectedInsights,
      scenarioRequirements: template.requirements,
      dataElements: template.dataElements,
      configId: params.configId,
      modelId: params.modelId,
    };
  }

  /**
   * Vary task description for each repetition
   * This prevents LLM memorization and ensures unique trials
   */
  private varyTaskDescription(
    baseDescription: string,
    _domain: Domain,
    _tier: Tier,
    repetition: number,
  ): string {
    // Simple variation: adjust numeric values by a factor based on repetition
    const factor = 1 + (repetition % 10) * 0.1; // 1.0, 1.1, 1.2, ..., 1.9

    // Replace dollar amounts with varied values
    return baseDescription.replace(/\$(\d+(?:\.\d+)?)(M|K)?/g, (_match, num, suffix) => {
      const varied = (parseFloat(num) * factor).toFixed(1);
      return `$${varied}${suffix || ''}`;
    });
  }

  // ==========================================================================
  // TRIAL QUEUING
  // ==========================================================================

  /**
   * Queue all trials for execution
   */
  private async queueTrials(
    config: ExperimentConfig,
    scenarios: Scenario[],
  ): Promise<Job<TrialJobData>[]> {
    const jobs: Job<TrialJobData>[] = [];

    for (const scenario of scenarios) {
      // Find matching tool config
      const toolConfig = config.toolConfigs.find((tc) => tc.configId === scenario.configId);

      const job = await this.trialQueue.add(
        'execute-trial',
        {
          experimentId: config.experimentId,
          scenario,
          toolConfig: toolConfig?.toolConfiguration || {
            memoryAccess: false,
            externalSearch: false,
            structuredReasoning: false,
            configId: scenario.configId,
          },
        },
        {
          jobId: scenario.scenarioId,
          priority: this.getTrialPriority(scenario.tier),
        },
      );

      jobs.push(job);
    }

    return jobs;
  }

  /**
   * Get trial priority based on tier
   * Lower number = higher priority
   */
  private getTrialPriority(tier: Tier): number {
    switch (tier) {
      case 'simple':
        return 1;
      case 'moderate':
        return 2;
      case 'complex':
        return 3;
      default:
        return 2;
    }
  }

  // ==========================================================================
  // TRIAL EXECUTION
  // ==========================================================================

  /**
   * Execute a single trial (worker job handler)
   */
  private async executeTrial(job: Job<TrialJobData>): Promise<void> {
    const { scenario, toolConfig } = job.data;
    const startTime = Date.now();

    this.log(`[Trial ${scenario.scenarioId}] Starting execution`);

    try {
      // Phase 1: Execute via cognitive system
      job.updateProgress(10);
      const cognitiveResponse = await this.config.cognitiveSystem.execute(
        scenario.taskDescription,
        {
          configId: scenario.configId,
          memoryAccess: toolConfig.memoryAccess || toolConfig.memoryStore || false,
          externalSearch: toolConfig.externalSearch || false,
          structuredReasoning: toolConfig.structuredReasoning || scenario.tier === 'complex',
        },
      );

      this.log(`[Trial ${scenario.scenarioId}] Cognitive execution complete`);
      job.updateProgress(50);

      // Phase 2: Assess via MAAC
      const maacAssessment = await this.config.maacEvaluator.evaluate(
        cognitiveResponse,
        scenario.successCriteria,
        cognitiveResponse.metadata as unknown as Record<string, unknown>,
      );

      this.log(`[Trial ${scenario.scenarioId}] MAAC assessment complete`);
      job.updateProgress(80);

      // Phase 3: Store in database
      await this.storeTrial({
        experimentId: job.data.experimentId,
        scenario,
        toolConfig,
        cognitiveResponse,
        maacAssessment,
        processingTime: Date.now() - startTime,
      });

      this.log(`[Trial ${scenario.scenarioId}] Stored in database`);
      job.updateProgress(100);

      // Mark scenario as completed
      await this.config.database.mAACExperimentScenario.update({
        where: { scenarioId: scenario.scenarioId },
        data: { completed: true },
      });
    } catch (error) {
      this.log(`[Trial ${scenario.scenarioId}] Failed: ${error}`, 'error');
      throw error; // BullMQ will retry based on job options
    }
  }

  // ==========================================================================
  // DATABASE OPERATIONS
  // ==========================================================================

  /**
   * Store scenarios in database with complexity validation
   * CRITICAL: All scenarios MUST pass complexity validation before storage
   */
  private async storeScenarios(scenarios: Scenario[]): Promise<void> {
    this.log(`Validating ${scenarios.length} scenarios before database storage...`);
    this.emit('validation:started', { total: scenarios.length });

    // Validate all scenarios with complexity analysis (parallel for performance)
    const validatedScenarios = await Promise.all(
      scenarios.map(async (scenario, index) => {
        // Map Scenario to ScenarioInput for validation
        const scenarioInput: ScenarioInput = {
          id: scenario.scenarioId,
          intendedTier: scenario.tier,
          content: `${scenario.taskTitle}\n\n${scenario.taskDescription}\n\nContext: ${scenario.businessContext}`,
          calculationSteps: scenario.expectedCalculations,
          domain: scenario.domain,
        };

        const validation = await validateScenario(scenarioInput);

        this.emit('validation:progress', {
          current: index + 1,
          total: scenarios.length,
          scenarioId: scenario.scenarioId,
          isValid: validation.isValid,
          complexityScore: validation.complexityScore.overallScore,
        });

        if (!validation.isValid) {
          this.emit('validation:failed', {
            scenarioId: scenario.scenarioId,
            rejectionReasons: validation.complexityScore.rejectionReasons,
          });

          throw new Error(
            `Scenario ${scenario.scenarioId} failed complexity validation: ${validation.complexityScore.rejectionReasons.join(', ')}`,
          );
        }

        return {
          scenario,
          complexityMetrics: validation.complexityScore!,
        };
      }),
    );

    this.log(`All ${validatedScenarios.length} scenarios passed complexity validation`);
    this.emit('validation:completed', { total: validatedScenarios.length });

    // Batch insert scenarios with complexity metrics
    await this.config.database.mAACExperimentScenario.createMany({
      data: validatedScenarios.map(({ scenario: s, complexityMetrics }) => ({
        experimentId: s.experimentId,
        scenarioId: s.scenarioId,
        domain: s.domain,
        tier: s.tier,
        repetition: s.repetition,
        configId: s.configId,
        modelId: s.modelId,
        taskTitle: s.taskTitle,
        taskDescription: s.taskDescription,
        businessContext: s.businessContext,
        successCriteria: s.successCriteria,
        expectedCalculations: s.expectedCalculations,
        expectedInsights: s.expectedInsights,
        scenarioRequirements: s.scenarioRequirements,
        dataElements: s.dataElements || [],
        completed: false,
        // Complexity validation metrics
        complexityScore: complexityMetrics.overallScore,
        woodMetrics: complexityMetrics.woodMetrics as any,
        campbellAttributes: complexityMetrics.campbellAttributes as any,
        liuLiDimensions: complexityMetrics.liuLiDimensions as any,
        validatedAt: new Date(),
        validationPassed: true,
      })),
    });

    this.log(`Stored ${validatedScenarios.length} validated scenarios in database`);
  }

  /**
   * Store trial results in database
   */
  private async storeTrial(data: {
    experimentId: string;
    scenario: Scenario;
    toolConfig: ToolConfiguration;
    cognitiveResponse: CognitiveResponse;
    maacAssessment: MAACAssessmentResult;
    processingTime: number;
  }): Promise<void> {
    const { scenario, toolConfig, cognitiveResponse, maacAssessment, processingTime } = data;

    const metadata = cognitiveResponse.metadata || {};

    await this.config.database.mAACExperimentalData.create({
      data: {
        experimentId: data.experimentId,
        sessionId: (metadata.sessionId as string) || crypto.randomUUID(),
        trialId: scenario.scenarioId,
        configId: scenario.configId,
        domain: scenario.domain,
        tier: scenario.tier,
        repetition: scenario.repetition,
        modelId: scenario.modelId,

        // Tool configuration
        enabledTools: (metadata.toolsInvoked as string[]) || [],
        toolCount: (metadata.toolsInvokedCount as number) || 0,
        goalEngineEnabled: toolConfig.goalEngine ?? false,
        planningEngineEnabled: toolConfig.planningEngine ?? false,
        clarificationEngineEnabled: toolConfig.clarificationEngine ?? false,
        validationEngineEnabled: toolConfig.validationEngine ?? false,
        evaluationEngineEnabled: toolConfig.evaluationEngine ?? false,
        reflectionEngineEnabled: toolConfig.reflectionEngine ?? false,
        memoryStoreEnabled: toolConfig.memoryStore ?? false,
        memoryNodeQueryEnabled: toolConfig.memoryAccess ?? false,
        memoryContextQueryEnabled: toolConfig.contextMemory ?? false,
        memoryEvalQueryEnabled: toolConfig.evaluationMemory ?? false,
        memoryReflQueryEnabled: toolConfig.reflectionMemory ?? false,
        thinkToolEnabled: toolConfig.structuredReasoning ?? false,

        // Response data
        mimicResponseText: cognitiveResponse.content,
        wordCount: (metadata.wordCount as number) || cognitiveResponse.content.split(/\s+/).length,
        processingMetadata: metadata,
        cognitiveCyclesCount: (metadata.cognitiveCyclesCount as number) || 1,
        memoryOperationsCount: (metadata.memoryOperationsCount as number) || 0,
        toolsInvokedCount: (metadata.toolsInvokedCount as number) || 0,
        processingMethod: (metadata.processingMethod as string) || 'standard',
        complexityAssessment: (metadata.complexityAssessment as string) || scenario.tier,
        processingTime,

        // MAAC scores
        maacCognitiveLoad: maacAssessment.cognitiveLoad,
        maacToolExecution: maacAssessment.toolExecution,
        maacContentQuality: maacAssessment.contentQuality,
        maacMemoryIntegration: maacAssessment.memoryIntegration,
        maacComplexityHandling: maacAssessment.complexityHandling,
        maacHallucinationControl: maacAssessment.hallucinationControl,
        maacKnowledgeTransfer: maacAssessment.knowledgeTransfer,
        maacProcessingEfficiency: maacAssessment.processingEfficiency,
        maacConstructValidity: maacAssessment.constructValidity,
        maacOverallScore: maacAssessment.overallScore,
        maacConfidence: maacAssessment.confidence,

        maacCompleted: true,
        mimicStartedAt: new Date(Date.now() - processingTime),
        mimicCompletedAt: new Date(),
      },
    });
  }

  // ==========================================================================
  // WORKER HANDLERS
  // ==========================================================================

  /**
   * Setup worker event handlers
   */
  private setupWorkerHandlers(): void {
    this.trialWorker.on('completed', (job) => {
      this.log(`[Worker] Job ${job.id} completed`);
    });

    this.trialWorker.on('failed', (job, error) => {
      this.log(`[Worker] Job ${job?.id} failed: ${error.message}`, 'error');
    });

    this.trialWorker.on('progress', (job, progress) => {
      if (this.config.verbose) {
        this.log(`[Worker] Job ${job.id} progress: ${progress}%`);
      }
    });

    this.trialWorker.on('error', (error) => {
      this.log(`[Worker] Error: ${error.message}`, 'error');
    });

    this.trialWorker.on('stalled', (jobId) => {
      this.log(`[Worker] Job ${jobId} stalled`, 'warn');
    });
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Log message if verbose mode is enabled
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[Orchestrator ${timestamp}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      default:
        if (this.config.verbose) {
          console.log(`${prefix} ${message}`);
        }
        break;
    }
  }
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Create Experiment Schema supports two modes:
 * 1. scenarioIds mode: Use existing MAACExperimentScenario records
 * 2. matrix mode: Generate trials from domain/tier combinations
 */
export const CreateExperimentSchema = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().max(2000).optional(),
    // Mode 1: Use pre-generated scenarios
    scenarioIds: z.array(z.string().uuid()).optional(),
    // Mode 2: Domain/Tier matrix
    domains: z
      .array(z.enum(['analytical', 'planning', 'communication', 'problem_solving']))
      .optional(),
    tiers: z.array(z.enum(['simple', 'moderate', 'complex'])).optional(),
    repetitionsPerDomainTier: z.number().int().min(1).max(200).optional(),
    // Common fields
    models: z.array(z.enum(['deepseek_v3', 'sonnet_37', 'gpt_4o', 'llama_maverick'])).min(1),
    toolConfigs: z
      .array(
        z.object({
          configId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          toolConfiguration: z.object({
            enableGoalEngine: z.boolean().optional(),
            enablePlanningEngine: z.boolean().optional(),
            enableClarificationEngine: z.boolean().optional(),
            enableValidationEngine: z.boolean().optional(),
            enableEvaluationEngine: z.boolean().optional(),
            enableReflectionEngine: z.boolean().optional(),
            enableMemoryStore: z.boolean().optional(),
            enableMemoryQuery: z.boolean().optional(),
            enableThinkTool: z.boolean().optional(),
          }),
        }),
      )
      .min(1),
    parallelism: z.number().int().min(1).max(100).optional(),
    timeout: z.number().int().min(1000).optional(),
  })
  .refine(
    (data) => {
      // Either scenarioIds OR (domains AND tiers) must be provided
      const hasScenarios = data.scenarioIds && data.scenarioIds.length > 0;
      const hasMatrix =
        data.domains && data.domains.length > 0 && data.tiers && data.tiers.length > 0;
      return hasScenarios || hasMatrix;
    },
    {
      message: 'Either scenarioIds or both domains and tiers must be provided',
    },
  );

export type CreateExperimentInput = z.infer<typeof CreateExperimentSchema>;
