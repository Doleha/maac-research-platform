/**
 * Interpretation Agent Executor
 * Extracted from: MAAC - Tier 2 - Dataset-Level Advanced Analysis-Python.json
 * 
 * Executes interpretation agents with LLM providers to analyze statistical results.
 */

import {
  AgentInput,
  AgentType,
  CoreStatisticalInterpretation,
  AdvancedStatisticalInterpretation,
  BusinessScenarioAnalysis,
  AblationStudyInterpretation,
  CognitiveArchitectureInsights,
  ExperimentalDesignValidation,
  StatisticalAnalysisConfig
} from '../types.js';
import {
  AGENT_PROMPTS,
  AGENT_OUTPUT_SCHEMAS
} from './prompts.js';

// ==================== AGENT RESULT TYPES ====================

export type AgentResults = {
  coreStatistical: CoreStatisticalInterpretation;
  advancedStatistical: AdvancedStatisticalInterpretation;
  businessScenario: BusinessScenarioAnalysis;
  ablationStudy: AblationStudyInterpretation;
  cognitiveArchitecture: CognitiveArchitectureInsights;
  experimentalDesign: ExperimentalDesignValidation;
};

export interface AgentExecutionResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  executionTimeMs: number;
  tokensUsed?: number;
}

// ==================== LLM PROVIDER INTERFACE ====================

/**
 * Interface for LLM providers that can execute agent prompts
 */
export interface LLMProvider {
  name: string;
  
  /**
   * Execute a prompt and return structured output
   */
  execute<T>(
    systemPrompt: string,
    userMessage: string,
    outputSchema?: Record<string, unknown>
  ): Promise<{
    content: T;
    tokensUsed: number;
  }>;
}

// ==================== DEEPSEEK PROVIDER ====================

/**
 * DeepSeek LLM provider implementation
 */
export class DeepSeekProvider implements LLMProvider {
  readonly name = 'deepseek';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, model: string = 'deepseek-chat') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.deepseek.com/v1';
  }

  async execute<T>(
    systemPrompt: string,
    userMessage: string,
    outputSchema?: Record<string, unknown>
  ): Promise<{ content: T; tokensUsed: number }> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: outputSchema ? { type: 'json_object' } : undefined,
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: { total_tokens: number };
    };
    
    const content = JSON.parse(data.choices[0].message.content) as T;
    return {
      content,
      tokensUsed: data.usage.total_tokens
    };
  }
}

// ==================== OPENAI PROVIDER ====================

/**
 * OpenAI LLM provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, model: string = 'gpt-4-turbo') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async execute<T>(
    systemPrompt: string,
    userMessage: string,
    outputSchema?: Record<string, unknown>
  ): Promise<{ content: T; tokensUsed: number }> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: outputSchema ? { type: 'json_object' } : undefined,
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: { total_tokens: number };
    };
    
    const content = JSON.parse(data.choices[0].message.content) as T;
    return {
      content,
      tokensUsed: data.usage.total_tokens
    };
  }
}

// ==================== ANTHROPIC PROVIDER ====================

/**
 * Anthropic Claude LLM provider implementation
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, model: string = 'claude-3-sonnet-20240229') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  async execute<T>(
    systemPrompt: string,
    userMessage: string,
    _outputSchema?: Record<string, unknown>
  ): Promise<{ content: T; tokensUsed: number }> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ],
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      content: Array<{ text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };
    
    const content = JSON.parse(data.content[0].text) as T;
    return {
      content,
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens
    };
  }
}

// ==================== AGENT EXECUTOR ====================

/**
 * Executes interpretation agents with the configured LLM provider
 */
export class AgentExecutor {
  private readonly provider: LLMProvider;
  private readonly enableLogging: boolean;

  constructor(provider: LLMProvider, enableLogging: boolean = true) {
    this.provider = provider;
    this.enableLogging = enableLogging;
  }

