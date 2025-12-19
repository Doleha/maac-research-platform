/**
 * Evaluation Engine - Meta-cognitive performance assessment
 *
 * @private - Proprietary MIMIC component
 *
 * Responsibilities:
 * - Evaluate MIMIC's cognitive performance through systematic analysis
 * - Apply exact performance calculation formulas from MAAC framework
 * - Generate standardized assessment scores across dimensions
 *
 * EXACT Metric Formulas (from n8n workflow - DO NOT MODIFY):
 * - task_completion_accuracy = (Requirements_Met / Total_Requirements) × (Goals_Achieved / Total_Goals) × Quality_Factor
 * - contextual_coherence = (Memory_Utilization × 0.4) + (Context_Consistency × 0.4) + (Information_Flow × 0.2)
 * - reasoning_quality = (Decision_Quality × 0.4) + (Evidence_Integration × 0.3) + (Logic_Structure × 0.3)
 * - adaptive_flexibility = (Route_Efficiency × 0.3) + (Iteration_Efficiency × 0.3) + (Strategy_Adaptation × 0.4)
 * - overall_cognitive_score = (Task_Completion × 0.3) + (Contextual_Coherence × 0.25) + (Reasoning_Quality × 0.25) + (Adaptive_Flexibility × 0.2)
 */

import { generateText } from 'ai';
import { z } from 'zod';
import { AIModel, SystemPromptProvider } from '../orchestrator';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Performance scores - EXACT structure from n8n workflow
 */
export interface PerformanceScores {
  taskCompletionAccuracy: number;
  contextualCoherence: number;
  reasoningQuality: number;
  adaptiveFlexibility: number;
  overallCognitiveScore: number;
}

/**
 * Component scores used in formula calculations
 */
export interface ComponentScores {
  // Task Completion components
  requirementsMet: number;
  totalRequirements: number;
  goalsAchieved: number;
  totalGoals: number;
  qualityFactor: number;

  // Contextual Coherence components
  memoryUtilization: number;
  contextConsistency: number;
  informationFlow: number;

  // Reasoning Quality components
  decisionQuality: number;
  evidenceIntegration: number;
  logicStructure: number;

  // Adaptive Flexibility components
  routeEfficiency: number;
  iterationEfficiency: number;
  strategyAdaptation: number;
}

/**
 * Evaluation input parameters
 */
export interface EvaluateParams {
  query: string;
  response: string;
  sessionId: string;
  toolCalls: Array<{ name: string; args: unknown }>;
  memoryOperations?: number;
  processingTime?: number;
  cognitiveLoops?: number;
}

/**
 * Zod schema for component scores
 */
export const ComponentScoresSchema = z.object({
  requirementsMet: z.number().min(0),
  totalRequirements: z.number().min(1),
  goalsAchieved: z.number().min(0),
  totalGoals: z.number().min(1),
  qualityFactor: z.number().min(0).max(1),
  memoryUtilization: z.number().min(0).max(1),
  contextConsistency: z.number().min(0).max(1),
  informationFlow: z.number().min(0).max(1),
  decisionQuality: z.number().min(0).max(1),
  evidenceIntegration: z.number().min(0).max(1),
  logicStructure: z.number().min(0).max(1),
  routeEfficiency: z.number().min(0).max(1),
  iterationEfficiency: z.number().min(0).max(1),
  strategyAdaptation: z.number().min(0).max(1),
});

/**
 * Zod schema for LLM component assessment output
 */
export const ComponentAssessmentOutputSchema = z.object({
  componentScores: ComponentScoresSchema,
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  reasoning: z.string(),
});

export type ComponentAssessmentOutput = z.infer<typeof ComponentAssessmentOutputSchema>;

/**
 * Evaluation Engine result (public interface)
 */
export interface EvaluationEngineResult {
  performanceScores: PerformanceScores;
  componentScores: ComponentScores;
  strengths: string[];
  areasForImprovement: string[];
  reasoning: string;
}

/**
 * Evaluation Engine configuration
 */
export interface EvaluationEngineConfig {
  llmProvider: AIModel;
  systemPrompt?: string | SystemPromptProvider;
  debug?: boolean;
}

