/**
 * Scenario Generator
 *
 * Extracted from n8n workflow: MAAC - Tier 1a - Experiment Processing - Scenario Generation Only.json
 *
 * Nodes extracted:
 * - "Generate Indexed Experiment" - Index calculation and experiment structure
 * - "Validation Configuration" - Four-model comparison validation
 * - "Task Generator Agent" - LLM-based scenario generation
 * - "Validate Output" - Scenario validation
 *
 * This class generates experimental scenarios matching the exact n8n workflow logic:
 * - 4 domains × 3 tiers = 12 combinations
 * - 150 repetitions per combination = 1,800 total scenarios
 * - Rotated across 4 models = 7,200 total trials
 */

import { Domain, Tier, ModelId, SuccessCriterion } from '@maac/types';
import {
  GeneratedScenario,
  ScenarioGeneratorConfig,
  DomainSpecificData,
  ControlExpectations,
  MAACCognitiveRequirements,
  ScenarioMetadata,
  DomainPattern,
  EXPERIMENT_DESIGN,
  TIER_GUIDELINES,
  DOMAIN_COGNITIVE_FOCUS,
  MAAC_DIMENSIONS,
} from './types';
import { getPatternForScenario } from './domain-patterns';

/**
 * Generate a UUID v4
 * Extracted from n8n "Generate Indexed Experiment" node
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Scenario Generator Class
 *
 * Replicates the complete scenario generation pipeline from n8n Tier 1a workflow.
 */
export class ScenarioGenerator {
  private config: Required<ScenarioGeneratorConfig>;

  constructor(config?: Partial<ScenarioGeneratorConfig>) {
    // Use defaults from EXPERIMENT_DESIGN if not provided
    this.config = {
      domains: config?.domains || [...EXPERIMENT_DESIGN.domains],
      tiers: config?.tiers || [...EXPERIMENT_DESIGN.tiers],
      repetitionsPerBlock: config?.repetitionsPerBlock || EXPERIMENT_DESIGN.repetitionsPerBlock,
      models: config?.models || [...EXPERIMENT_DESIGN.validModels],
      configId: config?.configId || EXPERIMENT_DESIGN.fullToolsConfigId,
      enabledTools: config?.enabledTools || [],
    };
  }

  /**
   * Generate all experimental scenarios matching n8n workflow logic
   *
   * From n8n workflow:
   * - 4 domains × 3 tiers = 12 combinations
   * - 150 repetitions per combination = 1,800 total scenarios
   * - Rotated across 4 models = 7,200 total trials
   */
  async generateScenarios(): Promise<GeneratedScenario[]> {
    const scenarios: GeneratedScenario[] = [];
    let globalIndex = 0;

    // Iterate in same order as n8n: domain → tier → repetition → model
    for (const domain of this.config.domains) {
      for (const tier of this.config.tiers) {
        for (let rep = 0; rep < this.config.repetitionsPerBlock; rep++) {
          for (const model of this.config.models) {
            const scenario = await this.generateScenario({
              domain,
              tier,
              repetition: rep + 1, // 1-indexed in n8n
              model,
              index: globalIndex++,
            });

            scenarios.push(scenario);
          }
        }
      }
    }

    return scenarios;
  }

  /**
   * Generate a single scenario at a specific index
   * Useful for resuming from database or generating specific scenarios
   */
  async generateScenarioAtIndex(index: number): Promise<GeneratedScenario> {
    const position = this.calculatePositionFromIndex(index);
    return this.generateScenario({
      ...position,
      index,
    });
  }

  /**
   * Calculate domain/tier/repetition/model position from global index
   * Extracted from n8n "Generate Indexed Experiment" node
   */
  calculatePositionFromIndex(index: number): {
    domain: Domain;
    tier: Tier;
    repetition: number;
    model: ModelId;
  } {
    const { domains, tiers, repetitionsPerBlock, models } = this.config;

    const scenariosPerDomainTier = repetitionsPerBlock * models.length;
    const scenariosPerDomain = scenariosPerDomainTier * tiers.length;

    const domainIndex = Math.floor(index / scenariosPerDomain) % domains.length;
    const tierIndex =
      Math.floor((index % scenariosPerDomain) / scenariosPerDomainTier) % tiers.length;
    const repIndex = Math.floor((index % scenariosPerDomainTier) / models.length);
    const modelIndex = index % models.length;

    return {
      domain: domains[domainIndex],
      tier: tiers[tierIndex],
      repetition: repIndex + 1,
      model: models[modelIndex],
    };
  }

