/**
 * Reflection Engine - Meta-cognitive analysis and learning
 *
 * @private - Proprietary MIMIC component
 *
 * Responsibilities:
 * - Perform meta-cognitive analysis of cognitive processing traces
 * - Identify patterns in decision-making effectiveness
 * - Analyze routing efficiency and system performance
 * - Generate actionable insights for process optimization
 * - Extract learnings for future cognitive sessions
 *
 * Output Schema extracted from n8n workflow:
 * - reflection_summary with key_insights[] and goal_journey_analysis[]
 * - improvement_recommendations[]
 */

import { generateText } from 'ai';
import { z } from 'zod';
import { AIModel, SystemPromptProvider } from '../orchestrator';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Insight category
 */
export type InsightCategory =
  | 'decision_making'
  | 'routing_efficiency'
  | 'tool_usage'
  | 'memory_access'
  | 'reasoning'
  | 'goal_tracking'
  | 'error_handling';

/**
 * Impact assessment
 */
export type ImpactLevel = 'positive' | 'negative' | 'neutral';

/**
 * Applicability scope
 */
export type Applicability = 'immediate' | 'future_sessions' | 'both';

/**
 * Recommendation priority
 */
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Reflection insight
 */
export interface ReflectionInsight {
  insightId: string;
  category: InsightCategory;
  observation: string;
  impact: ImpactLevel;
  evidence: string;
  recommendation: string;
  applicability: Applicability;
}

/**
 * Goal journey analysis
 */
export interface GoalJourneyAnalysis {
  goalId: string;
  goalDescription: string;
  progressStatus: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  effectiveStrategies: string[];
  ineffectiveStrategies: string[];
  pivotPoints: string[];
  lessonsLearned: string[];
}

/**
 * Improvement recommendation
 */
export interface ImprovementRecommendation {
  recommendationId: string;
  area: string;
  currentState: string;
  desiredState: string;
  actionItems: string[];
  priority: RecommendationPriority;
  expectedImpact: string;
}

/**
 * Reflect input parameters
 */
export interface ReflectParams {
  query: string;
  response: string;
  sessionId: string;
  toolCalls: Array<{ name: string; args: unknown }>;
  evaluationResults?: unknown;
  activeGoals?: string[];
}

/**
 * Zod schema for reflection insight
 */
export const ReflectionInsightSchema = z.object({
  insightId: z.string(),
  category: z.enum([
    'decision_making',
    'routing_efficiency',
    'tool_usage',
    'memory_access',
    'reasoning',
    'goal_tracking',
    'error_handling',
  ]),
  observation: z.string(),
  impact: z.enum(['positive', 'negative', 'neutral']),
  evidence: z.string(),
  recommendation: z.string(),
  applicability: z.enum(['immediate', 'future_sessions', 'both']),
});

/**
 * Zod schema for goal journey analysis
 */
export const GoalJourneyAnalysisSchema = z.object({
  goalId: z.string(),
  goalDescription: z.string(),
  progressStatus: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),
  effectiveStrategies: z.array(z.string()),
  ineffectiveStrategies: z.array(z.string()),
  pivotPoints: z.array(z.string()),
  lessonsLearned: z.array(z.string()),
});

/**
 * Zod schema for improvement recommendation
 */
export const ImprovementRecommendationSchema = z.object({
  recommendationId: z.string(),
  area: z.string(),
  currentState: z.string(),
  desiredState: z.string(),
  actionItems: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  expectedImpact: z.string(),
});

/**
 * Complete Reflection Engine output schema
 */
export const ReflectionEngineOutputSchema = z.object({
  reflection_summary: z.object({
    key_insights: z.array(ReflectionInsightSchema),
    goal_journey_analysis: z.array(GoalJourneyAnalysisSchema),
    session_effectiveness_score: z.number().min(0).max(1),
    cognitive_efficiency_score: z.number().min(0).max(1),
  }),
  improvement_recommendations: z.array(ImprovementRecommendationSchema),
  process_optimizations: z.array(z.string()),
  learning_enhancements: z.array(z.string()),
  meta_observations: z.string().optional(),
});

