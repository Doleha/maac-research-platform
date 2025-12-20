/**
 * LLM Provider Routes
 *
 * Endpoints for fetching available LLM models from providers
 */

import type { FastifyInstance } from 'fastify';

// Model mappings for each provider
// These would ideally be fetched from the provider APIs dynamically
const PROVIDER_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder' },
  ],
  openrouter: [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (OpenRouter)' },
    { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo (OpenRouter)' },
    { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5 (OpenRouter)' },
    { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B (OpenRouter)' },
  ],
  grok: [
    { value: 'grok-2-1212', label: 'Grok 2' },
    { value: 'grok-2-vision-1212', label: 'Grok 2 Vision' },
    { value: 'grok-beta', label: 'Grok Beta' },
  ],
  gemini: [
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-exp-1206', label: 'Gemini Experimental' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  llama: [
    { value: 'meta-llama/Meta-Llama-3.1-405B-Instruct', label: 'Llama 3.1 405B Instruct' },
    { value: 'meta-llama/Meta-Llama-3.1-70B-Instruct', label: 'Llama 3.1 70B Instruct' },
    { value: 'meta-llama/Meta-Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B Instruct' },
    { value: 'meta-llama/Llama-3.2-90B-Vision-Instruct', label: 'Llama 3.2 90B Vision' },
  ],
};

export async function llmRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/llm/models
   *
   * Get available models for a specific provider
   */
  fastify.get<{
    Querystring: { provider?: string };
  }>('/models', async (request, reply) => {
    const { provider } = request.query;

    if (!provider) {
      return reply.status(400).send({
        error: 'Provider parameter is required',
      });
    }

    const models = PROVIDER_MODELS[provider.toLowerCase()];

    if (!models) {
      return reply.status(404).send({
        error: `Unknown provider: ${provider}`,
        availableProviders: Object.keys(PROVIDER_MODELS),
      });
    }

    return { models };
  });

  /**
   * GET /api/llm/providers
   *
   * Get list of all available providers
   */
  fastify.get('/providers', async () => {
    const providers = Object.keys(PROVIDER_MODELS).map((key) => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
    }));

    return { providers };
  });
}

