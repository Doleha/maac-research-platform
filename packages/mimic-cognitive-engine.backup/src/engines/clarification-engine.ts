/**
 * Clarification Engine - Resolve ambiguities through targeted questions
 *
 * @private - Proprietary MIMIC component
 *
 * Responsibilities:
 * - Identify ambiguities in user objectives or requirements
 * - Generate targeted questions about scope, timeframe, metrics, priorities
 * - Ensure sufficient clarity before proceeding with planning or execution
 * - Provide inferred answers when confidence is high
 *
 * Output Schema extracted from n8n workflow:
 * - clarification_request with questions[]
 * - clarification_state with resolution status
 */

import { generateText } from 'ai';
import { z } from 'zod';
import { AIModel, SystemPromptProvider } from '../orchestrator';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Question priority level
 */
export type QuestionPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Question category
 */
export type QuestionCategory =
  | 'scope'
  | 'timeframe'
  | 'metrics'
  | 'priorities'
  | 'constraints'
  | 'resources'
  | 'format'
  | 'context';

/**
 * Clarification question
 */
export interface ClarificationQuestion {
  questionId: string;
  question: string;
  context: string;
  priority: QuestionPriority;
  category: QuestionCategory;
  suggestedOptions?: string[];
  defaultValue?: string;
}

/**
 * Inferred answer
 */
export interface InferredAnswer {
  questionId: string;
  inference: string;
  confidence: number;
  reasoning: string;
}

/**
 * Zod schema for clarification question
 */
export const ClarificationQuestionSchema = z.object({
  questionId: z.string(),
  question: z.string(),
  context: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum([
    'scope',
    'timeframe',
    'metrics',
    'priorities',
    'constraints',
    'resources',
    'format',
    'context',
  ]),
  suggestedOptions: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
});

/**
 * Zod schema for inferred answer
 */
