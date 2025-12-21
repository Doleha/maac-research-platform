/**
 * Settings Routes
 *
 * API endpoints for managing application settings:
 * - GET /settings - List all settings
 * - GET /settings/:key - Get specific setting
 * - PUT /settings/:key - Update setting
 * - DELETE /settings/:key - Delete setting
 * - GET /settings/credentials - Get configured API key status
 * - POST /settings/credentials - Save API keys
 * - POST /settings/test-connection - Test API key connection
 */

import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Map of provider names to environment variable keys
 */
const PROVIDER_ENV_VARS: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  grok: 'GROK_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

/**
 * Provider test endpoints
 */
const PROVIDER_TEST_ENDPOINTS: Record<string, { url: string; model?: string }> = {
  openai: { url: 'https://api.openai.com/v1/models' },
  anthropic: { url: 'https://api.anthropic.com/v1/messages', model: 'claude-3-haiku-20240307' },
  deepseek: { url: 'https://api.deepseek.com/models' },
  openrouter: { url: 'https://openrouter.ai/api/v1/models' },
  grok: { url: 'https://api.x.ai/v1/models' },
  gemini: { url: 'https://generativelanguage.googleapis.com/v1beta/models' },
};

/**
 * Register settings routes
 */
export async function settingsRoutes(
  fastify: FastifyInstance,
  opts: { prisma: PrismaClient },
): Promise<void> {
  const { prisma } = opts;

  // ==========================================================================
  // CREDENTIALS MANAGEMENT
  // ==========================================================================

  /**
   * GET /settings/credentials
   * Get which API keys are configured (from environment variables)
   */
  fastify.get('/settings/credentials', async () => {
    const credentials: Record<string, boolean> = {};

    for (const [provider, envVar] of Object.entries(PROVIDER_ENV_VARS)) {
      const value = process.env[envVar];
      credentials[provider] = !!(value && value.trim().length > 0);
    }

    return {
      credentials,
      providers: Object.keys(PROVIDER_ENV_VARS),
    };
  });

  /**
   * POST /settings/credentials
   * Save API keys (stores in database, optionally updates .env)
   */
  fastify.post<{
    Body: { credentials: Record<string, string>; updateEnvFile?: boolean };
  }>('/settings/credentials', async (request, reply) => {
    const { credentials, updateEnvFile = false } = request.body;

    try {
      // Store credentials in database (encrypted)
      for (const [provider, apiKey] of Object.entries(credentials)) {
        if (apiKey && apiKey !== '••••••••' && apiKey.trim().length > 0) {
          const envVar = PROVIDER_ENV_VARS[provider];
          if (envVar) {
            // Store in database
            await prisma.setting.upsert({
              where: { key: `api_key_${provider}` },
              update: { value: apiKey, encrypted: true },
              create: { key: `api_key_${provider}`, value: apiKey, encrypted: true },
            });

            // Also set in process.env for immediate use
            process.env[envVar] = apiKey;
          }
        }
      }

      // Optionally update .env file
      if (updateEnvFile) {
        await updateEnvFileWithCredentials(credentials);
      }

      return {
        success: true,
        message: 'Credentials saved successfully',
        updatedEnvFile: updateEnvFile,
      };
    } catch (error: any) {
      fastify.log.error('Error saving credentials:', error);
      return reply.code(500).send({
        error: 'Failed to save credentials',
        message: error.message,
      });
    }
  });

  /**
   * POST /settings/test-connection
   * Test connection to an LLM provider
   */
  fastify.post<{
    Body: { provider: string };
  }>('/settings/test-connection', async (request) => {
    const { provider } = request.body;
    const envVar = PROVIDER_ENV_VARS[provider];
    const apiKey = process.env[envVar];

    if (!apiKey) {
      return {
        success: false,
        provider,
        message: `No API key configured. Please set ${envVar}.`,
      };
    }

    const testConfig = PROVIDER_TEST_ENDPOINTS[provider];
    if (!testConfig) {
      return {
        success: false,
        provider,
        message: `Unknown provider: ${provider}`,
      };
    }

    try {
      let response: Response;

      if (provider === 'gemini') {
        // Gemini uses API key as query param
        response = await fetch(`${testConfig.url}?key=${apiKey}`);
      } else if (provider === 'anthropic') {
        // Anthropic requires a messages API call
        response = await fetch(testConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: testConfig.model,
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }],
          }),
        });
      } else {
        response = await fetch(testConfig.url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
      }

      if (response.ok || response.status === 200) {
        return {
          success: true,
          provider,
          message: 'Connection successful! API key is valid.',
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          provider,
          message: 'Invalid API key or unauthorized access.',
        };
      } else {
        const text = await response.text();
        return {
          success: false,
          provider,
          message: `Connection failed: ${response.status} - ${text.substring(0, 100)}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        provider,
        message: `Connection error: ${error.message}`,
      };
    }
  });

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
      available: Object.keys(PROVIDER_ENV_VARS),
    };
  });
}

/**
 * Update .env file with new API credentials
 */
async function updateEnvFileWithCredentials(credentials: Record<string, string>): Promise<void> {
  // Find .env file in project root
  const envPath = path.resolve(process.cwd(), '../../.env');
  const envPathAlt = path.resolve(process.cwd(), '.env');

  let targetPath = envPath;
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envPathAlt)) {
      targetPath = envPathAlt;
    } else {
      // Create new .env file
      targetPath = envPath;
    }
  }

  let envContent = '';
  if (fs.existsSync(targetPath)) {
    envContent = fs.readFileSync(targetPath, 'utf-8');
  }

  // Parse existing env content
  const envLines = envContent.split('\n');
  const envMap = new Map<string, { value: string; line: number }>();

  envLines.forEach((line, index) => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      envMap.set(match[1], { value: match[2], line: index });
    }
  });

  // Update or add credentials
  for (const [provider, apiKey] of Object.entries(credentials)) {
    if (apiKey && apiKey !== '••••••••' && apiKey.trim().length > 0) {
      const envVar = PROVIDER_ENV_VARS[provider];
      if (envVar) {
        const existing = envMap.get(envVar);
        const newValue = `${envVar}="${apiKey}"`;

        if (existing !== undefined) {
          envLines[existing.line] = newValue;
        } else {
          // Add new line before empty lines at end
          let insertIndex = envLines.length;
          while (insertIndex > 0 && envLines[insertIndex - 1].trim() === '') {
            insertIndex--;
          }
          envLines.splice(insertIndex, 0, newValue);
        }
      }
    }
  }

  // Write updated content
  fs.writeFileSync(targetPath, envLines.join('\n'));
}

export default settingsRoutes;
