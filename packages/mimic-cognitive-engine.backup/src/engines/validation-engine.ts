/**
 * Validation Engine - Assess feasibility and completeness
 *
 * @private - Proprietary MIMIC component
 *
 * Responsibilities:
 * - Assess feasibility of goals and plans
 * - Evaluate completeness and quality
 * - Check resource availability and constraint satisfaction
 * - Identify risks and potential issues
 * - Provide pass/conditional/fail assessment
 *
 * Output Schema extracted from n8n workflow:
 * - validation_result: pass | conditional | fail
 * - validation_details with scores
 * - issues[] with severity and recommendations
 */

import { generateText } from 'ai';
import { z } from 'zod';
import { AIModel, SystemPromptProvider } from '../orchestrator';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Validation result status
 */
export type ValidationStatus = 'pass' | 'conditional' | 'fail';

/**
 * Issue severity level
 */
export type IssueSeverity = 'info' | 'warning' | 'error' | 'blocker';

/**
 * Validation issue
 */
export interface ValidationIssue {
  issueId: string;
  category: 'feasibility' | 'completeness' | 'quality' | 'resource' | 'constraint' | 'risk';
  severity: IssueSeverity;
  description: string;
  recommendation: string;
  affectedSteps?: string[];
}

/**
 * Validation aspect result
 */
export interface ValidationAspect {
  aspect: string;
  valid: boolean;
  score: number;
  reasoning: string;
  suggestions: string[];
}

/**
 * Zod schema for validation issue
 */
export const ValidationIssueSchema = z.object({
  issueId: z.string(),
  category: z.enum(['feasibility', 'completeness', 'quality', 'resource', 'constraint', 'risk']),
  severity: z.enum(['info', 'warning', 'error', 'blocker']),
  description: z.string(),
  recommendation: z.string(),
  affectedSteps: z.array(z.string()).optional(),
});

/**
 * Zod schema for validation details
 */
export const ValidationDetailsSchema = z.object({
  feasibilityScore: z.number().min(0).max(1),
  completenessScore: z.number().min(0).max(1),
  qualityScore: z.number().min(0).max(1),
  resourceAvailability: z.number().min(0).max(1),
  constraintSatisfaction: z.number().min(0).max(1),
  overallConfidence: z.number().min(0).max(1),
});

export type ValidationDetails = z.infer<typeof ValidationDetailsSchema>;

/**
 * Complete Validation Engine output schema
 */
export const ValidationEngineOutputSchema = z.object({
  validation_result: z.enum(['pass', 'conditional', 'fail']),
  validation_details: ValidationDetailsSchema,
  issues: z.array(ValidationIssueSchema),
  recommendations: z.array(z.string()),
  canProceed: z.boolean(),
  requiresModification: z.boolean(),
  processing_notes: z.string().optional(),
});

export type ValidationEngineOutput = z.infer<typeof ValidationEngineOutputSchema>;

/**
 * Validation Engine result (public interface)
 */
export interface ValidationEngineResult {
  status: ValidationStatus;
  details: ValidationDetails;
  issues: ValidationIssue[];
  recommendations: string[];
  canProceed: boolean;
  requiresModification: boolean;
}

/**
 * Validation Engine configuration
 */
export interface ValidationEngineConfig {
  llmProvider: AIModel;
  systemPrompt?: string | SystemPromptProvider;
  debug?: boolean;
}

// ============================================================================
// VALIDATION ENGINE CLASS
// ============================================================================

export class ValidationEngine {
  private readonly llmProvider: AIModel;
  private readonly systemPromptSource?: string | SystemPromptProvider;
  private readonly debug: boolean;
  private cachedSystemPrompt: string | null = null;

  constructor(llmProvider: AIModel, config?: Partial<ValidationEngineConfig>) {
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
    } else if (process.env.VALIDATION_ENGINE_SYSTEM_PROMPT) {
      prompt = process.env.VALIDATION_ENGINE_SYSTEM_PROMPT;
    } else {
      prompt = this.getDefaultSystemPrompt();
    }

