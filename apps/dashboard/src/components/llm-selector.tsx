'use client';

import { useState, useEffect, useCallback } from 'react';
import { Info, Loader2, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import Link from 'next/link';

export interface LLMConfig {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
}

interface LLMSelectorProps {
  value: LLMConfig;
  onChange: (config: LLMConfig) => void;
  errors?: Record<string, string>;
  /** Whether to show the API key status warning */
  showApiKeyWarning?: boolean;
  /** Whether to show advanced parameters (temperature, max_tokens, top_p) */
  showAdvancedParams?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

interface ProviderStatus {
  value: string;
  label: string;
  configured: boolean;
  envVariable: string;
}

export function LLMSelector({
  value,
  onChange,
  errors = {},
  showApiKeyWarning = true,
  showAdvancedParams = true,
  compact = false,
}: LLMSelectorProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [availableModels, setAvailableModels] = useState<Array<{ value: string; label: string }>>(
    [],
  );
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null);

  // Fetch providers with their API key status
  const fetchProviders = useCallback(async () => {
    setLoadingProviders(true);
    try {
      const response = await fetch(`${apiUrl}/api/llm/providers-with-status`);
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
      // Fallback to default providers list
      setProviders([
        { value: 'openai', label: 'OpenAI', configured: false, envVariable: 'OPENAI_API_KEY' },
        {
          value: 'anthropic',
          label: 'Anthropic',
          configured: false,
          envVariable: 'ANTHROPIC_API_KEY',
        },
        {
          value: 'deepseek',
          label: 'DeepSeek',
          configured: false,
          envVariable: 'DEEPSEEK_API_KEY',
        },
        {
          value: 'openrouter',
          label: 'OpenRouter',
          configured: false,
          envVariable: 'OPENROUTER_API_KEY',
        },
        { value: 'grok', label: 'Grok (X.AI)', configured: false, envVariable: 'GROK_API_KEY' },
        {
          value: 'gemini',
          label: 'Google Gemini',
          configured: false,
          envVariable: 'GEMINI_API_KEY',
        },
        {
          value: 'llama',
          label: 'Meta Llama',
          configured: false,
          envVariable: 'OPENROUTER_API_KEY',
        },
      ]);
    } finally {
      setLoadingProviders(false);
    }
  }, [apiUrl]);

  // Fetch providers on mount
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Update API key status when provider changes
  useEffect(() => {
    if (value.provider && providers.length > 0) {
      const provider = providers.find((p) => p.value === value.provider);
      setApiKeyConfigured(provider?.configured ?? null);
    } else {
      setApiKeyConfigured(null);
    }
  }, [value.provider, providers]);

  // Fetch models from actual provider APIs
  const fetchModels = useCallback(async (provider: string, forceRefresh: boolean = false) => {
    if (!provider) {
      setAvailableModels([]);
      return;
    }

    setLoadingModels(true);
    setModelError(null);

    try {
      const url = `${apiUrl}/api/llm/models?provider=${provider}${forceRefresh ? '&refresh=true' : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch models for ${provider}`);
      }

      const data = await response.json();
      setAvailableModels(data.models || []);
    } catch (err) {
      console.error('Error fetching models:', err);
      setModelError(err instanceof Error ? err.message : 'Failed to load models');
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, [apiUrl]);

  // Fetch models when provider changes
  useEffect(() => {
    if (value.provider) {
      fetchModels(value.provider);
    } else {
      setAvailableModels([]);
    }
  }, [value.provider, fetchModels]);

  const handleProviderChange = (provider: string) => {
    // Reset model when provider changes (will be set after models load)
    onChange({ ...value, provider, model: '' });
  };

  // Auto-select first model when models load
  useEffect(() => {
    if (availableModels.length > 0 && !value.model) {
      onChange({ ...value, model: availableModels[0].value });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableModels]);

  const handleFieldChange = (field: keyof LLMConfig, fieldValue: string | number) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const handleModelDropdownClick = () => {
    // Refresh models from provider APIs when dropdown is clicked
    if (value.provider && !loadingModels) {
      fetchModels(value.provider, true); // Force refresh from provider
    }
  };

  // Find current provider info
  const currentProvider = providers.find((p) => p.value === value.provider);

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Provider Selection */}
      <div>
        <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
          LLM Provider <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="provider"
            value={value.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            disabled={loadingProviders}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
              errors.provider
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : apiKeyConfigured === false && showApiKeyWarning
                  ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } ${loadingProviders ? 'cursor-wait opacity-60' : ''}`}
          >
            <option value="">
              {loadingProviders ? 'Loading providers...' : 'Select a provider...'}
            </option>
            {providers.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label} {provider.configured ? '✓' : '(no key)'}
              </option>
            ))}
          </select>
          {loadingProviders && (
            <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </div>
          )}
        </div>
        {errors.provider && <p className="mt-1 text-sm text-red-600">{errors.provider}</p>}
      </div>

      {/* API Key Warning */}
      {showApiKeyWarning && value.provider && apiKeyConfigured === false && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-yellow-800">
              API key not configured for {currentProvider?.label || value.provider}
            </p>
            <p className="mt-1 text-yellow-700">
              Please add your {currentProvider?.envVariable || 'API key'} in{' '}
              <Link href="/settings" className="font-medium underline hover:text-yellow-900">
                Settings
              </Link>{' '}
              to use this provider.
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1 rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-200"
          >
            <Settings className="h-3 w-3" />
            Settings
          </Link>
        </div>
      )}

      {/* API Key Success indicator */}
      {showApiKeyWarning && value.provider && apiKeyConfigured === true && !compact && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>API key configured for {currentProvider?.label}</span>
        </div>
      )}

      {/* Model Selection */}
      {value.provider && (
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">
            Model <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="model"
              value={value.model}
              onChange={(e) => handleFieldChange('model', e.target.value)}
              onClick={handleModelDropdownClick}
              disabled={loadingModels}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                errors.model
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              } ${loadingModels ? 'cursor-wait opacity-60' : ''}`}
            >
              <option value="">{loadingModels ? 'Loading models...' : 'Select a model...'}</option>
              {availableModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            {loadingModels && (
              <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            )}
          </div>
          {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
          {modelError && (
            <p className="mt-1 text-sm text-red-600">
              {modelError}
              <button
                onClick={() => fetchModels(value.provider)}
                className="ml-2 text-blue-600 underline hover:text-blue-700"
              >
                Retry
              </button>
            </p>
          )}
          {!loadingModels && availableModels.length === 0 && !modelError && (
            <p className="mt-1 text-sm text-yellow-600">No models available. Click to refresh.</p>
          )}
        </div>
      )}

      {/* LLM Parameters - only show if showAdvancedParams is true */}
      {showAdvancedParams && (
        <div className={`grid grid-cols-1 gap-4 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-3'}`}>
          {/* Temperature */}
          <div>
            <label
              htmlFor="temperature"
              className="flex items-center gap-1 text-sm font-medium text-gray-700"
            >
              Temperature
              <span title="Controls randomness (0.0 = deterministic, 2.0 = very random)">
                <Info className="h-4 w-4 text-gray-400" />
              </span>
            </label>
            <input
              type="number"
              id="temperature"
              min="0"
              max="2"
              step="0.1"
              value={value.temperature}
              onChange={(e) => handleFieldChange('temperature', parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">0.0 - 2.0</p>
          </div>

          {/* Max Tokens */}
          <div>
            <label
              htmlFor="max_tokens"
              className="flex items-center gap-1 text-sm font-medium text-gray-700"
            >
              Max Tokens
              <span title="Maximum number of tokens to generate">
                <Info className="h-4 w-4 text-gray-400" />
              </span>
            </label>
            <input
              type="number"
              id="max_tokens"
              min="1"
              max="32000"
              step="1"
              value={value.max_tokens}
              onChange={(e) => handleFieldChange('max_tokens', parseInt(e.target.value, 10))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">1 - 32000</p>
          </div>

          {/* Top P */}
          <div>
            <label
              htmlFor="top_p"
              className="flex items-center gap-1 text-sm font-medium text-gray-700"
            >
              Top P
              <span title="Nucleus sampling threshold">
                <Info className="h-4 w-4 text-gray-400" />
              </span>
            </label>
            <input
              type="number"
              id="top_p"
              min="0"
              max="1"
              step="0.1"
              value={value.top_p}
              onChange={(e) => handleFieldChange('top_p', parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">0.0 - 1.0</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified LLM Selector for scenario generation
 * Only shows provider and model dropdowns without advanced params
 */
export function SimpleLLMSelector({
  provider,
  model,
  onProviderChange,
  onModelChange,
  error,
}: {
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  error?: string;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [models, setModels] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null);

  // Fetch providers with status
  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const response = await fetch(`${apiUrl}/api/llm/providers-with-status`);
        if (response.ok) {
          const data = await response.json();
          setProviders(data.providers || []);
        }
      } catch (err) {
        console.error('Failed to fetch providers:', err);
        // Fallback
        setProviders([
          {
            value: 'deepseek',
            label: 'DeepSeek',
            configured: false,
            envVariable: 'DEEPSEEK_API_KEY',
          },
          { value: 'openai', label: 'OpenAI', configured: false, envVariable: 'OPENAI_API_KEY' },
          {
            value: 'anthropic',
            label: 'Anthropic',
            configured: false,
            envVariable: 'ANTHROPIC_API_KEY',
          },
          {
            value: 'openrouter',
            label: 'OpenRouter',
            configured: false,
            envVariable: 'OPENROUTER_API_KEY',
          },
          { value: 'grok', label: 'Grok (X.AI)', configured: false, envVariable: 'GROK_API_KEY' },
          {
            value: 'gemini',
            label: 'Google Gemini',
            configured: false,
            envVariable: 'GEMINI_API_KEY',
          },
        ]);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, [apiUrl]);

  // Fetch models when provider changes
  useEffect(() => {
    if (!provider) {
      setModels([]);
      return;
    }

    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const response = await fetch(`${apiUrl}/api/llm/models?provider=${provider}`);
        if (response.ok) {
          const data = await response.json();
          setModels(data.models || []);
          // Auto-select first model if none selected
          if (!model && data.models?.length > 0) {
            onModelChange(data.models[0].value);
          }
        }
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setModels([]);
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();

    // Update API key status
    const p = providers.find((p) => p.value === provider);
    setApiKeyConfigured(p?.configured ?? null);
  }, [provider, providers, apiUrl, model, onModelChange]);

  const currentProvider = providers.find((p) => p.value === provider);

  return (
    <div className="space-y-4">
      {/* Provider */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          LLM Provider <span className="text-red-500">*</span>
        </label>
        <select
          value={provider}
          onChange={(e) => {
            onProviderChange(e.target.value);
            onModelChange(''); // Reset model
          }}
          disabled={loadingProviders}
          className={`mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 ${
            apiKeyConfigured === false
              ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        >
          <option value="">{loadingProviders ? 'Loading...' : 'Select provider...'}</option>
          {providers.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} {p.configured ? '✓' : '(no key)'}
            </option>
          ))}
        </select>
      </div>

      {/* API Key Warning */}
      {provider && apiKeyConfigured === false && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-yellow-800">
              API key not configured for {currentProvider?.label || provider}
            </p>
            <p className="mt-1 text-yellow-700">
              Add {currentProvider?.envVariable} in{' '}
              <Link href="/settings" className="font-medium underline hover:text-yellow-900">
                Settings
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Model */}
      {provider && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Model <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={loadingModels}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{loadingModels ? 'Loading models...' : 'Select model...'}</option>
              {models.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {loadingModels && (
              <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
