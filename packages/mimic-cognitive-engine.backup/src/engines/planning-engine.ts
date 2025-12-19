/**
 * Planning Engine - Develop strategic execution plans
 *
 * @private - Proprietary MIMIC component
 *
 * Responsibilities:
 * - Analyze structured goals and develop execution strategies
 * - Create step-by-step approaches with dependencies
 * - Identify resource requirements
 * - Assess risks and mitigation strategies
 * - Establish timelines and milestones
 *
 * Output Schema extracted from n8n workflow:
 * - planId, steps[], resources[], risks[], milestones[]
 * - plan_analysis with feasibility and optimization suggestions
 */

import { generateText } from 'ai';
import { z } from 'zod';
import { AIModel, SystemPromptProvider } from '../orchestrator';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Plan step definition
 */
export interface PlanStep {
  stepId: string;
  order: number;
  action: string;
  description: string;
  dependencies: string[];
  estimatedDuration: string;
  requiredTools?: string[];
}

/**
 * Resource requirement
 */
export interface PlanResource {
  resourceId: string;
  type: 'tool' | 'data' | 'external' | 'memory';
  name: string;
  description: string;
  required: boolean;
  availability: 'available' | 'conditional' | 'unavailable';
}

/**
 * Risk assessment
 */
export interface PlanRisk {
  riskId: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  contingency?: string;
}

/**
 * Milestone definition
 */
export interface PlanMilestone {
  milestoneId: string;
  name: string;
  targetStep: string;
  successCriteria: string[];
  estimatedCompletion: string;
}

/**
 * Zod schema for plan steps
 */
export const PlanStepSchema = z.object({
  stepId: z.string(),
  order: z.number(),
  action: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()),
  estimatedDuration: z.string(),
  requiredTools: z.array(z.string()).optional(),
});

/**
 * Zod schema for resources
 */
export const PlanResourceSchema = z.object({
  resourceId: z.string(),
  type: z.enum(['tool', 'data', 'external', 'memory']),
  name: z.string(),
  description: z.string(),
  required: z.boolean(),
  availability: z.enum(['available', 'conditional', 'unavailable']),
});

/**
 * Zod schema for risks
 */
export const PlanRiskSchema = z.object({
  riskId: z.string(),
  description: z.string(),
  likelihood: z.enum(['low', 'medium', 'high']),
  impact: z.enum(['low', 'medium', 'high']),
  mitigation: z.string(),
  contingency: z.string().optional(),
});

/**
 * Zod schema for milestones
 */
export const PlanMilestoneSchema = z.object({
  milestoneId: z.string(),
  name: z.string(),
  targetStep: z.string(),
  successCriteria: z.array(z.string()),
  estimatedCompletion: z.string(),
});

/**
 * Zod schema for plan analysis
 */
export const PlanAnalysisSchema = z.object({
  feasibilityScore: z.number().min(0).max(1),
  complexityAssessment: z.enum(['simple', 'moderate', 'complex']),
  estimatedTotalDuration: z.string(),
  criticalPath: z.array(z.string()),
  optimizationSuggestions: z.array(z.string()),
  potentialBottlenecks: z.array(z.string()),
});

export type PlanAnalysis = z.infer<typeof PlanAnalysisSchema>;

/**
 * Complete Planning Engine output schema
 */
export const PlanningEngineOutputSchema = z.object({
  plan: z.object({
    planId: z.string(),
    goalId: z.string(),
    steps: z.array(PlanStepSchema),
    resources: z.array(PlanResourceSchema),
    risks: z.array(PlanRiskSchema),
    milestones: z.array(PlanMilestoneSchema),
  }),
  plan_analysis: PlanAnalysisSchema,
  processing_notes: z.string().optional(),
});

export type PlanningEngineOutput = z.infer<typeof PlanningEngineOutputSchema>;

/**
 * Planning Engine result (public interface)
 */
export interface PlanningEngineResult {
  planId: string;
  goalId: string;
  steps: PlanStep[];
  resources: PlanResource[];
  risks: PlanRisk[];
  milestones: PlanMilestone[];
  analysis: PlanAnalysis;
}

/**
 * Planning Engine configuration
 */
export interface PlanningEngineConfig {
  llmProvider: AIModel;
  systemPrompt?: string | SystemPromptProvider;
  debug?: boolean;
}

// ============================================================================
// PLANNING ENGINE CLASS
// ============================================================================

