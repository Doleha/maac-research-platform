/**
 * LLM Provider Routes
 *
 * Dynamically fetches available LLM models from actual provider APIs
 */

import type { FastifyInstance } from 'fastify';
import { getModelsForProvider, getAllProviders, clearModelCache } from '../lib/model-fetcher.js';

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
}