  /**
   * Generate a single scenario
   * Combines logic from multiple n8n nodes
   */
  private async generateScenario(params: {
    domain: Domain;
    tier: Tier;
    repetition: number;
    model: ModelId;
    index: number;
  }): Promise<GeneratedScenario> {
    const experimentId = generateUUID();
    const timestamp = new Date().toISOString();

    // Generate trial ID (from n8n "Generate Indexed Experiment")
    const trialId = `${params.domain}-${params.tier}-${params.model}-rep${params.repetition}`;

    // Generate task ID
    const taskId = `${params.domain}-${params.tier}-${params.model}-rep${params.repetition}`;

    // Get domain pattern for this scenario (5-pattern cycling)
    const pattern = getPatternForScenario(params.domain, 'control', params.repetition % 5);

    // Generate task description and context
    const task = this.generateTaskFromPattern(
      params.domain,
      params.tier,
      pattern,
      params.repetition,
    );

    // Generate success criteria (BLIND - not given to LLM)
    const successCriteria = this.generateSuccessCriteria(params.domain, params.tier, pattern);

    // Generate control expectations
    const controlExpectations = this.generateControlExpectations(
      params.domain,
      params.tier,
      pattern,
    );

    // Generate MAAC cognitive requirements
    const maacRequirements = this.generateMAACRequirements(params.domain, params.tier);

    // Generate domain-specific data
    const domainData = this.generateDomainSpecificData(params.domain, params.tier, pattern);

    // Generate metadata
    const metadata = this.generateMetadata({
      experimentId,
      domain: params.domain,
      tier: params.tier,
      repetition: params.repetition,
      taskId,
      timestamp,
    });

    return {
      // Core identification
      scenarioId: `${params.domain}-${params.tier}-${params.model}-rep${params.repetition}`,
      experimentId,
      trialId,
      index: params.index,

      // Context
      domain: params.domain,
      tier: params.tier,
      repetition: params.repetition,
      configId: this.config.configId,
      modelId: params.model,

      // Task definition
      taskId,
      taskTitle: task.title,
      taskDescription: task.description,
      businessContext: task.context,
      scenarioType: 'control',
      scenarioNumber: params.repetition,

      // Requirements
      requirements: task.requirements,
      successCriteria,
      complexityLevel: params.tier,
      estimatedDuration: TIER_GUIDELINES[params.tier].estimatedDuration,

      // Domain-specific data
      domainSpecificData: domainData,

      // Control expectations (BLIND)
      controlExpectations,

      // MAAC cognitive requirements
      maacCognitiveRequirements: maacRequirements,

      // Metadata
      metadata,
    };
  }

  /**
   * Generate task description from domain pattern
   */
  private generateTaskFromPattern(
    domain: Domain,
    tier: Tier,
    pattern: DomainPattern | { patternType: string; guidance: string },
    _repetition: number,
  ): {
    title: string;
    description: string;
    context: string;
    requirements: string[];
    expectedCalculations: string[];
    expectedInsights: string[];
  } {
    // Check if it's a control pattern (has 'example' field)
    if ('example' in pattern) {
      const controlPattern = pattern as DomainPattern;

      // Use pattern example as base, with tier-appropriate modifications
      const title = this.generateTitle(domain, controlPattern.patternType, tier);
      const description = this.adaptDescriptionForTier(controlPattern.example, tier);
      const context = this.generateBusinessContext(domain, tier);

      return {
        title,
        description,
        context,
        requirements: this.generateRequirements(domain, tier, controlPattern),
        expectedCalculations: [controlPattern.calculation || controlPattern.method || ''],
        expectedInsights: [controlPattern.expectedInsight],
      };
    }

    // Test pattern - generate more open-ended task
    const testPattern = pattern as { patternType: string; guidance: string };
    return {
      title: this.generateTitle(domain, testPattern.patternType, tier),
      description: testPattern.guidance,
      context: this.generateBusinessContext(domain, tier),
      requirements: this.generateGenericRequirements(domain, tier),
      expectedCalculations: [],
      expectedInsights: [],
    };
  }