export class PlanningEngine {
  private readonly llmProvider: AIModel;
  private readonly systemPromptSource?: string | SystemPromptProvider;
  private readonly debug: boolean;
  private cachedSystemPrompt: string | null = null;

  constructor(llmProvider: AIModel, config?: Partial<PlanningEngineConfig>) {
    this.llmProvider = llmProvider;
    this.systemPromptSource = config?.systemPrompt;
    this.debug = config?.debug ?? false;
  }

  /**
   * Resolve the system prompt from various sources
   */
  private async getSystemPrompt(): Promise<string> {
    if (this.cachedSystemPrompt) {
      return this.cachedSystemPrompt;
    }

    let prompt: string;

    if (typeof this.systemPromptSource === 'function') {
      prompt = await this.systemPromptSource();
    } else if (typeof this.systemPromptSource === 'string') {
      prompt = this.systemPromptSource;
    } else if (process.env.PLANNING_ENGINE_SYSTEM_PROMPT) {
      prompt = process.env.PLANNING_ENGINE_SYSTEM_PROMPT;
    } else {
      prompt = this.getDefaultSystemPrompt();
    }

    this.cachedSystemPrompt = prompt;
    return prompt;
  }

  /**
   * Default system prompt from MIMIC v2.8 Planning Agent specification
   * Use SystemPromptProvider to override via secrets manager in production
   */
  private getDefaultSystemPrompt(): string {
    return `## UPDATED PLANNING AGENT - MIMIC v2.8

You generate structured, actionable plans that achieve goals within constraints. Your role is to transform validated goals into step-by-step execution paths while determining the optimal next step in the cognitive process. You focus ONLY on cognitive planning decisions.

### CORE RESPONSIBILITIES

Your primary responsibilities are to analyze goals and create comprehensive plans that achieve them, respect all constraints while optimizing for efficiency and effectiveness, identify risks and dependencies in the execution path, and determine whether plans need validation or can proceed directly to evaluation.

**For planning decisions, prioritize:**
1. Review cognitive_content from goal agent for objectives and constraints
2. Check cognitive_content from clarification agent for user requirements
3. Analyze blocking_issues to identify planning constraints
4. Assess completion_status to ensure prerequisites are satisfied
5. Use confidence_level to gauge reliability of inputs

Reference the original content field only when you need detailed goal_state, clarification_request, or other schema-specific information.

### PLAN ID FORMAT REQUIREMENT

When generating plan_id, use pure UUID format:
Examples: "f47ac10b-58cc-4372-a567-0e02b2c3d479" or "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

Use actual UUID strings, not placeholder text or concatenation.

### ACTIVE GOALS CONTEXT

You receive active goals context via the active_goals parameter:
- **goal_id**: Unique identifier for goals this plan should address
- **goal_status**: Current state of each goal

Use this context to:
1. Explicitly reference which goals your plan addresses
2. Ensure plan completeness covers all active goals
3. Identify goal dependencies and relationships
4. Generate plan_id and populate addresses_goals array in your output

### PLANNING ANALYSIS PROCESS

Think through plan creation systematically.

First, select your strategy by analyzing what approach best fits the goal type, how constraints shape the possible approaches, what patterns have succeeded in similar situations from memory context, and which strategy optimizes for the stated success criteria.

Second, construct the plan step by step by defining the starting state and required resources, identifying key milestones and checkpoints, mapping dependencies between steps, ensuring the end state achieves all goals, and addressing any potential gaps.

Third, optimize the plan by identifying steps that can run in parallel, finding opportunities for resource efficiency, adding safeguards for risk mitigation, and exploring opportunities for timeline improvement.

Fourth, determine routing based on plan characteristics where complex or risky plans need validation, straightforward plans with low risk can proceed to evaluation, constraint violations require clarification, and impossible plans need human intervention.

### OUTPUT FORMAT

Provide your analysis in natural language, explaining your planning approach and key decisions. Then output the required JSON structure:

{
   "session":{
      "id":"<session_id>",
      "iteration":"<iteration>",
      "agent_sequence":"<agent_sequence>"
   },
   "reasoning":"Why this routing was chosen based on plan complexity, risk level, and validation needs",
   "sourceAgent":"planning",
   "active_goals":"<active_goals>",
   "plan":{
      "plan_id":"string",
      "addresses_goals":[
         "string"
      ],
      "strategy":"selected_approach_name",
      "estimated_duration":"time_estimate",
      "resource_requirements":[
         "needed_resources"
      ],
      "steps":[
         {
            "id":"step_1",
            "type":"preparation|research|analysis|execution|validation|delivery",
            "description":"clear action description",
            "purpose":"why this step matters for goal achievement",
            "dependencies":[
               "prerequisite_step_ids"
            ],
            "estimated_effort":"time/complexity estimate",
            "success_criteria":"how to know step is complete",
            "risks":[
               "potential issues and mitigation approaches"
            ],
            "alternatives":[
               "other approaches if this step fails"
            ]
         }
      ],
      "critical_path":[
         "step_ids in critical sequence"
      ],
      "parallel_opportunities":{
         "type":"array",
         "items":{
            "type":"array",
            "items":{
               "type":"string"
            }
         },
         "description":"Groups of step IDs that can run in parallel"
      },
      "milestones":[
         {
            "id":"m1",
            "description":"key achievement point",
            "steps_included":[
               "step_ids"
            ],
            "success_indicator":"measurable outcome"
         }
      ]
   },
   "plan_analysis":{
      "goal_coverage":"complete|partial|insufficient",
      "constraint_compliance":true,
      "risk_level":"low|medium|high",
      "complexity":"simple|moderate|complex",
      "validation_recommended":true
   },
   "alternatives":[
      {
         "strategy":"alternative approach name",
         "trade_offs":"what's different about this approach",
         "when_better":"conditions that would favor this alternative"
      }
   ]
}

### PLANNING STRATEGIES

When planning analytical projects, think: Start with data preparation to ensure quality inputs. Build multiple analysis angles for comprehensive insights. Include synthesis steps to transform findings into actionable recommendations. Add clear deliverables for stakeholder communication. Analytical plans typically have medium complexity requiring validation.

When planning simple procedural tasks, think: Keep steps minimal and focused on essential actions. Avoid over-engineering straightforward processes. Clear success criteria enable quick completion. Simple plans with 2-3 steps can often proceed directly to evaluation. Document concisely but completely.

When facing constraint violations, think: Identify which constraints are truly fixed versus negotiable. Create alternative approaches that work within limits. Document trade-offs clearly for user decision. Route to clarification rather than abandoning the planning effort. Sometimes phased approaches solve resource or timeline constraints.

### PLANNING EXAMPLES

When planning "analyze Q4 sales data for growth opportunities", think: This requires data access, analysis tools, and synthesis capability. Strategy: comprehensive analytical approach with data preparation, multi-angle analysis, and insight synthesis. Steps: 1) data collection and validation, 2) trend analysis, 3) opportunity identification, 4) recommendation development. Medium complexity with dependencies between steps suggests validation before execution.

When planning "create summary report from existing analysis", think: This is a straightforward documentation task with clear inputs and outputs. Strategy: synthesis and formatting approach. Steps: 1) review existing analysis, 2) identify key points, 3) structure summary, 4) format report. Low complexity with minimal risk can proceed directly to evaluation.

When planning "optimize system performance while reducing costs", think: This involves conflicting objectives requiring trade-off decisions. Current constraints unclear on priority between performance and cost. Cannot create effective plan without understanding user preferences on trade-offs. Route to clarification to understand priority and acceptable compromises.

## MEMORY RETRIEVAL STRATEGY

**For identity/personal info queries** ("What's my name?", "Who am I?", "What's my role?"):
→ Use **Memory_Query_Nodes**

**For cross-session context and user information** ("What do I prefer?", "How do we usually handle this?", "What's my background?"):
→ Use **Context_Memory_Query**

**For cognitive performance insights** ("How did we solve this before?", "What strategies worked well?", "What patterns have we learned?"):
→ Use **Reflection_Memory_Query**

**For performance data and metrics** ("How am I performing?", "What are my assessment scores?", "Show me behavioral metrics"):
→ Use **Evaluation_Memory_Query**

**When in doubt**: Start with Context_Memory_Query as it contains most user-specific information, then use specialized memory tools as needed.

### DOS AND DON'TS

Do:
- Focus exclusively on plan creation and optimization - your core cognitive responsibility
- Leverage memory_context to understand successful patterns and proven strategies
- Create plans that address every stated goal and success criterion comprehensively
- Respect all constraints and document clearly when they cannot be satisfied
- Identify dependencies clearly to prevent execution problems and bottlenecks
- Optimize for parallel execution where possible to improve efficiency
- Provide realistic time estimates based on actual capability and resource assessment
- Document risks and mitigation strategies for potential failure points

Don't:
- Create overly complex plans for simple goals
- Ignore resource constraints hoping they'll resolve during execution
- Skip risk assessment for operations with potential failure points
- Route complex or risky plans directly to evaluation without validation
- Make plans that violate safety, ethical, or feasibility boundaries
- Proceed with plans that have unresolved constraint violations

Remember that effective plans balance completeness with practicality. Your plans should be detailed enough to execute successfully but not so complex they become unwieldy. Always consider the user's constraints and optimize within them rather than creating ideal but infeasible plans. Use proven patterns from memory context to increase success probability.`;
  }

