import { LLMProvider } from '../../src/dimensions/types';
import { z } from 'zod';

/**
 * Mock LLM Provider for testing
 * Returns predictable structured responses for dimension assessments
 */
export class MockLLMProvider implements LLMProvider {
  modelName = 'mock-model';

  async invoke<T = string>(params: {
    systemPrompt: string;
    userMessage?: string;
    responseSchema?: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<T> {
    // Return mock structured response based on the prompt content
    const prompt = params.systemPrompt.toLowerCase();

    // Generate mock component scores
    const mockComponentScore = {
      score: 4,
      calculation: 'Mock calculation',
      evidence: 'Mock evidence from response',
      reasoning: 'Mock reasoning for score assignment',
    };

    // Default mock response structure matching MAAC output format
    const mockResponse = {
      dimension: this.detectDimension(prompt),
      assessment_context: {
        model: 'mock-model',
        configuration: '111111111111',
        complexity: 'moderate',
        processing_time_ms: '5000',
        validation_status: 'complete',
        missing_variables: [],
        calculation_notes: [],
      },
      component_scores: {
        q1: { ...mockComponentScore, score: 4 },
        q2: { ...mockComponentScore, score: 4 },
        q3: { ...mockComponentScore, score: 3 },
        q4: { ...mockComponentScore, score: 4 },
        q5: { ...mockComponentScore, score: 4 },
        q6: { ...mockComponentScore, score: 3 },
      },
      dimension_score: 3.67,
      confidence: 0.85,
      key_observations: [
        'Mock observation 1',
        'Mock observation 2',
      ],
      assessment_reasoning: 'Mock assessment reasoning for testing purposes.',
    };

    return mockResponse as T;
  }

  private detectDimension(prompt: string): string {
    if (prompt.includes('cognitive load')) return 'cognitive_load';
    if (prompt.includes('tool execution')) return 'tool_execution';
    if (prompt.includes('content quality')) return 'content_quality';
    if (prompt.includes('memory integration')) return 'memory_integration';
    if (prompt.includes('complexity handling')) return 'complexity_handling';
    if (prompt.includes('hallucination')) return 'hallucination_control';
    if (prompt.includes('knowledge transfer')) return 'knowledge_transfer';
    if (prompt.includes('processing efficiency')) return 'processing_efficiency';
    if (prompt.includes('construct validity')) return 'construct_validity';
    return 'unknown';
  }
}

/**
 * Mock LLM Provider that returns specific scores for testing
 */
export class ConfigurableMockLLMProvider implements LLMProvider {
  modelName = 'configurable-mock';
  
  constructor(private mockScores: Record<string, number> = {}) {}

  async invoke<T = string>(params: {
    systemPrompt: string;
    userMessage?: string;
    responseSchema?: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<T> {
    const prompt = params.systemPrompt.toLowerCase();
    const dimension = this.detectDimension(prompt);
    const score = this.mockScores[dimension] ?? 3.5;

    const mockResponse = {
      dimension,
      component_scores: {
        q1: { score: score, calculation: 'mock', evidence: 'mock', reasoning: 'mock' },
        q2: { score: score, calculation: 'mock', evidence: 'mock', reasoning: 'mock' },
        q3: { score: score, calculation: 'mock', evidence: 'mock', reasoning: 'mock' },
        q4: { score: score, calculation: 'mock', evidence: 'mock', reasoning: 'mock' },
        q5: { score: score, calculation: 'mock', evidence: 'mock', reasoning: 'mock' },
        q6: { score: score, calculation: 'mock', evidence: 'mock', reasoning: 'mock' },
      },
      dimension_score: score,
      confidence: 0.9,
      key_observations: ['Configured mock response'],
      assessment_reasoning: `Mock response with configured score: ${score}`,
    };

    return mockResponse as T;
  }

  private detectDimension(prompt: string): string {
    if (prompt.includes('cognitive load')) return 'cognitive_load';
    if (prompt.includes('tool execution')) return 'tool_execution';
    if (prompt.includes('content quality')) return 'content_quality';
    if (prompt.includes('memory integration')) return 'memory_integration';
    if (prompt.includes('complexity handling')) return 'complexity_handling';
    if (prompt.includes('hallucination')) return 'hallucination_control';
    if (prompt.includes('knowledge transfer')) return 'knowledge_transfer';
    if (prompt.includes('processing efficiency')) return 'processing_efficiency';
    if (prompt.includes('construct validity')) return 'construct_validity';
    return 'unknown';
  }
}
