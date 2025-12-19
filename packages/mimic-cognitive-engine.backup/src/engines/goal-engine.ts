/**
 * Goal Engine - Extract and structure user objectives
 *
 * @private - Proprietary MIMIC component
 *
 * Responsibilities:
 * - Extract primary goals from user queries
 * - Identify sub-goals and decompose complex objectives
 * - Define success criteria for goal completion
 * - Identify constraints and assumptions
 * - Detect ambiguities requiring clarification
 * - Classify domain and complexity tier
 *
 * Output Schema extracted from n8n workflow:
 * - goalId, primaryGoal, subGoals[], successCriteria[]
 * - constraints[], assumptions[], domain, complexity
 * - ambiguity_report with questions and severity
 */

import { generateText } from 'ai';
import { z } from 'zod';
import { AIModel, SystemPromptProvider } from '../orchestrator';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Goal complexity tier
 */
export type ComplexityTier = 'simple' | 'moderate' | 'complex';

/**
 * Business domain classification
 */
export type DomainType = 'analytical' | 'planning' | 'communication' | 'problem_solving' | 'general';

/**
 * Ambiguity severity level
 */
export type AmbiguitySeverity = 'low' | 'medium' | 'high' | 'blocking';

/**
 * Zod schema for goal state output
 */
export const GoalStateSchema = z.object({
  goalId: z.string(),
  primaryGoal: z.string(),
  subGoals: z.array(z.string()),
  successCriteria: z.array(z.string()),
  constraints: z.array(z.string()),
  assumptions: z.array(z.string()),
  domain: z.enum(['analytical', 'planning', 'communication', 'problem_solving', 'general']),
  complexity: z.enum(['simple', 'moderate', 'complex']),
});

export type GoalState = z.infer<typeof GoalStateSchema>;

/**
 * Zod schema for ambiguity report
 */
export const AmbiguityReportSchema = z.object({
  hasAmbiguities: z.boolean(),
  ambiguities: z.array(z.object({
    question: z.string(),
    reason: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'blocking']),
    defaultAssumption: z.string().optional(),
  })),
  requiresClarification: z.boolean(),
  canProceedWithAssumptions: z.boolean(),
});

export type AmbiguityReport = z.infer<typeof AmbiguityReportSchema>;

/**
 * Complete Goal Engine output schema
 */
export const GoalEngineOutputSchema = z.object({
  goal_state: GoalStateSchema,
  ambiguity_report: AmbiguityReportSchema,
  processing_notes: z.string().optional(),
});

export type GoalEngineOutput = z.infer<typeof GoalEngineOutputSchema>;

/**
 * Goal Engine result (public interface)
 */
export interface GoalEngineResult {
  goalId: string;
  primaryGoal: string;
  subGoals: string[];
  successCriteria: string[];
  constraints: string[];
  assumptions: string[];
  domain: DomainType;
  complexity: ComplexityTier;
  ambiguities: string[];
  requiresClarification: boolean;
}

/**
 * Goal Engine configuration
 */
export interface GoalEngineConfig {
  llmProvider: AIModel;
  /**
   * System prompt for goal extraction.
   * Use SystemPromptProvider for production (secrets manager).
   */
  systemPrompt?: string | SystemPromptProvider;
  debug?: boolean;
}

// ============================================================================
// GOAL ENGINE CLASS
// ============================================================================

export class GoalEngine {
  private readonly llmProvider: AIModel;
  private readonly systemPromptSource?: string | SystemPromptProvider;
  private readonly debug: boolean;
  private cachedSystemPrompt: string | null = null;

  constructor(llmProvider: AIModel, config?: Partial<GoalEngineConfig>) {
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
    } else if (process.env.GOAL_ENGINE_SYSTEM_PROMPT) {
      prompt = process.env.GOAL_ENGINE_SYSTEM_PROMPT;
    } else {
      prompt = this.getDefaultSystemPrompt();
    }

