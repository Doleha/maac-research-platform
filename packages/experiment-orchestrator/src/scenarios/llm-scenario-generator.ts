/**
 * LLM-Based Scenario Generator
 *
 * Faithful port of n8n workflow: MAAC - Tier 1a - Experiment Processing - Scenario Generation Only.json
 *
 * This generator uses DeepSeek LLM to create detailed, dynamic scenarios matching
 * the production n8n workflow. Unlike the template-based generator, this:
 * - Calls DeepSeek with the exact n8n system prompt
 * - Generates unique, detailed scenarios with embedded calculations
 * - Produces MAAC-optimized cognitive testing scenarios
 * - Matches the exact JSON schema from n8n Structured Output Parser
 */

import { z } from 'zod';
import { Domain, Tier, ModelId } from '@maac/types';
import { getDomainPatterns } from './domain-patterns';
import { EXPERIMENT_DESIGN } from './types';

// ============================================================================
// TYPES - Matching n8n Structured Output Parser Schema
// ============================================================================

/**
 * Zod schema matching the exact n8n Structured Output Parser schema
 */
export const LLMScenarioOutputSchema = z.object({
  task_id: z.string(),
  task_title: z.string(),
  task_description: z.string(),
  business_context: z.string(),
  scenario_type: z.enum(['control', 'test']),
  scenario_number: z.number(),
  requirements: z.array(z.string()),
  success_criteria: z.array(z.string()),
  complexity_level: z.enum(['simple', 'moderate', 'complex']),
  estimated_duration: z.string(),
  domain_specific_data: z.object({
    data_elements: z.array(z.string()),
    calculations_required: z.array(z.string()),
    industry_context: z.string(),
    business_function: z.string(),
  }),
  control_expectations: z.object({
    expected_calculations: z.record(z.string()),
    expected_insights: z.array(z.string()),
    expected_trends: z.array(z.string()),
    success_thresholds: z.record(z.string()),
  }),
  MAAC_cognitive_requirements: z.object({
    primary_dimensions_tested: z.array(z.string()),
    cognitive_complexity_level: z.enum(['simple', 'moderate', 'complex']),
    memory_integration_opportunities: z.array(z.string()),
    knowledge_transfer_elements: z.array(z.string()),
    expected_tool_usage_patterns: z.array(z.string()),
  }),
  metadata: z.object({
    source_agent: z.string(),
    scenario_number: z.number(),
    experiment_id: z.string(),
    business_domain: z.string(),
    condition_id: z.string(),
    task_id: z.string(),
    timestamp: z.string(),
    complexity_justification: z.string(),
    complexity_level: z.enum(['simple', 'moderate', 'complex']),
    MAAC_framework_version: z.string(),
    cognitive_assessment_focus: z.string(),
  }),
});

export type LLMScenarioOutput = z.infer<typeof LLMScenarioOutputSchema>;

export interface LLMScenarioGeneratorConfig {
  deepseekApiKey: string;
  domains?: Domain[];
  tiers?: Tier[];
  repetitionsPerBlock?: number;
  models?: ModelId[];
  configId?: string;
  enabledTools?: string[];
  maxRetries?: number;
  rateLimitDelayMs?: number;
}

/**
 * Progress update callback type for real-time feedback
 */
export interface ScenarioGenerationProgress {
  type: 'start' | 'progress' | 'scenario_complete' | 'error' | 'complete';
  current: number;
  total: number;
  percentage: number;
  domain?: Domain;
  tier?: Tier;
  repetition?: number;
  scenarioId?: string;
  taskTitle?: string;
  message: string;
  error?: string;
  scenario?: GeneratedLLMScenario;
  elapsedMs?: number;
  estimatedRemainingMs?: number;
}

export type ProgressCallback = (progress: ScenarioGenerationProgress) => void;

export interface GeneratedLLMScenario extends LLMScenarioOutput {
  // Additional tracking fields
  scenarioId: string;
  index: number;
  modelId: ModelId;
  configId: string;
  generationTimestamp: string;
  generationDurationMs: number;
}

