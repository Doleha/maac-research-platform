'use client';

import { useState, useEffect } from 'react';
import { Info, Loader2 } from 'lucide-react';

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
}

const providers = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'grok', label: 'Grok (X.AI)' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'llama', label: 'Meta Llama' },
];

export function LLMSelector({ value, onChange, errors = {} }: LLMSelectorProps) {
  const [availableModels, setAvailableModels] = useState<Array<{ value: string; label: string }>>(
    [],
  );
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // Fetch models from actual provider APIs
  const fetchModels = async (provider: string, forceRefresh: boolean = false) => {
    if (!provider) {
      setAvailableModels([]);
      return;
    }

    setLoadingModels(true);
    setModelError(null);

    try {
      const url = `http://localhost:3001/api/llm/models?provider=${provider}${forceRefresh ? '&refresh=true' : ''}`;
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
  };

  // Fetch models when provider changes
  useEffect(() => {
    if (value.provider) {
      fetchModels(value.provider);
    } else {
      setAvailableModels([]);
    }
  }, [value.provider]);

  const handleProviderChange = (provider: string) => {
    // Reset model when provider changes (will be set after models load)
    onChange({ ...value, provider, model: '' });
  };

  // Auto-select first model when models load
  useEffect(() => {
    if (availableModels.length > 0 && !value.model) {
      onChange({ ...value, model: availableModels[0].value });
    }
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

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div>
        <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
          LLM Provider <span className="text-red-500">*</span>
        </label>
        <select
          id="provider"
          value={value.provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
            errors.provider
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        >
          <option value="">Select a provider...</option>
          {providers.map((provider) => (
            <option key={provider.value} value={provider.value}>
              {provider.label}
            </option>
          ))}
        </select>
        {errors.provider && <p className="mt-1 text-sm text-red-600">{errors.provider}</p>}
      </div>

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

      {/* LLM Parameters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
    </div>
  );
}