  /**
   * Execute strategic planning (returns JSON string for tool interface)
   */
  async execute(
    query: string,
    sessionId: string,
    activeGoals?: string
  ): Promise<string> {
    const result = await this.createPlan(query, sessionId, activeGoals);
    return JSON.stringify(result);
  }

  /**
   * Create plan with full structured output
   */
  async createPlan(
    query: string,
    sessionId: string,
    activeGoals?: string
  ): Promise<PlanningEngineResult> {
    const systemPrompt = await this.getSystemPrompt();
    const userMessage = this.buildUserMessage(query, activeGoals);

    try {
      const result = await generateText({
        model: this.llmProvider,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.4,
      });

      if (this.debug) {
        console.log('[PlanningEngine] Raw LLM response:', result.text);
      }

      const output = this.parseOutput(result.text, sessionId, activeGoals);
      return this.transformToResult(output);
    } catch (error) {
      if (this.debug) {
        console.error('[PlanningEngine] Planning failed:', error);
      }

      return this.createFallbackResult(query, sessionId, activeGoals);
    }
  }

  /**
   * Build the user message for planning
   */
  private buildUserMessage(query: string, activeGoals?: string): string {
    const parts: string[] = [];

    parts.push('## Task/Goal to Plan');
    parts.push(query);

    if (activeGoals) {
      parts.push('');
      parts.push('## Structured Goals');
      parts.push(activeGoals);
    }

    parts.push('');
    parts.push('---');
    parts.push('Create a comprehensive execution plan. Respond with valid JSON only.');

    return parts.join('\n');
  }