  /**
   * Generate task title based on domain and pattern type
   */
  private generateTitle(domain: Domain, patternType: string, tier: Tier): string {
    const tierPrefix = {
      simple: 'Basic',
      moderate: 'Intermediate',
      complex: 'Advanced',
    };

    const domainLabel = {
      analytical: 'Analysis',
      planning: 'Planning',
      communication: 'Communication',
      problem_solving: 'Problem Solving',
    };

    // Convert pattern_type to title case
    const patternLabel = patternType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `${tierPrefix[tier]} ${domainLabel[domain]}: ${patternLabel}`;
  }

  /**
   * Adapt description complexity for tier
   */
  private adaptDescriptionForTier(baseDescription: string, _tier: Tier): string {
    // For simple tier, description is used as-is (patterns are already appropriate)
    // For moderate/complex, we could add complexity but patterns are pre-designed
    return baseDescription;
  }

  /**
   * Generate business context based on domain and tier
   */
  private generateBusinessContext(domain: Domain, tier: Tier): string {
    const contexts = {
      analytical: {
        simple:
          'Standard business analytics requiring systematic data analysis and clear reporting.',
        moderate:
          'Cross-functional business intelligence requiring integration of multiple data sources and stakeholder perspectives.',
        complex:
          'Strategic enterprise analytics with uncertainty, competitive dynamics, and long-term implications.',
      },
      planning: {
        simple:
          'Straightforward project or resource planning with defined constraints and timelines.',
        moderate:
          'Multi-stakeholder planning requiring trade-off analysis and resource optimization across competing priorities.',
        complex:
          'Strategic planning with uncertainty, multiple scenarios, and long-term organizational impact.',
      },
      communication: {
        simple:
          'Single-audience professional communication with clear objectives and standard format.',
        moderate:
          'Multi-stakeholder communication requiring audience adaptation and message coordination.',
        complex:
          'Strategic communication with cultural considerations, crisis elements, or organizational change implications.',
      },
      problem_solving: {
        simple: 'Well-defined problem with clear constraints and established solution approaches.',
        moderate: 'Multi-variable problem requiring systematic analysis and trade-off evaluation.',
        complex:
          'Ambiguous problem with uncertainty, multiple stakeholders, and novel solution requirements.',
      },
    };

    return contexts[domain][tier];
  }

  /**
   * Generate requirements based on pattern
   */
  private generateRequirements(domain: Domain, tier: Tier, pattern: DomainPattern): string[] {
    const baseRequirements = [
      `Analyze the provided ${domain} scenario data`,
      'Perform required calculations with clear methodology',
      'Provide evidence-based insights and recommendations',
      'Ensure conclusions are supported by the data',
    ];

    // Add tier-specific requirements
    const tierRequirements = {
      simple: ['Focus on core analysis with clear, direct conclusions'],
      moderate: [
        'Consider multiple perspectives and trade-offs',
        'Integrate findings across different aspects of the analysis',
      ],
      complex: [
        'Address uncertainty and risk considerations',
        'Evaluate long-term strategic implications',
        'Consider stakeholder impacts and organizational context',
      ],
    };

    // Add MAAC-specific cognitive requirements
    const cognitiveDemands = pattern.acpaCognitiveDemands.map(
      (demand: string) => `Demonstrate ${demand.replace('_', ' ')} capabilities`,
    );

    return [...baseRequirements, ...tierRequirements[tier], ...cognitiveDemands.slice(0, 2)];
  }

  /**
   * Generate generic requirements for test scenarios
   */
  private generateGenericRequirements(domain: Domain, tier: Tier): string[] {
    return [
      `Complete the ${domain} task as described`,
      'Show clear reasoning throughout the analysis',
      'Provide actionable recommendations',
      `Handle ${tier}-level complexity appropriately`,
      'Demonstrate systematic problem-solving approach',
    ];
  }

