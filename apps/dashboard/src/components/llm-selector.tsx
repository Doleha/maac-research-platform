'use client';

import { Info } from 'lucide-react';

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
];

const modelsByProvider: Record<string, Array<{ value: string; label: string }>> = {
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
    { value: 'openai/gpt-4o', label: 'GPT-4o (via OpenRouter)' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (via OpenRouter)' },
    { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
  ],
};

export function LLMSelector({ value, onChange, errors = {} }: LLMSelectorProps) {
  const availableModels = value.provider ? modelsByProvider[value.provider] || [] : [];

  const handleProviderChange = (provider: string) => {
    // Reset model when provider changes
    const defaultModel = modelsByProvider[provider]?.[0]?.value || '';
    onChange({ ...value, provider, model: defaultModel });
  };

  const handleFieldChange = (field: keyof LLMConfig, fieldValue: string | number) => {
    onChange({ ...value, [field]: fieldValue });
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
          <select
            id="model"
            value={value.model}
            onChange={(e) => handleFieldChange('model', e.target.value)}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
              errors.model
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          >
            <option value="">Select a model...</option>
            {availableModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
          {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
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
