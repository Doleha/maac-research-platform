import { z } from 'zod';

export interface LLMProvider {
  modelName: string;
  
  /**
   * Invoke LLM with optional structured output
   */
  invoke<T = string>(params: {
    systemPrompt: string;
    userMessage?: string;
    responseSchema?: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<T>;
}

/**
 * Vercel AI SDK implementation (supports all major providers)
 */
export class VercelAIProvider implements LLMProvider {
  constructor(
    public modelName: string,
    private model: any // Vercel AI SDK model instance
  ) {}

  async invoke<T = string>(params: {
    systemPrompt: string;
    userMessage?: string;
    responseSchema?: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<T> {
    const { generateObject, generateText } = await import('ai');

    if (params.responseSchema) {
      const { object } = await generateObject({
        model: this.model,
        system: params.systemPrompt,
        prompt: params.userMessage || '',
        schema: params.responseSchema,
        temperature: params.temperature ?? 0.7,
        maxTokens: params.maxTokens ?? 4000
      });
      return object as T;
    } else {
      const { text } = await generateText({
        model: this.model,
        system: params.systemPrompt,
        prompt: params.userMessage || '',
        temperature: params.temperature ?? 0.7,
        maxTokens: params.maxTokens ?? 4000
      });
      return text as T;
    }
  }
}