  /**
   * Create an AgentExecutor from configuration
   */
  static fromConfig(config: StatisticalAnalysisConfig): AgentExecutor {
    let provider: LLMProvider;

    switch (config.llmProvider) {
      case 'deepseek':
        provider = new DeepSeekProvider(config.llmApiKey, config.llmModel);
        break;
      case 'openai':
        provider = new OpenAIProvider(config.llmApiKey, config.llmModel);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(config.llmApiKey, config.llmModel);
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${config.llmProvider}`);
    }

    return new AgentExecutor(provider, config.enableDetailedLogging);
  }

  private log(message: string): void {
    if (this.enableLogging) {
      console.log(`📊 [AgentExecutor] ${message}`);
    }
  }

  /**
   * Execute a single agent
   */
  async executeAgent<T>(
    agentType: AgentType,
    input: AgentInput
  ): Promise<AgentExecutionResult<T>> {
    const startTime = Date.now();
    
    try {
      this.log(`Executing ${agentType} agent...`);

      const systemPrompt = AGENT_PROMPTS[agentType];
      const outputSchema = AGENT_OUTPUT_SCHEMAS[agentType];
      
      // Build user message from input
      const userMessage = this.buildUserMessage(agentType, input);

      const { content, tokensUsed } = await this.provider.execute<T>(
        systemPrompt,
        userMessage,
        outputSchema
      );

      const executionTimeMs = Date.now() - startTime;
      this.log(`${agentType} agent completed in ${executionTimeMs}ms (${tokensUsed} tokens)`);

      return {
        success: true,
        result: content,
        executionTimeMs,
        tokensUsed
      };

    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.log(`${agentType} agent failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        executionTimeMs
      };
    }
  }

  /**
   * Execute all agents in parallel
   */
  async executeAllAgents(
    input: AgentInput,
    maxConcurrent: number = 6
  ): Promise<{
    results: Partial<AgentResults>;
    summary: {
      successful: number;
      failed: number;
      totalTimeMs: number;
      totalTokens: number;
    };
  }> {
    const startTime = Date.now();
    const agentTypes: AgentType[] = [
      'coreStatistical',
      'advancedStatistical',
      'businessScenario',
      'ablationStudy',
      'cognitiveArchitecture',
      'experimentalDesign'
    ];

    this.log(`Executing ${agentTypes.length} agents (max concurrent: ${maxConcurrent})...`);

    // Execute agents with concurrency limit
    const results: Partial<AgentResults> = {};
    const executionResults: AgentExecutionResult<unknown>[] = [];

    // Process in batches
    for (let i = 0; i < agentTypes.length; i += maxConcurrent) {
      const batch = agentTypes.slice(i, i + maxConcurrent);
      
      const batchResults = await Promise.all(
        batch.map(async (agentType) => {
          const result = await this.executeAgent(agentType, input);
          if (result.success && result.result) {
            (results as Record<string, unknown>)[agentType] = result.result;
          }
          return result;
        })
      );
      
      executionResults.push(...batchResults);
    }

    const totalTimeMs = Date.now() - startTime;
    const successful = executionResults.filter(r => r.success).length;
    const totalTokens = executionResults.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);

    this.log(`All agents completed: ${successful}/${agentTypes.length} successful, ${totalTimeMs}ms, ${totalTokens} tokens`);

    return {
      results,
      summary: {
        successful,
        failed: agentTypes.length - successful,
        totalTimeMs,
        totalTokens
      }
    };
  }

  /**
   * Build user message from agent input for specific agent type
   */
  private buildUserMessage(agentType: AgentType, input: AgentInput): string {
    const baseContext = `
Analysis Session: ${input.session_id}
Dimensions Analyzed: ${input.dimensions_processed}
Overall Score: ${input.overall_score}
Grade Level: ${input.grade_level}
Validation Strength: ${input.validation_strength}
Deployment Readiness: ${input.deployment_readiness}
Engine Version: ${input.engine_version}
Timestamp: ${input.timestamp}
`;

    let agentSpecificData: string;

    switch (agentType) {
      case 'coreStatistical':
        agentSpecificData = `
Core Statistics Data:
${JSON.stringify(input.core_statistics, null, 2)}
`;
        break;

      case 'advancedStatistical':
        agentSpecificData = `
Advanced Statistics Data:
${JSON.stringify(input.advanced_statistics, null, 2)}
`;
        break;

      case 'businessScenario':
        agentSpecificData = `
Business Analysis Data:
${JSON.stringify(input.business_analysis, null, 2)}
`;
        break;

      case 'ablationStudy':
        agentSpecificData = `
Ablation Study Data:
${JSON.stringify(input.ablation_study, null, 2)}
`;
        break;

      case 'cognitiveArchitecture':
        agentSpecificData = `
Cognitive Architecture Data:
${JSON.stringify(input.cognitive_architecture, null, 2)}
`;
        break;

      case 'experimentalDesign':
        agentSpecificData = `
Experimental Design Data:
${JSON.stringify(input.experimental_design, null, 2)}
`;
        break;

      default:
        agentSpecificData = '';
    }

    return `${baseContext}\n${agentSpecificData}\n
Please analyze the provided data and return your interpretation in the structured JSON format specified.`;
  }
}

// ==================== EXPORTS ====================

export {
  AGENT_PROMPTS,
  AGENT_OUTPUT_SCHEMAS
} from './prompts.js';

export type { AgentType } from '../types.js';