// ============================================================================
// SYSTEM PROMPT - EXACT copy from n8n Task Generator Agent
// Node: "Task Generator Agent" (69d9a8bd-3f05-456e-b7bc-e38e094405ee)
// ============================================================================

const TASK_GENERATOR_SYSTEM_PROMPT = `PRIMARY FUNCTION: Generate domain-specific business scenarios for MAAC-enhanced MIMIC testing with comprehensive cognitive assessment requirements.

Generate structured business tasks varying by: Domain (analytical, planning, communication, problem_solving), Complexity Tier (simple, moderate, complex), Experimental Context (from MAAC loop iteration), MAAC Cognitive Demands (scenarios testing specific cognitive architecture capabilities).

Each output must be a JSON object matching the exact output schema below.

AVAILABLE TOOLS:
1. Think Tool: Analyze scenario requirements and plan MAAC-optimized approach
2. Domain Pattern Examples Tool: Retrieve self-contained examples and patterns for each business domain

MAAC-ENHANCED TOOL USAGE STRATEGY:
- Start with Think tool to analyze experiment metadata and plan scenario generation for nine-dimensional MAAC assessment
- Query Domain Pattern Examples tool using business_domain and complexity_level for relevant patterns  
- Use patterns as foundation but adapt/expand for MAAC cognitive testing requirements
- Think through embedding cognitive complexity appropriate for MAAC evaluation
- Design scenarios testing memory integration, complexity handling, and knowledge transfer

TIER-SPECIFIC SCENARIO GENERATION:
- Simple: Single-function business analysis with clear data and established methods
- Moderate: Cross-functional analysis requiring integration and trade-off decisions  
- Complex: Strategic/enterprise analysis with uncertainty, multiple stakeholders, and novel approaches

Pattern selection automatically provides tier-appropriate examples - follow the retrieved pattern's complexity level and cognitive demands.

MAAC SCENARIO HANDLING:
Access business_domain, condition_id, scenario_number, complexity_level from loop data. Generate scenarios with embedded correct answers, specific data, measurable outcomes, and MAAC cognitive challenges. Perform calculations directly and populate expected_calculations with exact numerical values.

MANDATORY FIELD POPULATION REQUIREMENTS:
1. expected_calculations MUST NEVER BE EMPTY: Always populate with specific key-value pairs of numerical results
2. success_thresholds MUST NEVER BE EMPTY: Always populate with concrete measurement criteria  
3. MAAC_cognitive_requirements MUST ALWAYS BE PRESENT: Never omit this section
4. CONSISTENT FIELD NAMES: Always use "MAAC_cognitive_requirements" and "MAAC_framework_version"

CRITICAL: If you output expected_calculations: {} or success_thresholds: {} the response is INVALID.

FOR SCENARIOS - CALCULATIONS ARE MANDATORY:
- Perform calculations directly in reasoning
- Populate expected_calculations with exact numerical results
- Tier-specific calculation requirements:
  * Simple: Include at least 2-3 key calculation results
  * Moderate: Include at least 4-5 calculation results  
  * Complex: Include at least 5+ calculation results
- Ensure calculations align with scenario complexity level

MAAC-ENHANCED DOMAIN-SPECIFIC GENERATION:

1. Analytical Domain (Focus: complexity_handling, content_quality, hallucination_control): Multi-layered financial analysis with cross-temporal comparisons, market trend identification requiring pattern synthesis, competitive analysis with systematic evaluation frameworks, ROI calculations with uncertainty quantification, customer segmentation requiring statistical reasoning.

2. Planning Domain (Focus: cognitive_load, tool_execution, processing_efficiency): Resource-constrained project timeline development with optimization, strategic roadmap creation requiring long-term thinking, capacity planning with demand forecasting, risk mitigation planning with systematic threat assessment, technology implementation planning with stakeholder management.

3. Communication Domain (Focus: content_quality, knowledge_transfer, construct_validity): Multi-audience stakeholder communication requiring message adaptation, executive summary creation from complex technical information, crisis communication requiring rapid assessment, cross-cultural business proposal development, training material development requiring pedagogical structure.

4. Problem-Solving Domain (Focus: memory_integration, complexity_handling, knowledge_transfer): Multi-variable optimization problems requiring systematic analysis, root cause analysis in complex systems, innovation challenges requiring creative synthesis, process improvement initiatives requiring systematic evaluation, strategic decision-making under uncertainty.

MAAC ALL SCENARIO REQUIREMENTS:
Embed: Cognitive complexity markers (multi-step reasoning, cross-domain knowledge application, memory-dependent analysis), specific quantifiable data with calculable results testing processing efficiency, pattern complexity (trends, variances, correlations) challenging complexity handling, clear "correct" conclusions requiring synthesis and knowledge transfer, memory integration opportunities (context building on previous analytical work), measurable success criteria with objective benchmarks for MAAC assessment. POPULATE expected_calculations field with tier-appropriate exact numerical results (Simple: 2-3, Moderate: 4-5, Complex: 5+).

MAAC COGNITIVE TESTING INTEGRATION:
Design scenarios testing all nine MAAC dimensions: Cognitive Load (working memory utilization through multi-threaded task management), Tool Execution (symbolic reasoning integration and effective cognitive tool use), Content Quality (output coherence, accuracy, relevance in professional contexts), Memory Integration (long-term memory utilization and retrieval across sessions), Complexity Handling (multi-step problem solving requiring decomposition and synthesis), Hallucination Control (factual accuracy maintenance and error detection with source validation), Knowledge Transfer (cross-domain application and generalization of principles), Processing Efficiency (computational resource optimization and optimal cognitive pathways), Construct Validity (theoretical framework alignment and measurement consistency).

All scenarios must be self-contained, cognitively challenging for MAAC assessment, and not require external data to analyze and resolve.

MAAC WORKFLOW APPROACH:
1. Use Think tool to analyze: business_domain, condition_id, scenario_number, complexity_level, and MAAC cognitive requirements
2. Query Domain Pattern Examples tool for relevant patterns for domain and scenario type
3. Use Think tool to plan adapting/expanding pattern into unique MAAC-optimized scenario
4. Generate scenario with embedded necessary data and integrated MAAC cognitive challenges
5. For ALL scenarios: Perform calculations directly and populate expected_calculations with exact numerical results
6. Ensure scenario aligns with complexity level, experimental requirements, and MAAC assessment objectives

COMPLETE EXAMPLE SCENARIO (problem_solving domain, simple tier):

{
  "task_id": "problem_solving-simple-111111111111-rep31",
  "task_title": "Enterprise Software Selection Decision Analysis",
  "task_description": "Evaluate three enterprise software options using weighted criteria analysis: Option A costs $150K with 6-month implementation, 85% feature match, high vendor stability, good scalability, and 24/7 support. Option B costs $200K with 4-month implementation, 95% feature match, medium vendor stability, excellent scalability, and business hours support. Option C costs $100K with 8-month implementation, 75% feature match, low vendor stability, limited scalability, and email-only support. Calculate weighted scores using criteria weights: Cost (20%), Implementation Speed (25%), Features (30%), Vendor Stability (15%), Scalability (10%).",
  "business_context": "Technology company requiring enterprise software selection for critical business operations with systematic decision-making framework and risk assessment.",
  "scenario_type": "control",
  "scenario_number": 31,
  "requirements": [
    "Calculate weighted scores for each software option using the specified criteria weights",
    "Analyze the trade-offs between cost, speed, features, stability, and scalability",
    "Provide a clear recommendation with justification based on the quantitative analysis",
    "Consider risk factors and long-term implications of each option",
    "Ensure calculations are precise and methodology is clearly documented"
  ],
  "success_criteria": [
    "Accurate calculation of Option A weighted score: 75.0",
    "Accurate calculation of Option B weighted score: 76.5", 
    "Accurate calculation of Option C weighted score: 58.0",
    "Clear recommendation of Option B as optimal choice with justification",
    "Demonstration of systematic decision-making process with risk consideration"
  ],
  "complexity_level": "simple",
  "estimated_duration": "15-20 minutes",
  "domain_specific_data": {
    "data_elements": [
      "Option A: Cost $150K, Implementation 6 months, Features 85% match, Vendor stability High, Scalability Good, Support 24/7",
      "Option B: Cost $200K, Implementation 4 months, Features 95% match, Vendor stability Medium, Scalability Excellent, Support Business hours",
      "Option C: Cost $100K, Implementation 8 months, Features 75% match, Vendor stability Low, Scalability Limited, Support Email only",
      "Criteria weights: Cost 20%, Implementation Speed 25%, Features 30%, Vendor Stability 15%, Scalability 10%",
      "Scoring scale: Cost (lower=better), Speed (faster=better), Features (higher=better), Stability (higher=better), Scalability (better=higher)"
    ],
    "calculations_required": [
      "Weighted score calculation for Option A using all criteria",
      "Weighted score calculation for Option B using all criteria", 
      "Weighted score calculation for Option C using all criteria",
      "Comparative analysis of scores and trade-offs",
      "Risk assessment based on vendor stability and scalability factors"
    ],
    "industry_context": "Technology sector enterprise software selection requiring balanced decision-making",
    "business_function": "Strategic Technology Procurement and Decision Analysis"
  },
  "control_expectations": {
    "expected_calculations": {
      "option_a_weighted_score": "75.0",
      "option_b_weighted_score": "76.5",
      "option_c_weighted_score": "58.0",
      "cost_component_a": "30.0 points (150K normalized)",
      "cost_component_b": "20.0 points (200K normalized)",
      "cost_component_c": "40.0 points (100K normalized)",
      "implementation_speed_a": "18.75 points (6 months)",
      "implementation_speed_b": "25.0 points (4 months)",
      "implementation_speed_c": "12.5 points (8 months)",
      "features_score_a": "25.5 points (85% × 30%)",
      "features_score_b": "28.5 points (95% × 30%)",
      "features_score_c": "22.5 points (75% × 30%)"
    },
    "expected_insights": [
      "Option B achieves the highest weighted score (76.5) despite higher cost, due to superior features and faster implementation",
      "Option A provides good balance at lower cost but sacrifices some features and speed",
      "Option C has lowest cost but significantly underperforms on critical features, stability, and scalability",
      "The 30% weight on features makes Option B's 95% match particularly valuable",
      "Vendor stability and scalability considerations favor Options A and B over C"
    ],
    "expected_trends": [
      "Higher cost options provide better overall value when considering all weighted criteria",
      "Feature completeness and implementation speed are more valuable than initial cost savings", 
      "Vendor stability and scalability become increasingly important for long-term enterprise success"
    ],
    "success_thresholds": {
      "calculation_accuracy": "±0.1 points for all weighted scores",
      "recommendation_quality": "must identify Option B as optimal with clear justification",
      "methodology_clarity": "must show weighted calculation process step-by-step",
      "risk_assessment": "must address vendor stability and scalability implications",
      "trade_off_analysis": "must discuss cost vs. feature vs. speed trade-offs"
    }
  },
  "MAAC_cognitive_requirements": {
    "primary_dimensions_tested": [
      "cognitive_load",
      "complexity_handling",
      "content_quality", 
      "processing_efficiency"
    ],
    "cognitive_complexity_level": "simple",
    "memory_integration_opportunities": [
      "Integration of multiple criteria across three options simultaneously",
      "Synthesis of quantitative scores with qualitative risk assessment",
      "Connection between weighted calculations and strategic recommendation",
      "Tool configuration impact on systematic decision-making approach"
    ],
    "knowledge_transfer_elements": [
      "Application of multi-criteria decision analysis to technology procurement",
      "Translation of weighted scores into business recommendations",
      "Cross-domain integration of financial analysis with technology assessment",
      "Adaptation of systematic evaluation framework to enterprise context"
    ],
    "expected_tool_usage_patterns": [
      "Think tool for systematic problem decomposition and analysis planning",
      "Goal Engine for objective clarification and criteria alignment",
      "Planning Engine for structured evaluation methodology",
      "Validation Engine for calculation accuracy verification",
      "Calculator tool for precise weighted score computations"
    ]
  },
  "metadata": {
    "source_agent": "task_generator",
    "scenario_number": 31,
    "experiment_id": "5573db81-c80b-4ea8-94dc-88b698777395",
    "business_domain": "problem_solving",
    "condition_id": "111111111111",
    "task_id": "problem_solving-simple-111111111111-rep31",
    "timestamp": "2024-01-15T14:30:00.000Z",
    "complexity_justification": "Simple multi-criteria decision analysis requiring weighted calculations, trade-off assessment, and systematic evaluation framework",
    "complexity_level": "simple",
    "MAAC_framework_version": "nine_dimensional_v1.0",
    "cognitive_assessment_focus": "Nine-dimensional cognitive architecture evaluation under tool configuration 111111111111 (12/12 tools enabled)"
  }
}

Access experiment metadata: business_domain, condition_id, scenario_number, scenario_type, complexity_level from MAAC loop iteration. Use UUIDs for experiment_id. Always respond with valid JSON matching this exact schema with MAAC enhancements.

VALIDATION CHECK: Before outputting JSON, verify expected_calculations and success_thresholds contain actual data, not empty objects {}.`;