export type ReflectionEngineOutput = z.infer<typeof ReflectionEngineOutputSchema>;

/**
 * Reflection Engine result (public interface)
 */
export interface ReflectionEngineResult {
  insights: ReflectionInsight[];
  goalJourneyAnalysis: GoalJourneyAnalysis[];
  recommendations: ImprovementRecommendation[];
  processOptimizations: string[];
  learningEnhancements: string[];
  sessionEffectivenessScore: number;
  cognitiveEfficiencyScore: number;
  reasoning: string;
}

/**
 * Reflection Engine configuration
 */
export interface ReflectionEngineConfig {
  llmProvider: AIModel;
  systemPrompt?: string | SystemPromptProvider;
  debug?: boolean;
}

// ============================================================================
// REFLECTION ENGINE CLASS
// ============================================================================

export class ReflectionEngine {
  private readonly llmProvider: AIModel;
  private readonly systemPromptSource?: string | SystemPromptProvider;
  private readonly debug: boolean;
  private cachedSystemPrompt: string | null = null;

  constructor(llmProvider: AIModel, config?: Partial<ReflectionEngineConfig>) {
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
    } else if (process.env.REFLECTION_ENGINE_SYSTEM_PROMPT) {
      prompt = process.env.REFLECTION_ENGINE_SYSTEM_PROMPT;
    } else {
      prompt = this.getPlaceholderSystemPrompt();
    }

