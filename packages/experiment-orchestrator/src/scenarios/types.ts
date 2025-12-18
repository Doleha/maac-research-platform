/**
 * Scenario Generation Types
 * Extracted from n8n workflow: MAAC - Tier 1a - Experiment Processing - Scenario Generation Only.json
 */

import { Domain, Tier, ModelId, SuccessCriterion } from '@maac/types';

// ============================================================
// SCENARIO CONFIGURATION
// ============================================================

export interface ScenarioGeneratorConfig {
  domains: Domain[];
  tiers: Tier[];
  repetitionsPerBlock: number;
  models: ModelId[];
  configId?: string;
  enabledTools?: string[];
}

// ============================================================
// SCENARIO STRUCTURE (Matches n8n output schema)
// ============================================================

export interface GeneratedScenario {
  // Core identification
  scenarioId: string;
  experimentId: string;
  trialId: string;
  index: number;

  // Context
  domain: Domain;
  tier: Tier;
  repetition: number;
  configId: string;
  modelId: ModelId;

  // Task definition (from Task Generator Agent)
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  businessContext: string;
  scenarioType: 'control' | 'test';
  scenarioNumber: number;

  // Requirements
  requirements: string[];
  successCriteria: SuccessCriterion[];
  complexityLevel: Tier;
  estimatedDuration: string;

  // Domain-specific data (embedded in scenario)
  domainSpecificData: DomainSpecificData;

  // Control expectations (BLIND - not given to LLM during processing)
  controlExpectations: ControlExpectations;

  // MAAC cognitive requirements
  maacCognitiveRequirements: MAACCognitiveRequirements;

  // Metadata
  metadata: ScenarioMetadata;
}

export interface DomainSpecificData {
  dataElements: string[];
  calculationsRequired: string[];
  industryContext: string;
  businessFunction: string;
}

export interface ControlExpectations {
  expectedCalculations: Record<string, string | number>;
  expectedInsights: string[];
  expectedTrends: string[];
  successThresholds: Record<string, string>;
}

export interface MAACCognitiveRequirements {
  primaryDimensionsTested: string[];
  cognitiveComplexityLevel: Tier;
  memoryIntegrationOpportunities: string[];
  knowledgeTransferElements: string[];
  expectedToolUsagePatterns: string[];
}

export interface ScenarioMetadata {
  sourceAgent: string;
  scenarioNumber: number;
  experimentId: string;
  businessDomain: Domain;
  conditionId: string;
  taskId: string;
  timestamp: string;
  complexityJustification: string;
  complexityLevel: Tier;
  maacFrameworkVersion: string;
  cognitiveAssessmentFocus: string;
}

// ============================================================
// DOMAIN PATTERN TYPES (from Domain Pattern Examples tool)
// ============================================================

export interface DomainPattern {
  patternType: string;
  example: string;
  expectedInsight: string;
  calculation?: string;
  guideline?: string;
  method?: string;
  embeddedData: boolean;
  acpaCognitiveDemands: string[];
  memoryIntegrationOpportunity: string;
}

export interface DomainPatternSet {
  controlPatterns: DomainPattern[];
  testPatterns: string[];
}

export interface AllDomainPatterns {
  analytical: DomainPatternSet;
  planning: DomainPatternSet;
  communication: DomainPatternSet;
  problem_solving: DomainPatternSet;
}

// ============================================================
// EXPERIMENT DESIGN CONSTANTS (from n8n workflow)
// ============================================================

export const EXPERIMENT_DESIGN = {
  // From "Generate Indexed Experiment" node
  domains: ['analytical', 'planning', 'communication', 'problem_solving'] as Domain[],
  tiers: ['simple', 'moderate', 'complex'] as Tier[],
  repetitionsPerBlock: 150,

  // Calculated totals
  get scenariosPerDomainTier() {
    return this.repetitionsPerBlock;
  },
  get totalScenarios() {
    return this.domains.length * this.tiers.length * this.repetitionsPerBlock; // 4 × 3 × 150 = 1800
  },
  get totalTrialsWithModels() {
    return this.totalScenarios * 4; // 1800 × 4 models = 7200
  },

  // Tool configurations
  baselineConfigId: '000000000000',
  fullToolsConfigId: '111111111111',

  // MAAC Framework version
  maacFrameworkVersion: 'nine_dimensional_v1.0',

  // Valid models for comparison study
  validModels: ['deepseek_v3', 'sonnet_37', 'gpt_4o', 'llama_maverick'] as ModelId[],
} as const;

// ============================================================
// TIER COMPLEXITY GUIDELINES (from Task Generator Agent prompt)
// ============================================================

export const TIER_GUIDELINES = {
  simple: {
    description: 'Single-function business analysis with clear data and established methods',
    calculationCount: { min: 2, max: 3 },
    estimatedDuration: '15-20 minutes',
    cognitiveComplexity: 'Single-threaded reasoning with straightforward data',
  },
  moderate: {
    description: 'Cross-functional analysis requiring integration and trade-off decisions',
    calculationCount: { min: 4, max: 5 },
    estimatedDuration: '25-35 minutes',
    cognitiveComplexity: 'Multi-threaded reasoning with interdependencies',
  },
  complex: {
    description: 'Strategic/enterprise analysis with uncertainty, multiple stakeholders, and novel approaches',
    calculationCount: { min: 5, max: 10 },
    estimatedDuration: '45-60 minutes',
    cognitiveComplexity: 'Complex reasoning with uncertainty and stakeholder considerations',
  },
} as const;

// ============================================================
// DOMAIN COGNITIVE FOCUS (from Task Generator Agent prompt)
// ============================================================

export const DOMAIN_COGNITIVE_FOCUS = {
  analytical: {
    primaryFocus: ['complexity_handling', 'content_quality', 'hallucination_control'],
    description: 'Multi-layered financial analysis, market trends, competitive analysis, ROI calculations, customer segmentation',
  },
  planning: {
    primaryFocus: ['cognitive_load', 'tool_execution', 'processing_efficiency'],
    description: 'Resource-constrained timelines, strategic roadmaps, capacity planning, risk mitigation, technology implementation',
  },
  communication: {
    primaryFocus: ['content_quality', 'knowledge_transfer', 'construct_validity'],
    description: 'Multi-audience messaging, executive summaries, crisis communication, cross-cultural proposals, training materials',
  },
  problem_solving: {
    primaryFocus: ['memory_integration', 'complexity_handling', 'knowledge_transfer'],
    description: 'Multi-variable optimization, root cause analysis, innovation challenges, process improvement, strategic decisions',
  },
} as const;

// ============================================================
// MAAC DIMENSIONS (9-dimensional framework)
// ============================================================

export const MAAC_DIMENSIONS = [
  'cognitive_load',
  'tool_execution',
  'content_quality',
  'memory_integration',
  'complexity_handling',
  'hallucination_control',
  'knowledge_transfer',
  'processing_efficiency',
  'construct_validity',
] as const;

export type MAACDimensionId = (typeof MAAC_DIMENSIONS)[number];