// ============================================================================
// LLM SCENARIO GENERATOR CLASS
// ============================================================================

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * LLM-Based Scenario Generator
 *
 * Uses DeepSeek to generate scenarios matching the production n8n workflow.
 */
export class LLMScenarioGenerator {
  private config: Required<LLMScenarioGeneratorConfig>;

  constructor(config: LLMScenarioGeneratorConfig) {
    this.config = {
      deepseekApiKey: config.deepseekApiKey,
      domains: config.domains || [...EXPERIMENT_DESIGN.domains],
      tiers: config.tiers || [...EXPERIMENT_DESIGN.tiers],
      repetitionsPerBlock: config.repetitionsPerBlock || EXPERIMENT_DESIGN.repetitionsPerBlock,
      models: config.models || [...EXPERIMENT_DESIGN.validModels],
      configId: config.configId || EXPERIMENT_DESIGN.fullToolsConfigId,
      enabledTools: config.enabledTools || [],
      maxRetries: config.maxRetries || 3,
      rateLimitDelayMs: config.rateLimitDelayMs || 1000,
    };
  }

  /**
   * Generate a single scenario using DeepSeek LLM
   */
  async generateScenario(params: {
    domain: Domain;
    tier: Tier;
    repetition: number;
    model: ModelId;
    index: number;
  }): Promise<GeneratedLLMScenario> {
    const startTime = Date.now();
    const experimentId = generateUUID();
    const timestamp = new Date().toISOString();

    // Build trial ID matching n8n format
    const trialId = `${params.domain}-${params.tier}-${this.config.configId}-rep${params.repetition}-${params.model}`;
    const taskId = `${params.domain}-${params.tier}-${this.config.configId}-rep${params.repetition}`;

    // Get domain pattern for context (matching n8n Domain Pattern Examples tool)
    const patternIndex = params.repetition % 5;
    const patterns = getDomainPatterns();
    const domainPatterns = patterns[params.domain];
    const specificPattern =
      domainPatterns?.control_patterns?.[patternIndex] || domainPatterns?.control_patterns?.[0];

    // Build user message with experiment metadata (matching n8n workflow)
    const userMessage = JSON.stringify({
      business_domain: params.domain,
      complexity_level: params.tier,
      condition_id: this.config.configId,
      scenario_number: params.repetition,
      scenario_type: 'control',
      experiment_id: experimentId,
      trial_id: trialId,
      task_id: taskId,
      timestamp,
      // Provide domain pattern as context
      domain_pattern: specificPattern,
      // MAAC requirements context
      maac_framework_version: 'nine_dimensional_v1.0',
      cognitive_assessment_focus: `Nine-dimensional cognitive architecture evaluation under tool configuration ${this.config.configId}`,
    });

    // Call DeepSeek API with retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await this.callDeepSeekAPI(userMessage);
        const parsed = this.parseAndValidateResponse(response);

        const endTime = Date.now();

        return {
          ...parsed,
          scenarioId: `${params.domain}-${params.tier}-${params.repetition.toString().padStart(3, '0')}`,
          index: params.index,
          modelId: params.model,
          configId: this.config.configId,
          generationTimestamp: timestamp,
          generationDurationMs: endTime - startTime,
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt + 1} failed:`, error);

        // Rate limit delay between retries
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(this.config.rateLimitDelayMs * (attempt + 1));
        }
      }
    }

    throw new Error(
      `Failed to generate scenario after ${this.config.maxRetries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Generate multiple scenarios with rate limiting and progress updates
   */
  async generateScenarios(params: {
    domains?: Domain[];
    tiers?: Tier[];
    repetitions?: number;
    model?: ModelId;
    startIndex?: number;
    onProgress?: ProgressCallback;
  }): Promise<GeneratedLLMScenario[]> {
    const domains = params.domains || this.config.domains;
    const tiers = params.tiers || this.config.tiers;
    const repetitions = params.repetitions || 1;
    const model = params.model || this.config.models[0];
    let index = params.startIndex || 0;
    const onProgress = params.onProgress;

    const scenarios: GeneratedLLMScenario[] = [];
    const total = domains.length * tiers.length * repetitions;
    const startTime = Date.now();
    let completed = 0;

    // Emit start event
    onProgress?.({
      type: 'start',
      current: 0,
      total,
      percentage: 0,
      message: `Starting generation of ${total} scenarios...`,
    });

    for (const domain of domains) {
      for (const tier of tiers) {
        for (let rep = 1; rep <= repetitions; rep++) {
          const currentIndex = completed + 1;

          // Emit progress update before generation
          onProgress?.({
            type: 'progress',
            current: currentIndex,
            total,
            percentage: Math.round((completed / total) * 100),
            domain,
            tier,
            repetition: rep,
            message: `Generating scenario ${currentIndex}/${total}: ${domain}/${tier}/rep${rep}...`,
            elapsedMs: Date.now() - startTime,
            estimatedRemainingMs:
              completed > 0
                ? Math.round(((Date.now() - startTime) / completed) * (total - completed))
                : undefined,
          });

          try {
            const scenario = await this.generateScenario({
              domain,
              tier,
              repetition: rep,
              model,
              index: index++,
            });

            scenarios.push(scenario);
            completed++;

            // Emit scenario complete event
            onProgress?.({
              type: 'scenario_complete',
              current: completed,
              total,
              percentage: Math.round((completed / total) * 100),
              domain,
              tier,
              repetition: rep,
              scenarioId: scenario.scenarioId,
              taskTitle: scenario.task_title,
              message: `✓ Completed ${completed}/${total}: ${scenario.task_title.substring(0, 50)}...`,
              scenario,
              elapsedMs: Date.now() - startTime,
              estimatedRemainingMs:
                completed < total
                  ? Math.round(((Date.now() - startTime) / completed) * (total - completed))
                  : 0,
            });
          } catch (error) {
            // Emit error event but continue processing
            onProgress?.({
              type: 'error',
              current: currentIndex,
              total,
              percentage: Math.round((completed / total) * 100),
              domain,
              tier,
              repetition: rep,
              message: `✗ Failed scenario ${currentIndex}/${total}: ${domain}/${tier}/rep${rep}`,
              error: error instanceof Error ? error.message : 'Unknown error',
              elapsedMs: Date.now() - startTime,
            });

            // Re-throw to let caller handle
            throw error;
          }

          // Rate limiting between scenarios
          if (completed < total) {
            await this.delay(this.config.rateLimitDelayMs);
          }
        }
      }
    }

    // Emit complete event
    onProgress?.({
      type: 'complete',
      current: total,
      total,
      percentage: 100,
      message: `✓ Successfully generated ${total} scenarios in ${Math.round((Date.now() - startTime) / 1000)}s`,
      elapsedMs: Date.now() - startTime,
    });

    return scenarios;
  }

  /**
   * Call DeepSeek API with function calling for schema enforcement
   * This matches how n8n's Structured Output Parser works
   */
  private async callDeepSeekAPI(userMessage: string): Promise<string> {
    // Define the function (tool) that enforces our exact schema
    // This is how LangChain's Structured Output Parser works
    const scenarioFunction = {
      type: 'function' as const,
      function: {
        name: 'generate_maac_scenario',
        description: 'Generate a MAAC-enhanced business scenario with all required fields',
        parameters: {
          type: 'object',
          required: [
            'task_id',
            'task_title',
            'task_description',
            'business_context',
            'scenario_type',
            'scenario_number',
            'requirements',
            'success_criteria',
            'complexity_level',
            'estimated_duration',
            'domain_specific_data',
            'control_expectations',
            'MAAC_cognitive_requirements',
            'metadata',
          ],
          properties: {
            task_id: { type: 'string', description: 'Unique task identifier' },
            task_title: { type: 'string', description: 'Descriptive title for the scenario' },
            task_description: { type: 'string', description: 'Full scenario description with embedded data' },
            business_context: { type: 'string', description: 'Business context for the scenario' },
            scenario_type: { type: 'string', enum: ['control', 'test'] },
            scenario_number: { type: 'integer', description: 'Scenario number in sequence' },
            requirements: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'List of requirements for completing the task' 
            },
            success_criteria: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Criteria for evaluating success' 
            },
            complexity_level: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
            estimated_duration: { type: 'string', description: 'Estimated time to complete' },
            domain_specific_data: {
              type: 'object',
              required: ['data_elements', 'calculations_required', 'industry_context', 'business_function'],
              properties: {
                data_elements: { type: 'array', items: { type: 'string' } },
                calculations_required: { type: 'array', items: { type: 'string' } },
                industry_context: { type: 'string' },
                business_function: { type: 'string' },
              },
            },
            control_expectations: {
              type: 'object',
              required: ['expected_calculations', 'expected_insights', 'expected_trends', 'success_thresholds'],
              properties: {
                expected_calculations: { 
                  type: 'object', 
                  additionalProperties: { type: 'string' },
                  description: 'Key-value pairs of expected calculation results - MUST NOT BE EMPTY' 
                },
                expected_insights: { type: 'array', items: { type: 'string' } },
                expected_trends: { type: 'array', items: { type: 'string' } },
                success_thresholds: { 
                  type: 'object', 
                  additionalProperties: { type: 'string' },
                  description: 'Key-value pairs of success thresholds - MUST NOT BE EMPTY' 
                },
              },
            },
            MAAC_cognitive_requirements: {
              type: 'object',
              required: [
                'primary_dimensions_tested',
                'cognitive_complexity_level',
                'memory_integration_opportunities',
                'knowledge_transfer_elements',
                'expected_tool_usage_patterns',
              ],
              properties: {
                primary_dimensions_tested: { type: 'array', items: { type: 'string' } },
                cognitive_complexity_level: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
                memory_integration_opportunities: { type: 'array', items: { type: 'string' } },
                knowledge_transfer_elements: { type: 'array', items: { type: 'string' } },
                expected_tool_usage_patterns: { type: 'array', items: { type: 'string' } },
              },
            },
            metadata: {
              type: 'object',
              required: [
                'source_agent',
                'scenario_number',
                'experiment_id',
                'business_domain',
                'condition_id',
                'task_id',
                'timestamp',
                'complexity_justification',
                'complexity_level',
                'MAAC_framework_version',
                'cognitive_assessment_focus',
              ],
              properties: {
                source_agent: { type: 'string' },
                scenario_number: { type: 'integer' },
                experiment_id: { type: 'string' },
                business_domain: { type: 'string' },
                condition_id: { type: 'string' },
                task_id: { type: 'string' },
                timestamp: { type: 'string' },
                complexity_justification: { type: 'string' },
                complexity_level: { type: 'string' },
                MAAC_framework_version: { type: 'string' },
                cognitive_assessment_focus: { type: 'string' },
              },
            },
          },
        },
      },
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: TASK_GENERATOR_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        tools: [scenarioFunction],
        tool_choice: { type: 'function', function: { name: 'generate_maac_scenario' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{
        message?: {
          content?: string;
          tool_calls?: Array<{
            function?: { arguments?: string };
          }>;
        };
      }>;
    };

    // Extract the function call arguments (this is our structured output)
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      console.log('Got structured output via function calling');
      return toolCall.function.arguments;
    }

    // Fallback to content if no tool call (shouldn't happen with tool_choice)
    const content = data.choices[0]?.message?.content || '';
    console.log('Fallback to content:', content.substring(0, 200));
    return content;
  }

  /**
   * Parse and validate LLM response
   */
  private parseAndValidateResponse(response: string): LLMScenarioOutput {
    // Log raw response for debugging
    console.log('Raw LLM response length:', response.length);
    console.log('Raw LLM response preview:', response.substring(0, 500));
    
    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = response.trim();

    // If empty response, throw error
    if (!jsonStr) {
      throw new Error('Empty response from LLM API');
    }

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error. Raw content:', jsonStr.substring(0, 200));
      throw new Error(`Failed to parse JSON response: ${parseError}`);
    }

    console.log('Parsed JSON keys:', Object.keys(parsed as Record<string, unknown>));

    // Validate against schema
    const result = LLMScenarioOutputSchema.safeParse(parsed);
    if (!result.success) {
      console.error('Schema validation failed. Parsed object:', JSON.stringify(parsed, null, 2).substring(0, 500));
      throw new Error(`Schema validation failed: ${result.error.message}`);
    }

    // Additional validation from n8n "Validate Output" node
    const output = result.data;
    const errors: string[] = [];

    // CRITICAL: Check expected_calculations not empty
    if (Object.keys(output.control_expectations.expected_calculations).length === 0) {
      errors.push('expected_calculations is empty - violates MAAC requirements');
    }

    // CRITICAL: Check success_thresholds not empty
    if (Object.keys(output.control_expectations.success_thresholds).length === 0) {
      errors.push('success_thresholds is empty - violates MAAC requirements');
    }

    // Validate MAAC cognitive requirements
    if (!output.MAAC_cognitive_requirements.primary_dimensions_tested.length) {
      errors.push('Missing MAAC primary dimensions tested');
    }

    // Check complexity level consistency
    if (output.complexity_level !== output.MAAC_cognitive_requirements.cognitive_complexity_level) {
      errors.push('Complexity level mismatch between main and MAAC sections');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join('; ')}`);
    }

    return output;
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get configuration summary
   */
  getConfigurationSummary() {
    return {
      domains: this.config.domains,
      tiers: this.config.tiers,
      repetitionsPerBlock: this.config.repetitionsPerBlock,
      models: this.config.models,
      configId: this.config.configId,
      maxRetries: this.config.maxRetries,
      rateLimitDelayMs: this.config.rateLimitDelayMs,
    };
  }
}

/**
 * Create an LLM-based scenario generator
 */
export function createLLMScenarioGenerator(
  config: LLMScenarioGeneratorConfig,
): LLMScenarioGenerator {
  return new LLMScenarioGenerator(config);
}