    this.cachedSystemPrompt = prompt;
    return prompt;
  }

  /**
   * Default system prompt from MIMIC v2.8 Validation Agent specification
   * Use SystemPromptProvider to override via secrets manager in production
   */
  private getDefaultSystemPrompt(): string {
    return `## UPDATED VALIDATION AGENT - MIMIC v2.8

You validate plans against goals, constraints, and quality standards. Your role is to ensure plans are complete, feasible, and optimized before execution while determining the optimal next step in the cognitive process. You focus ONLY on cognitive validation analysis - memory and metrics operations are handled by dedicated service agents.

### CORE RESPONSIBILITIES

Your primary responsibilities are to verify plans achieve all stated goals and success criteria, assess feasibility considering resources, time, and capabilities, identify risks and quality issues that could impact execution, and determine whether plans are ready for evaluation or need revision.

**For validation decisions, prioritize:**
1. Review cognitive_content from planning agent for strategy validation
2. Check cognitive_content from goal agent for goal-plan alignment
3. Analyze blocking_issues to identify validation risks
4. Assess completion_status to ensure work is validation-ready
5. Use confidence_level to gauge validation priority

### ACTIVE GOALS CONTEXT

You receive active goals context via the active_goals parameter:
- **goal_id**: Unique identifier for goals being validated
- **goal_status**: Current state of each goal

Use this context to:
1. Validate plans against specific goal requirements
2. Check goal-constraint alignment
3. Assess whether plans adequately address all active goals
4. Identify goal coverage gaps in validation

### MATHEMATICAL FEASIBILITY VERIFICATION

**Before detailed validation, verify basic mathematical constraints:**

**SURVIVAL CONSTRAINT CHECKS:**
- Timeline Reality: Required timeline ≤ Available runway/timeline
- Resource Reality: Required resources ≤ Available resources  
- Dependency Logic: Prerequisites can be completed in sequence within constraints

**If any survival constraint fails:**
- Mark validation_result as "fail"
- Route to "hitl" immediately
- Flag as "mathematical_impossibility" in issues

**Examples of Mathematical Impossibility:**
- 6 months runway + 18 month timeline requirement = impossible
- $15M funding need + no funding secured + 3 month deadline = impossible
- Required team of 10 + team capacity of 3 + no hiring budget = impossible

### CONTRADICTION DETECTION AND ANALYSIS

**Before proceeding with feasibility analysis, systematically identify data contradictions:**

**STAKEHOLDER ALIGNMENT CONTRADICTIONS:**
- Do different teams/departments report conflicting assessments of the same issue?
- Are user complaints contradicted by system metrics or team claims?
- Do quantitative metrics align with qualitative feedback?

**DATA-REALITY CONTRADICTIONS:**
- Do performance metrics contradict user experience reports?
- Are claimed capabilities inconsistent with actual outcomes?
- Do engagement metrics conflict with satisfaction indicators?

**ASSUMPTION-EVIDENCE CONTRADICTIONS:**
- Are plan assumptions supported by available evidence?
- Do stated constraints conflict with proposed solutions?
- Are success criteria realistic given identified challenges?

**If significant contradictions detected:**
- Flag as "data_contradiction" or "stakeholder_contradiction" in issues
- **Route to clarification for contradiction resolution before proceeding**
- Recommend investigation priorities to resolve conflicting information
- Question validity of current measurement and assessment approaches

**Contradiction Examples:**
- "Engagement metrics look normal" + "Students complain content is boring" = measurement validity issue
- "All teams say their area is fine" + "Overall performance declining" = systemic blindspot
- "Previous fixes had minimal impact" + "Teams confident in current approach" = approach validity issue

### RISK SEVERITY CLASSIFICATION

**CRITICAL RISKS (Auto-fail validation):**
- Mathematical impossibility detected
- Survival constraints violated (runway, resources, legal deadlines)
- Plan threatens organizational continuity
- Fundamental constraint violations cannot be resolved
- **Major unresolved contradictions that undermine plan foundation**

**HIGH RISKS (Require mitigation before passing):**
- Timeline very tight but theoretically possible
- Resource constraints significant but potentially solvable
- Dependencies complex but manageable with effort
- **Minor contradictions that need clarification but don't invalidate approach**

**MEDIUM/LOW RISKS (Note but allow progression):**
- Optimization opportunities exist
- Minor inefficiencies or delays possible
- Process improvements recommended

### VALIDATION ANALYSIS PROCESS

Think through validation systematically.

**First, conduct mathematical feasibility verification** using the survival constraint checks above. If any mathematical impossibility is detected, immediately route to HITL.

**Second, perform contradiction detection analysis** using the framework above. If major contradictions are found that undermine the plan foundation, route to clarification for resolution.

**Third, assess goal alignment** by checking if each goal component is addressed, verifying success criteria are achievable through the proposed plan, confirming all requirements are covered, and identifying any gaps in goal coverage.

**Fourth, analyze feasibility** by comparing required versus available resources, calculating if time estimates fit within constraints, checking if dependencies flow logically, and assessing if capabilities are sufficient for execution.

**Fifth, evaluate risks and quality** by identifying critical failure points, checking if quality standards are met, reviewing for optimization opportunities, and comparing against successful patterns from memory context.

**Sixth, determine routing** based on validation results where successful validation enables progress, identified issues require addressing, and systemic problems need broader attention.

### OUTPUT FORMAT

Provide your validation analysis in natural language, explaining what passed, what failed, and why. Then output the required JSON structure:

{
  "session": {
    "id": "<session_id>",
    "iteration": "<iteration>",
    "agent_sequence": "<agent_sequence>"
  },
  "reasoning": "Why this routing was chosen based on validation results and identified issues",
  "sourceAgent": "validation",
  "active_goals": "<active_goals>",
  "validation_result": "pass|conditional|fail",
  "validated_goals": ["goal_ids_covered_by_validation"],
  "validation_details": {
    "goal_alignment": {
      "gaps": [
        "unaddressed goal elements"
      ],
      "coverage_assessment": "complete|partial|insufficient",
      "goal_coverage_map": [
        {
          "goal_id": "goal_1",
          "coverage_status": "complete|partial|missing"
        }
      ]
    },
    "feasibility": {
      "resource_check": "adequate|insufficient|unclear",
      "time_check": "realistic|tight|unrealistic",
      "capability_check": "sufficient|marginal|insufficient"
    },
    "quality_assessment": {
      "meets_standards": true,
      "optimization_potential": "low|medium|high",
      "compared_to_patterns": "above_average|average|below_average"
    },
    "risk_assessment": {
      "level": "critical|high|medium|low",
      "critical_risks": [
        "identified risks that could cause failure"
      ],
      "mitigation_status": "addressed|partial|missing"
    },
    "contradiction_assessment": {
      "contradictions_found": true,
      "contradiction_types": ["stakeholder_alignment|data_reality|assumption_evidence"],
      "impact_level": "critical|major|minor",
      "resolution_required": true
    }
  },
  "issues": [
    {
      "severity": "critical|major|minor",
      "type": "mathematical_impossibility|data_contradiction|stakeholder_contradiction|goal_gap|feasibility|quality|risk",
      "description": "specific issue identified",
      "impact": "consequence if unaddressed",
      "recommendation": "how to address this issue"
    }
  ],
  "recommendations": [
    "specific improvements for plan enhancement"
  ]
}

### VALIDATION STRATEGIES

When validating analytical plans, think: Check if all analysis objectives are covered in the proposed steps. Verify data sources are accessible and reliable. Ensure synthesis steps will transform analysis into actionable insights. Confirm deliverables match stakeholder needs. Analytical plans typically have lower execution risk but require thoroughness verification.

When validating technical implementation plans, think: Safety procedures are critical - never pass plans without adequate rollback mechanisms. Testing phases must exist before production changes. Data integrity protections are non-negotiable. Timeline estimates must align with actual resource constraints. Technical plans require careful risk scrutiny.

**When validating plans with contradictory information, think**: Before addressing the plan itself, the contradictions must be resolved. If engagement metrics are normal but users complain, investigate which data source is more reliable. If teams claim no issues but performance is declining, identify what's being overlooked. Route to clarification for contradiction resolution before plan validation.

When finding repeated validation issues, think: The same problem appearing multiple times indicates a systemic gap in the planning process. This isn't just about fixing this specific plan but improving how plans are created. Consider routing to reflection for system-level learning and process improvement.

### VALIDATION EXAMPLES

When reviewing a plan to "optimize database performance by 40%", think: Goal alignment check shows the plan addresses performance but lacks specific measurement criteria. Feasibility assessment reveals adequate technical capability but unclear timeline. Risk assessment identifies potential downtime during optimization. Issues: missing success metrics, vague timeline. Recommendation: clarify measurement approach and define implementation phases.

When validating a plan for "market research and strategy development", think: Goal coverage is complete with clear research objectives and strategy components. Feasibility shows adequate resources and realistic timeline. Quality comparison with similar successful plans shows good structure. Minor optimization: consider adding competitive analysis phase. Overall assessment: pass with minor recommendations.

When examining a plan with multiple critical gaps, think: Plan fails to address 3 of 5 stated goals, timeline is unrealistic given resource constraints, and no risk mitigation is included. This requires fundamental replanning rather than minor adjustments. Route to planning with specific guidance on missing elements.

When examining a biotech pivot requiring 18 months with only 6 months runway, think: This is a mathematical impossibility - the company will cease to exist before seeing results. No amount of planning optimization can solve a fundamental timeline constraint violation. This requires immediate escalation, not planning refinement. Route to HITL with mathematical impossibility flag.

**When examining an education platform with "normal engagement metrics" but "boring content complaints", think**: This is a fundamental data contradiction that undermines any intervention plan. Either the engagement metrics are measuring the wrong things, or the complaints don't represent the real issue. Before validating any content improvement plan, this contradiction must be investigated and resolved. Route to clarification for contradiction resolution.

### DOS AND DON'TS

Do:
- Focus exclusively on plan validation and quality assessment - your core cognitive responsibility
- **Conduct mathematical feasibility checks before detailed validation**
- **Systematically check for contradictions before proceeding with plan assessment**
- Leverage memory_context to understand validation standards and successful patterns
- Thoroughly check goal alignment before assessing other factors - plans must achieve objectives
- Assess feasibility realistically based on actual resources and constraints
- Identify all critical risks that could cause plan failure
- **Immediately flag mathematical impossibilities and survival constraint violations**
- **Route to clarification when major contradictions undermine plan foundation**
- Provide constructive recommendations for improvement rather than just criticism
- Compare plans against successful patterns from memory context for quality benchmarking
- Route failed validations with specific guidance on what needs improvement

Don't:
- **Pass plans with mathematical impossibilities or survival constraint violations**
- **Proceed with plan validation when major contradictions exist in the underlying data**
- Generate memory_requests, memory_operations, or memory_payload - these are handled by service agents
- Create metrics_payload - this is handled by the Metrics Payload Agent
- Pass plans with unmitigated critical risks or major goal gaps
- **Treat survival constraints as optimization problems**
- **Ignore contradictions between different information sources**
- Ignore resource constraints in feasibility assessments
- Skip validation steps to speed up the process
- Be overly critical of minor optimization opportunities
- Route to evaluation if major issues remain unresolved
- Validate the same failed plan repeatedly without substantive changes

Remember that validation is the quality gate before execution. Your thorough assessment prevents wasted effort and failed outcomes. Balance being thorough enough to catch critical issues with being practical about what's truly necessary for success. Always provide clear, actionable feedback that enables improvement rather than just identifying problems. **When survival is at stake, prioritize escalation over optimization. When contradictions exist, prioritize resolution over implementation.**`;
  }

  /**
   * Execute validation assessment (returns JSON string for tool interface)
   */
  async execute(
    query: string,
    sessionId: string,
    activeGoals?: string
  ): Promise<string> {
    const result = await this.validate(query, sessionId, activeGoals);
    return JSON.stringify(result);
  }

  /**
   * Validate with full structured output
   */
  async validate(
    query: string,
    sessionId: string,
    activeGoals?: string
  ): Promise<ValidationEngineResult> {
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
        console.log('[ValidationEngine] Raw LLM response:', result.text);
      }

      const output = this.parseOutput(result.text, sessionId);
      return this.transformToResult(output);
    } catch (error) {
      if (this.debug) {
        console.error('[ValidationEngine] Validation failed:', error);
      }

      return this.createFallbackResult();
    }
  }

  /**
   * Build the user message for validation
   */
  private buildUserMessage(query: string, activeGoals?: string): string {
    const parts: string[] = [];

    parts.push('## Content to Validate');
    parts.push(query);

    if (activeGoals) {
      parts.push('');
      parts.push('## Goals/Plan Context');
      parts.push(activeGoals);
    }

    parts.push('');
    parts.push('---');
    parts.push('Validate the above content. Respond with valid JSON only.');

    return parts.join('\n');
  }

  /**
   * Parse LLM output into structured ValidationEngineOutput
   */
  private parseOutput(text: string, sessionId: string): ValidationEngineOutput {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure issue IDs are set
    if (parsed.issues) {
      parsed.issues = parsed.issues.map((issue: Record<string, unknown>, index: number) => ({
        ...issue,
        issueId: issue.issueId || `issue-${sessionId}-${index}`,
      }));
    }

    return ValidationEngineOutputSchema.parse(parsed);
  }

  /**
   * Transform ValidationEngineOutput to ValidationEngineResult
   */
  private transformToResult(output: ValidationEngineOutput): ValidationEngineResult {
    return {
      status: output.validation_result,
      details: output.validation_details,
      issues: output.issues,
      recommendations: output.recommendations,
      canProceed: output.canProceed,
      requiresModification: output.requiresModification,
    };
  }

  /**
   * Create fallback result when validation fails
   */
  private createFallbackResult(): ValidationEngineResult {
    return {
      status: 'conditional',
      details: {
        feasibilityScore: 0.5,
        completenessScore: 0.5,
        qualityScore: 0.5,
        resourceAvailability: 0.5,
        constraintSatisfaction: 0.5,
        overallConfidence: 0.3,
      },
      issues: [
        {
          issueId: 'validation-failure',
          category: 'quality',
          severity: 'warning',
          description: 'Validation engine encountered an error',
          recommendation: 'Manual review recommended',
        },
      ],
      recommendations: ['Manual validation recommended due to processing error'],
      canProceed: true,
      requiresModification: false,
    };
  }
}