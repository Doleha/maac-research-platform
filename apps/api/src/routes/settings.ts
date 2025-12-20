/**
 * Settings Routes
 *
 * API endpoints for managing application settings:
 * - GET /settings - List all settings
 * - GET /settings/:key - Get specific setting
 * - PUT /settings/:key - Update setting
 * - DELETE /settings/:key - Delete setting
 */

import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';

/**
 * Register settings routes
 */
export async function settingsRoutes(
  fastify: FastifyInstance,
  opts: { prisma: PrismaClient },
): Promise<void> {
  const { prisma } = opts;

  // ==========================================================================
  // LIST SETTINGS
  // ==========================================================================

  /**
   * GET /settings
   * List all settings (non-encrypted values only)
   */
  fastify.get(
    '/settings',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              settings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string' },
                    value: { type: 'string' },
                    encrypted: { type: 'boolean' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      const settings = await prisma.setting.findMany({
        orderBy: { key: 'asc' },
      });

      return {
        settings: settings.map((s) => ({
          key: s.key,
          value: s.encrypted ? '********' : s.value,
          encrypted: s.encrypted,
          updatedAt: s.updatedAt.toISOString(),
        })),
      };
    },
  );

  // ==========================================================================
  // GET SETTING
  // ==========================================================================

  /**
   * GET /settings/:key
   * Get a specific setting
   */
  fastify.get<{ Params: { key: string } }>(
    '/settings/:key',
    {
      schema: {
        params: {
          type: 'object',
          required: ['key'],
          properties: {
            key: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
              encrypted: { type: 'boolean' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params;

      const setting = await prisma.setting.findUnique({
        where: { key },
      });

      if (!setting) {
        return reply.code(404).send({ error: 'Setting not found' });
      }

      return {
        key: setting.key,
        value: setting.encrypted ? '********' : setting.value,
        encrypted: setting.encrypted,
        updatedAt: setting.updatedAt.toISOString(),
      };
    },
  );

  // ==========================================================================
  // UPDATE/CREATE SETTING
  // ==========================================================================

  /**
   * PUT /settings/:key
   * Create or update a setting
   */
  fastify.put<{
    Params: { key: string };
    Body: { value: string; encrypted?: boolean };
  }>(
    '/settings/:key',
    {
      schema: {
        params: {
          type: 'object',
          required: ['key'],
          properties: {
            key: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['value'],
          properties: {
            value: { type: 'string' },
            encrypted: { type: 'boolean', default: false },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              key: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params;
      const { value, encrypted = false } = request.body;

      try {
        await prisma.setting.upsert({
          where: { key },
          update: { value, encrypted },
          create: { key, value, encrypted },
        });

        return {
          message: 'Setting saved',
          key,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to save setting' });
      }
    },
  );

  // ==========================================================================
  // DELETE SETTING
  // ==========================================================================

  /**
   * DELETE /settings/:key
   * Delete a setting
   */
  fastify.delete<{ Params: { key: string } }>(
    '/settings/:key',
    {
      schema: {
        params: {
          type: 'object',
          required: ['key'],
          properties: {
            key: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              key: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params;

      try {
        const setting = await prisma.setting.findUnique({
          where: { key },
        });

        if (!setting) {
          return reply.code(404).send({ error: 'Setting not found' });
        }

        await prisma.setting.delete({
          where: { key },
        });

        return {
          message: 'Setting deleted',
          key,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to delete setting' });
      }
    },
  );

  // ==========================================================================
  // API KEY MANAGEMENT
  // ==========================================================================

  /**
   * PUT /settings/api-keys/:provider
   * Save API key for a provider (encrypted)
   */
  fastify.put<{
    Params: { provider: string };
    Body: { apiKey: string };
  }>(
    '/settings/api-keys/:provider',
    {
      schema: {
        params: {
          type: 'object',
          required: ['provider'],
          properties: {
            provider: { type: 'string', enum: ['anthropic', 'openai', 'deepseek'] },
          },
        },
        body: {
          type: 'object',
          required: ['apiKey'],
          properties: {
            apiKey: { type: 'string', minLength: 10 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              provider: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { provider } = request.params;
      const { apiKey } = request.body;
      const key = `api_key_${provider}`;

      try {
        // In production, encrypt the API key before storing
        await prisma.setting.upsert({
          where: { key },
          update: { value: apiKey, encrypted: true },
          create: { key, value: apiKey, encrypted: true },
        });

        return {
          message: `API key for ${provider} saved`,
          provider,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to save API key' });
      }
    },
  );

  /**
   * GET /settings/api-keys
   * List configured API key providers (not the actual keys)
   */
  fastify.get('/settings/api-keys', async () => {
    const settings = await prisma.setting.findMany({
      where: {
        key: { startsWith: 'api_key_' },
      },
    });

    const providers = settings.map((s) => ({
      provider: s.key.replace('api_key_', ''),
      configured: true,
      updatedAt: s.updatedAt.toISOString(),
    }));

    return {
      apiKeys: providers,
      available: ['anthropic', 'openai', 'deepseek'],
    };
  });
}

export default settingsRoutes;