// ============================================================================
// EVALUATION ENGINE CLASS
// ============================================================================

export class EvaluationEngine {
  private readonly llmProvider: AIModel;
  private readonly systemPromptSource?: string | SystemPromptProvider;
  private readonly debug: boolean;
  private cachedSystemPrompt: string | null = null;

  constructor(llmProvider: AIModel, config?: Partial<EvaluationEngineConfig>) {
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
    } else if (process.env.EVALUATION_ENGINE_SYSTEM_PROMPT) {
      prompt = process.env.EVALUATION_ENGINE_SYSTEM_PROMPT;
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
    return `You are the Evaluation Engine for MIMIC, a specialized cognitive module responsible for assessing cognitive performance.

## Your Responsibility

Analyze the cognitive session and provide component scores that will be used in EXACT formulas to calculate performance metrics.

## Component Score Definitions

### Task Completion Components
- **requirementsMet**: Count of requirements satisfied (integer)
- **totalRequirements**: Total requirements identified (integer, minimum 1)
- **goalsAchieved**: Count of goals completed (integer)
- **totalGoals**: Total goals identified (integer, minimum 1)
- **qualityFactor**: Quality assessment of completion (0-1)

### Contextual Coherence Components (0-1 each)
- **memoryUtilization**: How well past context was used
- **contextConsistency**: Consistency throughout response
- **informationFlow**: Logical flow of information

### Reasoning Quality Components (0-1 each)
- **decisionQuality**: Quality of decisions made
- **evidenceIntegration**: How well evidence was incorporated
- **logicStructure**: Logical structure of reasoning

### Adaptive Flexibility Components (0-1 each)
- **routeEfficiency**: Efficiency of cognitive routing
- **iterationEfficiency**: Efficiency of processing iterations
- **strategyAdaptation**: How well strategy adapted to needs

## Output Format

Respond with a JSON object containing:
{
  "componentScores": {
    "requirementsMet": 3,
    "totalRequirements": 4,
    "goalsAchieved": 2,
    "totalGoals": 2,
    "qualityFactor": 0.85,
    "memoryUtilization": 0.7,
    "contextConsistency": 0.9,
    "informationFlow": 0.8,
    "decisionQuality": 0.85,
    "evidenceIntegration": 0.75,
    "logicStructure": 0.8,
    "routeEfficiency": 0.9,
    "iterationEfficiency": 0.7,
    "strategyAdaptation": 0.8
  },
  "strengths": ["Clear reasoning", "Good memory usage"],
  "areasForImprovement": ["Could improve evidence integration"],
  "reasoning": "Explanation of the assessment..."
}`;
  }

  /**
   * Execute meta-cognitive evaluation
   */
  async evaluate(params: EvaluateParams): Promise<EvaluationEngineResult> {
    const systemPrompt = await this.getSystemPrompt();
    const userMessage = this.buildUserMessage(params);

    try {
      const result = await generateText({
        model: this.llmProvider,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.3,
      });

      if (this.debug) {
        console.log('[EvaluationEngine] Raw LLM response:', result.text);
      }

      const assessment = this.parseOutput(result.text);
      const performanceScores = this.calculatePerformanceScores(assessment.componentScores);

      return {
        performanceScores,
        componentScores: assessment.componentScores,
        strengths: assessment.strengths,
        areasForImprovement: assessment.areasForImprovement,
        reasoning: assessment.reasoning,
      };
    } catch (error) {
      if (this.debug) {
        console.error('[EvaluationEngine] Evaluation failed:', error);
      }

      return this.createFallbackResult();
    }
  }

  /**
   * Build the user message for evaluation
   */
  private buildUserMessage(params: EvaluateParams): string {
    const parts: string[] = [];

    parts.push('## Original Query');
    parts.push(params.query);

    parts.push('');
    parts.push('## MIMIC Response');
    parts.push(params.response);

    parts.push('');
    parts.push('## Tool Calls Made');
    if (params.toolCalls.length > 0) {
      params.toolCalls.forEach((call, index) => {
        parts.push(`${index + 1}. ${call.name}`);
      });
    } else {
      parts.push('No tools were invoked');
    }

    if (params.memoryOperations !== undefined) {
      parts.push('');
      parts.push(`## Memory Operations: ${params.memoryOperations}`);
    }

    if (params.processingTime !== undefined) {
      parts.push('');
      parts.push(`## Processing Time: ${params.processingTime}ms`);
    }

    if (params.cognitiveLoops !== undefined) {
      parts.push('');
      parts.push(`## Cognitive Loops: ${params.cognitiveLoops}`);
    }

    parts.push('');
    parts.push('---');
    parts.push('Evaluate this cognitive session. Respond with valid JSON only.');

    return parts.join('\n');
  }

