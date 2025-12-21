/**
 * LLM Provider Routes
 *
 * Dynamically fetches available LLM models from actual provider APIs
 * and manages API key status for providers.
 */

import type { FastifyInstance } from 'fastify';
import { getModelsForProvider, getAllProviders, clearModelCache } from '../lib/model-fetcher.js';

/**
 * Map of provider names to their environment variable keys
 */
const PROVIDER_API_KEY_MAP: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  grok: 'GROK_API_KEY',
  gemini: 'GEMINI_API_KEY',
  llama: 'OPENROUTER_API_KEY', // Llama uses OpenRouter as proxy
};

/**
 * Check if an API key is configured for a provider
 */
function isApiKeyConfigured(provider: string): boolean {
  const envVar = PROVIDER_API_KEY_MAP[provider.toLowerCase()];
  if (!envVar) return false;
  const value = process.env[envVar];
  return !!(value && value.trim().length > 0);
}

export async function llmRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/llm/models
   *
   * Get available models for a specific provider
   * Query params:
   * - provider: The LLM provider (required)
   * - refresh: Set to 'true' to bypass cache and fetch fresh data
   */
  fastify.get<{
    Querystring: { provider?: string; refresh?: string };
  }>('/models', async (request, reply) => {
    const { provider, refresh } = request.query;

    if (!provider) {
      return reply.status(400).send({
        error: 'Provider parameter is required',
      });
    }

    try {
      const forceRefresh = refresh === 'true';
      const modelIds = await getModelsForProvider(provider.toLowerCase(), forceRefresh);

      // Convert to { value, label } format for frontend compatibility
      const models = modelIds.map((id) => ({
        value: id,
        label: id,
      }));

      return {
        models,
        count: models.length,
        cached: !forceRefresh,
      };
    } catch (error: any) {
      return reply.status(404).send({
        error: error.message,
        availableProviders: getAllProviders(),
      });
    }
  });

  /**
   * GET /api/llm/providers
   *
   * Get list of all available providers
   */
  fastify.get('/providers', async () => {
    const providerIds = getAllProviders();

    const providers = providerIds.map((id) => ({
      value: id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
    }));

    return {
      providers,
      total: providers.length,
    };
  });

  /**
   * POST /api/llm/refresh-cache
   *
   * Clear model cache for a provider or all providers
   * Body: { provider?: string }
   */
  fastify.post<{
    Body: { provider?: string };
  }>('/refresh-cache', async (request) => {
    const { provider } = request.body;

    if (provider) {
      clearModelCache(provider.toLowerCase());
      return {
        message: `Cache cleared for provider: ${provider}`,
      };
    } else {
      clearModelCache();
      return {
        message: 'Cache cleared for all providers',
      };
    }
  });

  /**
   * GET /api/llm/api-key-status
   *
   * Check which providers have API keys configured
   * Query params:
   * - provider: Optional specific provider to check
   */
  fastify.get<{
    Querystring: { provider?: string };
  }>('/api-key-status', async (request, reply) => {
    const { provider } = request.query;
    const allProviders = getAllProviders();

    if (provider) {
      // Check specific provider
      const normalizedProvider = provider.toLowerCase();
      if (!allProviders.includes(normalizedProvider)) {
        return reply.status(404).send({
          error: `Unknown provider: ${provider}`,
          availableProviders: allProviders,
        });
      }

      const configured = isApiKeyConfigured(normalizedProvider);
      const envVar = PROVIDER_API_KEY_MAP[normalizedProvider];

      return {
        provider: normalizedProvider,
        configured,
        envVariable: envVar,
        message: configured
          ? `API key is configured for ${provider}`
          : `No API key found. Please set ${envVar} in your environment or add it in Settings.`,
      };
    }

    // Return status for all providers
    const status = allProviders.map((p) => ({
      provider: p,
      label: p.charAt(0).toUpperCase() + p.slice(1),
      configured: isApiKeyConfigured(p),
      envVariable: PROVIDER_API_KEY_MAP[p],
    }));

    const configuredCount = status.filter((s) => s.configured).length;

    return {
      providers: status,
      summary: {
        total: status.length,
        configured: configuredCount,
        missing: status.length - configuredCount,
      },
    };
  });

  /**
   * GET /api/llm/providers-with-status
   *
   * Get list of all available providers with their API key status
   */
  fastify.get('/providers-with-status', async () => {
    const providerIds = getAllProviders();

    const providers = providerIds.map((id) => ({
      value: id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      configured: isApiKeyConfigured(id),
      envVariable: PROVIDER_API_KEY_MAP[id],
    }));

    return {
      providers,
      total: providers.length,
      configured: providers.filter((p) => p.configured).length,
    };
  });
}