    this.cachedSystemPrompt = prompt;
    return prompt;
  }

  /**
   * Default system prompt from MIMIC v2.8 Goal Agent specification
   * Use SystemPromptProvider to override via secrets manager in production
   */
  private getDefaultSystemPrompt(): string {
    return `## UPDATED GOAL AGENT - MIMIC v2.8

You extract, interpret, and structure user goals from their input. Your role is to transform vague intentions into clear, structured goal states and determine whether the goal is clear enough for planning or needs clarification. You focus ONLY on cognitive goal interpretation.

### CORE RESPONSIBILITIES

Your primary responsibilities are to understand what the user truly wants to achieve by analyzing both explicit statements and implicit needs, structure the goal into clear components including objectives, success criteria, and constraints, assess the clarity and completeness of the extracted goal by identifying what is defined versus what is missing.

### GOAL ANALYSIS PROCESS

Think through each goal systematically using structured reasoning.

First, analyze what the user is trying to achieve by identifying explicit statements versus implicit needs, determining the domain context and relevant field, establishing current baseline metrics and existing situation, assessing complexity from simple to complex, and reviewing session history for previous interactions by invoking the memory query tools.

Second, decompose the goal into components by identifying the primary objective as the main goal, breaking down sub-objectives that support the goal, **understanding team structure and stakeholder dynamics**, defining what success looks like in terms of outcomes, recognizing constraints including limitations, and noting assumptions you're making to fill gaps.

Third, assess completeness by identifying elements that are clearly defined, elements that require clarification, missing information that creates planning gaps, and documenting what is known versus unknown.

Fourth, make your routing decision based on goal completeness where undefined critical elements require clarification, well-defined core components enable planning, and fundamental ambiguity necessitates human intervention.

### IMMEDIATE VALUE PROVISION

While gathering clarification details, provide immediate actionable insights or general principles relevant to the goal domain. This demonstrates expertise and gives the user value even during the clarification phase.

### OUTPUT FORMAT

Provide your analysis in natural language, explaining your goal interpretation and reasoning. Then output the required JSON structure:

{  
  "session": {
    "id": "<session_id>",
    "iteration": "<iteration>",
    "agent_sequence": "<agent_sequence>"
  },
  "reasoning": "Why this routing was chosen based on goal completeness and definition quality",
  "sourceAgent": "goal",
  "goal_state": {
    "goal_id": "goal-<session_id>-1",
    "primary_goal": "Main objective the user wants to achieve",
    "sub_goals": [
      "Supporting objectives that contribute to the primary goal"
    ],
    "success_criteria": [
      "Specific, measurable outcomes that define success"
    ],
    "constraints": [
      "Limitations, requirements or boundaries"
    ],
    "assumptions": [
      "Assumptions made to fill information gaps"
    ],
    "domain": "Field or context area",
    "complexity": "simple|moderate|complex",
    "related_goal_ids": [
      "goal-previous-session-id-1"
    ],
    "goal_status": "active"
  },
  "ambiguity_report": {
    "clear_elements": [
      "Aspects that are well-defined"
    ],
    "unclear_elements": [
      "Aspects needing clarification"
    ],
    "missing_information": [
      "Critical gaps in requirements"
    ],
    "baseline_gaps": ["Current state metrics or context needed"]
  }
}


### GOAL INTERPRETATION EXAMPLES

When a user says "I need to analyze our Q4 sales data to find growth opportunities", think: This is an analytical goal with a specific timeframe and clear objective. The primary goal is identifying growth opportunities through sales data analysis. The domain is sales analytics, and the timeframe is Q4. Success criteria can be inferred as actionable recommendations for growth. The main constraint is working with existing Q4 data. Minor ambiguity exists around what constitutes "growth opportunities" but this is addressable during planning. Route to planning because the core objective, domain, and timeframe are well-defined.

When a user says "Help me get organized", think: This is an extremely vague procedural goal with undefined scope. The domain could be personal organization, professional workflow, digital files, or physical spaces. No success criteria are provided - organized how? To what standard? The timeframe is undefined, and there are no specified constraints. Multiple conflicting interpretations are possible. This requires clarification to understand what needs organizing, current challenges, desired outcomes, and success measures before any meaningful planning can occur.

When a user says "I want to understand our customer churn, figure out why it's increasing, and create a plan to reduce it by 20% next quarter", think: This is a complex compound goal with three distinct phases: analysis (understand churn), investigation (why increasing), and planning (reduction strategy). The domain is customer analytics and retention. Success criteria are clearly specified (20% reduction) with a definite timeline (next quarter). Constraints include working with existing customer data and implementing within the quarterly timeframe. Despite the complexity, all essential components are well-defined. Route to planning because objectives, success metrics, timeline, and domain are clearly established.

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
- Focus exclusively on goal extraction and interpretation - your core cognitive responsibility
- Leverage memory_context to understand user patterns and successful goal structures
- Break complex goals into clear sub-components that can be individually addressed
- Identify both explicit statements and implicit needs in the user's request
- Provide specific success criteria whenever possible, even if you need to infer them
- Flag ambiguities even when routing to planning so they can be addressed
- Consider the user's domain and context when interpreting vague statements

Don't:
- Make too many assumptions without flagging them as needing validation
- Route to planning when critical success criteria are undefined or essential information is missing
- Ignore critical missing information just to avoid sending to clarification
- Create overly complex goal structures for simple requests
- Process or execute the goal yourself - your job is to understand and structure it

Remember that your goal extraction sets the foundation for the entire cognitive process. A well-structured goal leads to effective planning and execution, while a poorly understood goal cascades problems through the system. When in doubt, it's better to seek clarification than to proceed with assumptions about undefined elements.`;
  }

  /**
   * Execute goal extraction and structuring (returns JSON string for tool interface)
   */
  async execute(
    query: string,
    sessionId: string,
    activeGoals?: string
  ): Promise<string> {
    const result = await this.extractGoals(query, sessionId, activeGoals);
    return JSON.stringify(result);
  }

  /**
   * Extract goals with full structured output
   */
  async extractGoals(
    query: string,
    sessionId: string,
    activeGoals?: string
  ): Promise<GoalEngineResult> {
    const systemPrompt = await this.getSystemPrompt();
    const userMessage = this.buildUserMessage(query, activeGoals);

    try {
      const result = await generateText({
        model: this.llmProvider,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.3,
      });

      if (this.debug) {
        console.log('[GoalEngine] Raw LLM response:', result.text);
      }

      // Parse and validate output
      const output = this.parseOutput(result.text, sessionId);
      return this.transformToResult(output);
    } catch (error) {
      if (this.debug) {
        console.error('[GoalEngine] Extraction failed:', error);
      }

      // Return fallback result
      return this.createFallbackResult(query, sessionId);
    }
  }

  /**
   * Build the user message for goal extraction
   */
  private buildUserMessage(query: string, activeGoals?: string): string {
    const parts: string[] = [];

    parts.push('## User Query');
    parts.push(query);

    if (activeGoals) {
      parts.push('');
      parts.push('## Active Goals Context');
      parts.push(activeGoals);
    }

    parts.push('');
    parts.push('---');
    parts.push('Extract and structure the goals from this query. Respond with valid JSON only.');

    return parts.join('\n');
  }

  /**
   * Parse LLM output into structured GoalEngineOutput
   */
  private parseOutput(text: string, sessionId: string): GoalEngineOutput {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure goalId is set
    if (parsed.goal_state && !parsed.goal_state.goalId) {
      parsed.goal_state.goalId = `goal-${sessionId}-${Date.now()}`;
    }

    return GoalEngineOutputSchema.parse(parsed);
  }

  /**
   * Transform GoalEngineOutput to GoalEngineResult
   */
  private transformToResult(output: GoalEngineOutput): GoalEngineResult {
    return {
      ...output.goal_state,
      ambiguities: output.ambiguity_report.ambiguities.map(a => a.question),
      requiresClarification: output.ambiguity_report.requiresClarification,
    };
  }

  /**
   * Create fallback result when extraction fails
   */
  private createFallbackResult(query: string, sessionId: string): GoalEngineResult {
    return {
      goalId: `goal-${sessionId}-${Date.now()}`,
      primaryGoal: query.length > 100 ? query.substring(0, 100) + '...' : query,
      subGoals: [],
      successCriteria: ['Complete the requested task'],
      constraints: [],
      assumptions: ['User query is complete and unambiguous'],
      domain: 'general',
      complexity: 'moderate',
      ambiguities: [],
      requiresClarification: false,
    };
  }
}