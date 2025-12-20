'use client';

import { useState } from 'react';
import { Key, Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';

export type APIKeyMode = 'own' | 'system';

export interface SessionAPIKeys {
  openai?: string;
  anthropic?: string;
  deepseek?: string;
  openrouter?: string;
  grok?: string;
  gemini?: string;
  llama?: string;
}

interface APIKeyModeProps {
  mode: APIKeyMode;
  onModeChange: (mode: APIKeyMode) => void;
  sessionKeys: SessionAPIKeys;
  onSessionKeysChange: (keys: SessionAPIKeys) => void;
  selectedProvider?: string;
  userCredits?: number;
}

export function APIKeyModeSelector({
  mode,
  onModeChange,
  sessionKeys,
  onSessionKeysChange,
  selectedProvider,
  userCredits = 0,
}: APIKeyModeProps) {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const updateSessionKey = (provider: string, value: string) => {
    onSessionKeysChange({ ...sessionKeys, [provider]: value });
  };

  const providers = [
    { key: 'openai', label: 'OpenAI', placeholder: 'sk-proj-...' },
    { key: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
    { key: 'deepseek', label: 'DeepSeek', placeholder: 'sk-...' },
    { key: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-...' },
    { key: 'grok', label: 'Grok (X.AI)', placeholder: 'xai-...' },
    { key: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
    { key: 'llama', label: 'Meta Llama', placeholder: 'hf_...' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          API Key Mode <span className="text-red-500">*</span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Own API Keys */}
          <button
            type="button"
            onClick={() => onModeChange('own')}
            className={`relative rounded-lg border-2 p-4 text-left transition-all ${
              mode === 'own'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  mode === 'own' ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                <Key className={`h-5 w-5 ${mode === 'own' ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Use My API Keys</h3>
                <p className="mt-1 text-xs text-gray-600">
                  Provide your own API keys for this experiment only. Not saved to your account.
                </p>
              </div>
              {mode === 'own' && (
                <div className="absolute right-3 top-3">
                  <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>

          {/* System Credits */}
          <button
            type="button"
            onClick={() => onModeChange('system')}
            className={`relative rounded-lg border-2 p-4 text-left transition-all ${
              mode === 'system'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  mode === 'system' ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                <Zap
                  className={`h-5 w-5 ${mode === 'system' ? 'text-blue-600' : 'text-gray-600'}`}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Use System Credits</h3>
                <p className="mt-1 text-xs text-gray-600">
                  Use token credits from your account balance. Purchase credits in Settings.
                </p>
                <p className="mt-2 text-xs font-medium text-blue-600">
                  Balance: {userCredits.toLocaleString()} credits
                </p>
              </div>
              {mode === 'system' && (
                <div className="absolute right-3 top-3">
                  <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Session API Keys Input (shown when mode is 'own') */}
      {mode === 'own' && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium">Session-Only API Keys</p>
              <p className="mt-1 text-xs text-gray-600">
                These keys are only used for this experiment and will not be saved to your account.
                {selectedProvider && ` Provide the API key for ${selectedProvider}.`}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {providers.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {label} API Key{' '}
                  {selectedProvider === key && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showKeys[key] ? 'text' : 'password'}
                    value={sessionKeys[key as keyof SessionAPIKeys] || ''}
                    onChange={(e) => updateSessionKey(key, e.target.value)}
                    placeholder={placeholder}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(key)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Credits Warning */}
      {mode === 'system' && userCredits < 1000 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Low Credit Balance</p>
              <p className="mt-1">
                Your credit balance is low. Consider purchasing more credits in Settings to avoid
                experiment interruptions.
              </p>
              <a
                href="/settings#billing"
                className="mt-2 inline-block text-xs font-medium text-yellow-900 underline hover:text-yellow-700"
              >
                Go to Billing →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