    this.cachedSystemPrompt = prompt;
    return prompt;
  }

  /**
   * Placeholder system prompt for development/testing
   */
  private getPlaceholderSystemPrompt(): string {
    return `You are the Reflection Engine for MIMIC, a specialized cognitive module responsible for meta-cognitive analysis and learning extraction.

## Your Responsibilities

1. **Pattern Analysis**: Identify patterns in cognitive processing
2. **Decision Effectiveness**: Analyze quality of decisions made
3. **Routing Efficiency**: Assess efficiency of cognitive routing
4. **Tool Usage Analysis**: Evaluate tool selection and effectiveness
5. **Goal Journey Analysis**: Track progress toward goals
6. **Learning Extraction**: Extract learnings for future sessions
7. **Improvement Recommendations**: Suggest concrete improvements

## Insight Categories

- **decision_making**: Quality and timeliness of decisions
- **routing_efficiency**: Efficiency of cognitive routing paths
- **tool_usage**: Effectiveness of tool selection and use
- **memory_access**: Quality of memory utilization
- **reasoning**: Logical reasoning quality
- **goal_tracking**: Goal progress and management
- **error_handling**: Response to errors and edge cases

## Impact Levels

- **positive**: Contributed to success
- **negative**: Hindered performance
- **neutral**: No significant impact

## Output Format

Respond with a JSON object containing:
{
  "reflection_summary": {
    "key_insights": [
      {
        "insightId": "insight-1",
        "category": "decision_making",
        "observation": "what was observed",
        "impact": "positive|negative|neutral",
        "evidence": "supporting evidence",
        "recommendation": "what to do differently",
        "applicability": "immediate|future_sessions|both"
      }
    ],
    "goal_journey_analysis": [
      {
        "goalId": "goal-id",
        "goalDescription": "what the goal was",
        "progressStatus": "completed|in_progress|blocked|not_started",
        "effectiveStrategies": ["strategy 1"],
        "ineffectiveStrategies": [],
        "pivotPoints": ["when we changed approach"],
        "lessonsLearned": ["lesson 1"]
      }
    ],
    "session_effectiveness_score": 0.0-1.0,
    "cognitive_efficiency_score": 0.0-1.0
  },
  "improvement_recommendations": [
    {
      "recommendationId": "rec-1",
      "area": "area of improvement",
      "currentState": "current situation",
      "desiredState": "target situation",
      "actionItems": ["action 1"],
      "priority": "low|medium|high|critical",
      "expectedImpact": "what improvement this would bring"
    }
  ],
  "process_optimizations": ["optimization 1"],
  "learning_enhancements": ["learning 1"]
}`;
  }

  /**
   * Execute meta-cognitive reflection
   */
  async reflect(params: ReflectParams): Promise<ReflectionEngineResult> {
    const systemPrompt = await this.getSystemPrompt();
    const userMessage = this.buildUserMessage(params);

    try {
      const result = await generateText({
        model: this.llmProvider,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.4,
      });

      if (this.debug) {
        console.log('[ReflectionEngine] Raw LLM response:', result.text);
      }

      const output = this.parseOutput(result.text, params.sessionId);
      return this.transformToResult(output);
    } catch (error) {
      if (this.debug) {
        console.error('[ReflectionEngine] Reflection failed:', error);
      }

      return this.createFallbackResult();
    }
  }

  /**
   * Build the user message for reflection
   */
  private buildUserMessage(params: ReflectParams): string {
    const parts: string[] = [];

    parts.push('## Original Query');
    parts.push(params.query);

    parts.push('');
    parts.push('## MIMIC Response');
    parts.push(params.response);

    parts.push('');
    parts.push('## Cognitive Processing Trace');
    parts.push(`Total Tool Calls: ${params.toolCalls.length}`);
    if (params.toolCalls.length > 0) {
      parts.push('Tool Sequence:');
      params.toolCalls.forEach((call, index) => {
        parts.push(`  ${index + 1}. ${call.name}`);
      });
    }

    if (params.evaluationResults) {
      parts.push('');
      parts.push('## Evaluation Results');
      parts.push(JSON.stringify(params.evaluationResults, null, 2));
    }

    if (params.activeGoals && params.activeGoals.length > 0) {
      parts.push('');
      parts.push('## Active Goals');
      params.activeGoals.forEach((goal) => {
        parts.push(`- ${goal}`);
      });
    }

    parts.push('');
    parts.push('---');
    parts.push('Perform meta-cognitive reflection on this session. Respond with valid JSON only.');

    return parts.join('\n');
  }

  /**
   * Parse LLM output into ReflectionEngineOutput
   */
  private parseOutput(text: string, sessionId: string): ReflectionEngineOutput {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure IDs are set
    if (parsed.reflection_summary?.key_insights) {
      parsed.reflection_summary.key_insights = parsed.reflection_summary.key_insights.map(
        (insight: Record<string, unknown>, index: number) => ({
          ...insight,
          insightId: insight.insightId || `insight-${sessionId}-${index}`,
        })
      );
    }

    if (parsed.improvement_recommendations) {
      parsed.improvement_recommendations = parsed.improvement_recommendations.map(
        (rec: Record<string, unknown>, index: number) => ({
          ...rec,
          recommendationId: rec.recommendationId || `rec-${sessionId}-${index}`,
        })
      );
    }

    return ReflectionEngineOutputSchema.parse(parsed);
  }

  /**
   * Transform ReflectionEngineOutput to ReflectionEngineResult
   */
  private transformToResult(output: ReflectionEngineOutput): ReflectionEngineResult {
    return {
      insights: output.reflection_summary.key_insights,
      goalJourneyAnalysis: output.reflection_summary.goal_journey_analysis,
      recommendations: output.improvement_recommendations,
      processOptimizations: output.process_optimizations,
      learningEnhancements: output.learning_enhancements,
      sessionEffectivenessScore: output.reflection_summary.session_effectiveness_score,
      cognitiveEfficiencyScore: output.reflection_summary.cognitive_efficiency_score,
      reasoning: output.meta_observations || 'Reflection completed successfully',
    };
  }

  /**
   * Create fallback result when reflection fails
   */
  private createFallbackResult(): ReflectionEngineResult {
    return {
      insights: [],
      goalJourneyAnalysis: [],
      recommendations: [],
      processOptimizations: [],
      learningEnhancements: [],
      sessionEffectivenessScore: 0.5,
      cognitiveEfficiencyScore: 0.5,
      reasoning: 'Fallback reflection due to processing error',
    };
  }
}