  /**
   * Generate success criteria (BLIND - not given to LLM during processing)
   */
  private generateSuccessCriteria(
    _domain: Domain,
    _tier: Tier,
    pattern: DomainPattern | { patternType: string; guidance: string },
  ): SuccessCriterion[] {
    const baseCriteria: SuccessCriterion[] = [
      {
        criterion: 'Accurate analysis of provided data',
        weight: 0.25,
        category: 'accuracy',
      },
      {
        criterion: 'Complete coverage of required elements',
        weight: 0.25,
        category: 'completeness',
      },
      {
        criterion: 'Clear and logical reasoning chain',
        weight: 0.25,
        category: 'reasoning',
      },
      {
        criterion: 'Efficient use of cognitive resources',
        weight: 0.25,
        category: 'efficiency',
      },
    ];

    // Add pattern-specific criteria if control pattern
    if ('expectedInsight' in pattern) {
      const controlPattern = pattern as DomainPattern;
      baseCriteria.push({
        criterion: `Achieves expected insight: ${controlPattern.expectedInsight.substring(0, 100)}...`,
        weight: 0.2,
        category: 'accuracy',
      });

      // Adjust weights
      baseCriteria.forEach((c) => (c.weight = c.weight * 0.8));
    }

    return baseCriteria;
  }

  /**
   * Generate control expectations (BLIND - for evaluation only)
   */
  private generateControlExpectations(
    domain: Domain,
    tier: Tier,
    pattern: DomainPattern | { patternType: string; guidance: string },
  ): ControlExpectations {
    if ('expectedInsight' in pattern) {
      const controlPattern = pattern as DomainPattern;

      return {
        expectedCalculations: {
          calculation_method: controlPattern.calculation || controlPattern.method || 'N/A',
          pattern_type: controlPattern.patternType,
        },
        expectedInsights: [controlPattern.expectedInsight],
        expectedTrends: [],
        successThresholds: {
          calculation_accuracy: '±5% for numerical results',
          reasoning_quality: 'Must demonstrate clear logical progression',
          insight_alignment: `Must align with expected insight for ${controlPattern.patternType}`,
          complexity_handling: `Must handle ${tier} complexity appropriately`,
        },
      };
    }

    // Test pattern - less specific expectations
    return {
      expectedCalculations: {},
      expectedInsights: [],
      expectedTrends: [],
      successThresholds: {
        task_completion: 'Must complete the assigned task',
        reasoning_quality: 'Must demonstrate clear reasoning',
        domain_appropriateness: `Must demonstrate ${domain} domain knowledge`,
      },
    };
  }

  /**
   * Generate MAAC cognitive requirements
   */
  private generateMAACRequirements(domain: Domain, tier: Tier): MAACCognitiveRequirements {
    const domainFocus = DOMAIN_COGNITIVE_FOCUS[domain];
    const primaryFocusSet = new Set(domainFocus.primaryFocus);

    // Get secondary dimensions (those not primary for this domain)
    const secondaryDimensions = MAAC_DIMENSIONS.filter((d) => !primaryFocusSet.has(d)).slice(0, 3);

    // Use secondaryDimensions for future extensions
    void secondaryDimensions;

    return {
      primaryDimensionsTested: [...domainFocus.primaryFocus],
      cognitiveComplexityLevel: tier,
      memoryIntegrationOpportunities: [
        `Integration of ${domain} domain knowledge across task elements`,
        'Synthesis of provided data with analytical frameworks',
        'Connection between task requirements and solution approach',
      ],
      knowledgeTransferElements: [
        `Application of ${domain} principles to scenario context`,
        'Transfer of analytical methods to specific problem',
        'Adaptation of general frameworks to task requirements',
      ],
      expectedToolUsagePatterns: [
        'Think tool for systematic problem decomposition',
        'Goal Engine for objective clarification',
        'Planning Engine for structured approach',
        'Validation Engine for accuracy verification',
      ],
    };
  }

  /**
   * Generate domain-specific data
   */
  private generateDomainSpecificData(
    domain: Domain,
    tier: Tier,
    pattern: DomainPattern | { patternType: string; guidance: string },
  ): DomainSpecificData {
    const tierCalculations = TIER_GUIDELINES[tier].calculationCount;

    if ('example' in pattern) {
      const controlPattern = pattern as DomainPattern;
      return {
        dataElements: [controlPattern.example],
        calculationsRequired: [
          controlPattern.calculation || controlPattern.method || 'Standard analysis',
        ],
        industryContext: `${domain.replace('_', ' ')} domain scenario`,
        businessFunction: controlPattern.patternType.replace(/_/g, ' '),
      };
    }

    return {
      dataElements: [],
      calculationsRequired: [
        `${tierCalculations.min}-${tierCalculations.max} calculations expected`,
      ],
      industryContext: `${domain.replace('_', ' ')} domain scenario`,
      businessFunction: 'Open-ended analysis',
    };
  }