export const InferredAnswerSchema = z.object({
  questionId: z.string(),
  inference: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

/**
 * Zod schema for clarification state
 */
export const ClarificationStateSchema = z.object({
  totalAmbiguities: z.number(),
  criticalAmbiguities: z.number(),
  resolvableWithDefaults: z.number(),
  requiresUserInput: z.boolean(),
  canProceedWithAssumptions: z.boolean(),
  assumptionRisk: z.enum(['low', 'medium', 'high']),
});

export type ClarificationState = z.infer<typeof ClarificationStateSchema>;

/**
 * Complete Clarification Engine output schema
 */
export const ClarificationEngineOutputSchema = z.object({
  clarification_request: z.object({
    questions: z.array(ClarificationQuestionSchema),
    inferredAnswers: z.array(InferredAnswerSchema),
  }),
  clarification_state: ClarificationStateSchema,
  processing_notes: z.string().optional(),
});

export type ClarificationEngineOutput = z.infer<typeof ClarificationEngineOutputSchema>;

/**
 * Clarification Engine result (public interface)
 */
export interface ClarificationEngineResult {
  needsClarification: boolean;
  questions: ClarificationQuestion[];
  inferredAnswers: InferredAnswer[];
  state: ClarificationState;
}

/**
 * Clarification Engine configuration
 */
export interface ClarificationEngineConfig {
  llmProvider: AIModel;
  systemPrompt?: string | SystemPromptProvider;
  debug?: boolean;
}

// ============================================================================
// CLARIFICATION ENGINE CLASS
// ============================================================================

export class ClarificationEngine {
  private readonly llmProvider: AIModel;
  private readonly systemPromptSource?: string | SystemPromptProvider;
  private readonly debug: boolean;
  private cachedSystemPrompt: string | null = null;

  constructor(llmProvider: AIModel, config?: Partial<ClarificationEngineConfig>) {
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
    } else if (process.env.CLARIFICATION_ENGINE_SYSTEM_PROMPT) {
      prompt = process.env.CLARIFICATION_ENGINE_SYSTEM_PROMPT;
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
    return `You are the Clarification Engine for MIMIC, a specialized cognitive module responsible for identifying and resolving ambiguities in user requests.

## Your Responsibilities

1. **Ambiguity Detection**: Identify unclear or underspecified aspects
2. **Question Generation**: Create targeted questions to resolve ambiguities
3. **Priority Assessment**: Rank questions by importance to success
4. **Inference**: Provide reasonable assumptions when confidence is high
5. **Risk Assessment**: Evaluate risk of proceeding with assumptions

## Question Categories

- **scope**: What is included/excluded?
- **timeframe**: When should this be completed?
- **metrics**: How will success be measured?
- **priorities**: What is most important?
- **constraints**: What limitations exist?
- **resources**: What resources are available?
- **format**: What format is expected for output?
- **context**: What background information is relevant?

## Priority Levels

- **critical**: Cannot proceed without clarification
- **high**: Significantly impacts quality/success
- **medium**: Affects approach but not blocking
- **low**: Nice to know but can assume

## Output Format

Respond with a JSON object containing:
{
  "clarification_request": {
    "questions": [
      {
        "questionId": "q-1",
        "question": "What is your preferred timeframe?",
        "context": "No deadline was specified",
        "priority": "high",
        "category": "timeframe",
        "suggestedOptions": ["ASAP", "This week", "No rush"],
        "defaultValue": "This week"
      }
    ],
    "inferredAnswers": [
      {
        "questionId": "q-2",
        "inference": "The format appears to be a report",
        "confidence": 0.8,
        "reasoning": "User mentioned 'document' and 'summary'"
      }
    ]
  },
  "clarification_state": {
    "totalAmbiguities": 3,
    "criticalAmbiguities": 0,
    "resolvableWithDefaults": 2,
    "requiresUserInput": false,
    "canProceedWithAssumptions": true,
    "assumptionRisk": "low|medium|high"
  }
}`;
  }

  /**
   * Execute clarification analysis (returns JSON string for tool interface)
   */
  async execute(query: string, sessionId: string): Promise<string> {
    const result = await this.analyze(query, sessionId);
    return JSON.stringify(result);
  }

  /**
   * Analyze with full structured output
   */
  async analyze(
    query: string,
    sessionId: string,
    context?: string
  ): Promise<ClarificationEngineResult> {
    const systemPrompt = await this.getSystemPrompt();
    const userMessage = this.buildUserMessage(query, context);

    try {
      const result = await generateText({
        model: this.llmProvider,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.4,
      });

      if (this.debug) {
        console.log('[ClarificationEngine] Raw LLM response:', result.text);
      }

      const output = this.parseOutput(result.text, sessionId);
      return this.transformToResult(output);
    } catch (error) {
      if (this.debug) {
        console.error('[ClarificationEngine] Analysis failed:', error);
      }

      return this.createFallbackResult();
    }
  }

  /**
   * Build the user message for clarification analysis
   */
  private buildUserMessage(query: string, context?: string): string {
    const parts: string[] = [];

    parts.push('## User Request');
    parts.push(query);

    if (context) {
      parts.push('');
      parts.push('## Additional Context');
      parts.push(context);
    }

    parts.push('');
    parts.push('---');
    parts.push('Identify any ambiguities that need clarification. Respond with valid JSON only.');

    return parts.join('\n');
  }

  /**
   * Parse LLM output into structured ClarificationEngineOutput
   */
  private parseOutput(text: string, sessionId: string): ClarificationEngineOutput {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure question IDs are set
    if (parsed.clarification_request?.questions) {
      parsed.clarification_request.questions = parsed.clarification_request.questions.map(
        (q: Record<string, unknown>, index: number) => ({
          ...q,
          questionId: q.questionId || `q-${sessionId}-${index}`,
        })
      );
    }

    return ClarificationEngineOutputSchema.parse(parsed);
  }

  /**
   * Transform ClarificationEngineOutput to ClarificationEngineResult
   */
  private transformToResult(output: ClarificationEngineOutput): ClarificationEngineResult {
    return {
      needsClarification: output.clarification_state.requiresUserInput,
      questions: output.clarification_request.questions,
      inferredAnswers: output.clarification_request.inferredAnswers,
      state: output.clarification_state,
    };
  }

  /**
   * Create fallback result when analysis fails
   */
  private createFallbackResult(): ClarificationEngineResult {
    return {
      needsClarification: false,
      questions: [],
      inferredAnswers: [],
      state: {
        totalAmbiguities: 0,
        criticalAmbiguities: 0,
        resolvableWithDefaults: 0,
        requiresUserInput: false,
        canProceedWithAssumptions: true,
        assumptionRisk: 'low',
      },
    };
  }
}