  /**
   * Parse LLM output into structured PlanningEngineOutput
   */
  private parseOutput(
    text: string,
    sessionId: string,
    activeGoals?: string
  ): PlanningEngineOutput {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure IDs are set
    if (parsed.plan) {
      if (!parsed.plan.planId) {
        parsed.plan.planId = `plan-${sessionId}-${Date.now()}`;
      }
      if (!parsed.plan.goalId && activeGoals) {
        try {
          const goals = JSON.parse(activeGoals);
          parsed.plan.goalId = goals.goalId || 'unknown';
        } catch {
          parsed.plan.goalId = 'unknown';
        }
      }
    }

    return PlanningEngineOutputSchema.parse(parsed);
  }

  /**
   * Transform PlanningEngineOutput to PlanningEngineResult
   */
  private transformToResult(output: PlanningEngineOutput): PlanningEngineResult {
    return {
      ...output.plan,
      analysis: output.plan_analysis,
    };
  }

  /**
   * Create fallback result when planning fails
   */
  private createFallbackResult(
    query: string,
    sessionId: string,
    activeGoals?: string
  ): PlanningEngineResult {
    let goalId = 'unknown';
    if (activeGoals) {
      try {
        const goals = JSON.parse(activeGoals);
        goalId = goals.goalId || 'unknown';
      } catch {
        // Keep default
      }
    }

    return {
      planId: `plan-${sessionId}-${Date.now()}`,
      goalId,
      steps: [
        {
          stepId: 'step-1',
          order: 1,
          action: 'Execute task',
          description: query.length > 100 ? query.substring(0, 100) + '...' : query,
          dependencies: [],
          estimatedDuration: 'Unknown',
        },
      ],
      resources: [],
      risks: [
        {
          riskId: 'risk-1',
          description: 'Plan generation failed - using fallback',
          likelihood: 'medium',
          impact: 'medium',
          mitigation: 'Manual review recommended',
        },
      ],
      milestones: [],
      analysis: {
        feasibilityScore: 0.5,
        complexityAssessment: 'moderate',
        estimatedTotalDuration: 'Unknown',
        criticalPath: ['step-1'],
        optimizationSuggestions: ['Review and refine plan manually'],
        potentialBottlenecks: ['Insufficient planning data'],
      },
    };
  }
}