  /**
   * Generate scenario metadata
   */
  private generateMetadata(params: {
    experimentId: string;
    domain: Domain;
    tier: Tier;
    repetition: number;
    taskId: string;
    timestamp: string;
  }): ScenarioMetadata {
    return {
      sourceAgent: 'scenario_generator',
      scenarioNumber: params.repetition,
      experimentId: params.experimentId,
      businessDomain: params.domain,
      conditionId: this.config.configId,
      taskId: params.taskId,
      timestamp: params.timestamp,
      complexityJustification: TIER_GUIDELINES[params.tier].description,
      complexityLevel: params.tier,
      maacFrameworkVersion: EXPERIMENT_DESIGN.maacFrameworkVersion,
      cognitiveAssessmentFocus: `Nine-dimensional cognitive architecture evaluation under tool configuration ${this.config.configId}`,
    };
  }

  /**
   * Validate a generated scenario (from n8n "Validate Output" node)
   */
  validateScenario(scenario: GeneratedScenario): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    const requiredFields = [
      'taskId',
      'taskTitle',
      'taskDescription',
      'businessContext',
      'complexityLevel',
      'requirements',
      'successCriteria',
      'domainSpecificData',
      'controlExpectations',
      'maacCognitiveRequirements',
    ] as const;

    for (const field of requiredFields) {
      if (!scenario[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check expected_calculations not empty
    if (Object.keys(scenario.controlExpectations.expectedCalculations).length === 0) {
      warnings.push('expected_calculations is empty - consider adding specific expectations');
    }

    // Check success_thresholds not empty
    if (Object.keys(scenario.controlExpectations.successThresholds).length === 0) {
      errors.push('CRITICAL: success_thresholds is empty - violates MAAC requirements');
    }

    // Validate MAAC cognitive requirements
    if (!scenario.maacCognitiveRequirements.primaryDimensionsTested.length) {
      errors.push('Missing MAAC primary dimensions tested');
    }

    // Check calculation count for tier
    const calcCount = Object.keys(scenario.controlExpectations.expectedCalculations).length;
    const tierGuidelines = TIER_GUIDELINES[scenario.tier];
    if (calcCount < tierGuidelines.calculationCount.min) {
      warnings.push(
        `Only ${calcCount} calculations, recommend ≥${tierGuidelines.calculationCount.min} for ${scenario.tier} tier`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get total scenario count based on current configuration
   */
  getTotalScenarioCount(): number {
    return (
      this.config.domains.length *
      this.config.tiers.length *
      this.config.repetitionsPerBlock *
      this.config.models.length
    );
  }

  /**
   * Get configuration summary
   */
  getConfigurationSummary(): {
    domains: Domain[];
    tiers: Tier[];
    repetitionsPerBlock: number;
    models: ModelId[];
    configId: string;
    totalScenarios: number;
    scenariosPerDomainTier: number;
  } {
    return {
      ...this.config,
      totalScenarios: this.getTotalScenarioCount(),
      scenariosPerDomainTier: this.config.repetitionsPerBlock * this.config.models.length,
    };
  }
}

/**
 * Create a scenario generator with default MAAC experiment configuration
 */
export function createScenarioGenerator(
  config?: Partial<ScenarioGeneratorConfig>,
): ScenarioGenerator {
  return new ScenarioGenerator(config);
}

/**
 * Create a baseline scenario generator (no tools enabled)
 */
export function createBaselineScenarioGenerator(): ScenarioGenerator {
  return new ScenarioGenerator({
    configId: EXPERIMENT_DESIGN.baselineConfigId,
    enabledTools: [],
  });
}

/**
 * Create a full-tools scenario generator (all tools enabled)
 */
export function createFullToolsScenarioGenerator(): ScenarioGenerator {
  return new ScenarioGenerator({
    configId: EXPERIMENT_DESIGN.fullToolsConfigId,
    enabledTools: [
      'goal_engine',
      'planning_engine',
      'clarification_engine',
      'validation_engine',
      'evaluation_engine',
      'reflection_engine',
      'memory_store',
      'memory_node_query',
      'memory_context_query',
      'memory_eval_query',
      'memory_refl_query',
      'think_tool',
    ],
  });
}