  /**
   * Parse LLM output into ComponentAssessmentOutput
   */
  private parseOutput(text: string): ComponentAssessmentOutput {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return ComponentAssessmentOutputSchema.parse(parsed);
  }

  /**
   * Calculate performance scores using EXACT formulas from n8n workflow
   * CRITICAL: These formulas must NOT be modified
   */
  private calculatePerformanceScores(components: ComponentScores): PerformanceScores {
    // Formula 1: Task Completion Accuracy
    // task_completion_accuracy = (Requirements_Met / Total_Requirements) × (Goals_Achieved / Total_Goals) × Quality_Factor
    const taskCompletionAccuracy =
      (components.requirementsMet / components.totalRequirements) *
      (components.goalsAchieved / components.totalGoals) *
      components.qualityFactor;

    // Formula 2: Contextual Coherence
    // contextual_coherence = (Memory_Utilization × 0.4) + (Context_Consistency × 0.4) + (Information_Flow × 0.2)
    const contextualCoherence =
      components.memoryUtilization * 0.4 +
      components.contextConsistency * 0.4 +
      components.informationFlow * 0.2;

    // Formula 3: Reasoning Quality
    // reasoning_quality = (Decision_Quality × 0.4) + (Evidence_Integration × 0.3) + (Logic_Structure × 0.3)
    const reasoningQuality =
      components.decisionQuality * 0.4 +
      components.evidenceIntegration * 0.3 +
      components.logicStructure * 0.3;

    // Formula 4: Adaptive Flexibility
    // adaptive_flexibility = (Route_Efficiency × 0.3) + (Iteration_Efficiency × 0.3) + (Strategy_Adaptation × 0.4)
    const adaptiveFlexibility =
      components.routeEfficiency * 0.3 +
      components.iterationEfficiency * 0.3 +
      components.strategyAdaptation * 0.4;

    // Formula 5: Overall Cognitive Score
    // overall_cognitive_score = (Task_Completion × 0.3) + (Contextual_Coherence × 0.25) + (Reasoning_Quality × 0.25) + (Adaptive_Flexibility × 0.2)
    const overallCognitiveScore =
      taskCompletionAccuracy * 0.3 +
      contextualCoherence * 0.25 +
      reasoningQuality * 0.25 +
      adaptiveFlexibility * 0.2;

    return {
      taskCompletionAccuracy: this.clamp(taskCompletionAccuracy, 0, 1),
      contextualCoherence: this.clamp(contextualCoherence, 0, 1),
      reasoningQuality: this.clamp(reasoningQuality, 0, 1),
      adaptiveFlexibility: this.clamp(adaptiveFlexibility, 0, 1),
      overallCognitiveScore: this.clamp(overallCognitiveScore, 0, 1),
    };
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Create fallback result when evaluation fails
   */
  private createFallbackResult(): EvaluationEngineResult {
    const defaultComponents: ComponentScores = {
      requirementsMet: 1,
      totalRequirements: 1,
      goalsAchieved: 1,
      totalGoals: 1,
      qualityFactor: 0.5,
      memoryUtilization: 0.5,
      contextConsistency: 0.5,
      informationFlow: 0.5,
      decisionQuality: 0.5,
      evidenceIntegration: 0.5,
      logicStructure: 0.5,
      routeEfficiency: 0.5,
      iterationEfficiency: 0.5,
      strategyAdaptation: 0.5,
    };

    return {
      performanceScores: this.calculatePerformanceScores(defaultComponents),
      componentScores: defaultComponents,
      strengths: [],
      areasForImprovement: ['Evaluation engine encountered an error'],
      reasoning: 'Fallback evaluation due to processing error',
    };
  }
}