/**
 * Dynamic Model Fetcher
 *
 * Fetches available models from actual LLM provider APIs.
 * Implements caching to reduce API calls and improve performance.
 */

interface ModelInfo {
  id: string;
  name: string;
  created?: number;
}

interface CachedModels {
  models: string[];
  timestamp: number;
}

// Cache duration: 1 hour
const CACHE_TTL = 60 * 60 * 1000;

// In-memory cache (in production, use Redis)
const modelCache = new Map<string, CachedModels>();

/**
 * Fetch models from OpenAI API
 */
async function fetchOpenAIModels(apiKey?: string): Promise<string[]> {
  try {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      console.warn('No OpenAI API key available');
      return getDefaultOpenAIModels();
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as { data: ModelInfo[] };
    const models = data.data
      .filter((model: ModelInfo) => model.id.includes('gpt'))
      .map((model: ModelInfo) => model.id)
      .sort();

    return models.length > 0 ? models : getDefaultOpenAIModels();
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    return getDefaultOpenAIModels();
  }
}

/**
 * Fetch models from Anthropic (using known model list - no public endpoint)
 */
async function fetchAnthropicModels(): Promise<string[]> {
  // Anthropic doesn't have a public models endpoint
  // We maintain a list based on their documentation
  return getDefaultAnthropicModels();
}

/**
 * Fetch models from DeepSeek API
 */
async function fetchDeepSeekModels(apiKey?: string): Promise<string[]> {
  try {
    const key = apiKey || process.env.DEEPSEEK_API_KEY;
    if (!key) {
      console.warn('No DeepSeek API key available');
      return getDefaultDeepSeekModels();
    }

    const response = await fetch('https://api.deepseek.com/models', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = (await response.json()) as { data?: ModelInfo[] };
    const models = data.data?.map((model: ModelInfo) => model.id).sort() || [];

    return models.length > 0 ? models : getDefaultDeepSeekModels();
  } catch (error) {
    console.error('Error fetching DeepSeek models:', error);
    return getDefaultDeepSeekModels();
  }
}

/**
 * Fetch models from OpenRouter API
 */
async function fetchOpenRouterModels(apiKey?: string): Promise<string[]> {
  try {
    const key = apiKey || process.env.OPENROUTER_API_KEY;

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: key
        ? {
            Authorization: `Bearer ${key}`,
          }
        : {},
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = (await response.json()) as { data?: any[] };
    const models = data.data?.map((model: any) => model.id).sort() || [];

    return models.length > 0 ? models : getDefaultOpenRouterModels();
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    return getDefaultOpenRouterModels();
  }
}

/**
 * Fetch models from Grok (xAI) API
 */
async function fetchGrokModels(apiKey?: string): Promise<string[]> {
  try {
    const key = apiKey || process.env.GROK_API_KEY;
    if (!key) {
      console.warn('No Grok API key available');
      return getDefaultGrokModels();
    }

    const response = await fetch('https://api.x.ai/v1/models', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = (await response.json()) as { data?: ModelInfo[] };
    const models = data.data?.map((model: ModelInfo) => model.id).sort() || [];

    return models.length > 0 ? models : getDefaultGrokModels();
  } catch (error) {
    console.error('Error fetching Grok models:', error);
    return getDefaultGrokModels();
  }
}

/**
 * Fetch models from Google Gemini API
 */
async function fetchGeminiModels(apiKey?: string): Promise<string[]> {
  try {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('No Gemini API key available');
      return getDefaultGeminiModels();
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as { models?: any[] };
    const models =
      data.models
        ?.filter((model: any) => model.name.includes('gemini'))
        .map((model: any) => model.name.replace('models/', ''))
        .sort() || [];

    return models.length > 0 ? models : getDefaultGeminiModels();
  } catch (error) {
    console.error('Error fetching Gemini models:', error);
    return getDefaultGeminiModels();
  }
}

/**
 * Fetch models from Llama providers (using OpenRouter as proxy)
 */
async function fetchLlamaModels(apiKey?: string): Promise<string[]> {
  try {
    const key = apiKey || process.env.OPENROUTER_API_KEY;

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: key
        ? {
            Authorization: `Bearer ${key}`,
          }
        : {},
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = (await response.json()) as { data?: any[] };
    const llamaModels =
      data.data
        ?.filter((model: any) => model.id.toLowerCase().includes('llama'))
        .map((model: any) => model.id)
        .sort() || [];

    return llamaModels.length > 0 ? llamaModels : getDefaultLlamaModels();
  } catch (error) {
    console.error('Error fetching Llama models:', error);
    return getDefaultLlamaModels();
  }
}

/**
 * Default model lists (fallback when API calls fail)
 */
function getDefaultOpenAIModels(): string[] {
  return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
}

function getDefaultAnthropicModels(): string[] {
  return [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];
}

function getDefaultDeepSeekModels(): string[] {
  return ['deepseek-chat', 'deepseek-coder'];
}

function getDefaultOpenRouterModels(): string[] {
  return [
    'openai/gpt-4o',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-pro-1.5',
    'meta-llama/llama-3.1-405b-instruct',
  ];
}

function getDefaultGrokModels(): string[] {
  return ['grok-beta', 'grok-2'];
}

function getDefaultGeminiModels(): string[] {
  return ['gemini-2.0-flash-exp', 'gemini-exp-1206', 'gemini-1.5-pro', 'gemini-1.5-flash'];
}

function getDefaultLlamaModels(): string[] {
  return [
    'meta-llama/llama-3.3-70b-instruct',
    'meta-llama/llama-3.1-405b-instruct',
    'meta-llama/llama-3.1-70b-instruct',
    'meta-llama/llama-3.1-8b-instruct',
  ];
}

/**
 * Get models for a specific provider (with caching)
 */
export async function getModelsForProvider(
  provider: string,
  forceRefresh: boolean = false,
): Promise<string[]> {
  // Check cache first
  if (!forceRefresh) {
    const cached = modelCache.get(provider);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.models;
    }
  }

  // Fetch fresh models
  let models: string[];

  switch (provider) {
    case 'openai':
      models = await fetchOpenAIModels();
      break;
    case 'anthropic':
      models = await fetchAnthropicModels();
      break;
    case 'deepseek':
      models = await fetchDeepSeekModels();
      break;
    case 'openrouter':
      models = await fetchOpenRouterModels();
      break;
    case 'grok':
      models = await fetchGrokModels();
      break;
    case 'gemini':
      models = await fetchGeminiModels();
      break;
    case 'llama':
      models = await fetchLlamaModels();
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  // Update cache
  modelCache.set(provider, {
    models,
    timestamp: Date.now(),
  });

  return models;
}

/**
 * Get all providers
 */
export function getAllProviders(): string[] {
  return ['openai', 'anthropic', 'deepseek', 'openrouter', 'grok', 'gemini', 'llama'];
}

/**
 * Clear cache for a specific provider or all providers
 */
export function clearModelCache(provider?: string): void {
  if (provider) {
    modelCache.delete(provider);
  } else {
    modelCache.clear();
  }
}
