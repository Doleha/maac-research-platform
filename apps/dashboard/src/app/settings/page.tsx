'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Settings,
  CreditCard,
} from 'lucide-react';
import { DatabaseSettings } from '@/components/db-settings';
import { MemoryServiceSettings } from '@/components/memory-settings';
import { RateLimitControls } from '@/components/rate-limits';
import { BillingCredits } from '@/components/billing-credits';

interface LLMCredentials {
  openai?: string;
  anthropic?: string;
  deepseek?: string;
  openrouter?: string;
}

interface TestResult {
  provider: string;
  success: boolean;
  message: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'billing'>('general');
  const [credentials, setCredentials] = useState<LLMCredentials>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/settings/credentials');
      if (response.ok) {
        const data = await response.json();
        // Don't show actual keys, just indicate if they exist
        setCredentials(
          Object.keys(data.credentials || {}).reduce((acc, key) => {
            acc[key as keyof LLMCredentials] = data.credentials[key] ? '••••••••' : '';
            return acc;
          }, {} as LLMCredentials),
        );
      }
    } catch (err) {
      console.error('Failed to fetch credentials', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('http://localhost:3000/api/settings/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials }),
      });

      if (!response.ok) {
        throw new Error('Failed to save credentials');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (provider: string) => {
    setTesting(provider);
    setTestResults((prev) => ({
      ...prev,
      [provider]: { provider, success: false, message: 'Testing...' },
    }));

    try {
      const response = await fetch('http://localhost:3000/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();

      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          provider,
          success: data.success,
          message: data.message || (data.success ? 'Connection successful' : 'Connection failed'),
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          provider,
          success: false,
          message: 'Connection test failed',
        },
      }));
    } finally {
      setTesting(null);
    }
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const providers = [
    { key: 'openai', label: 'OpenAI', placeholder: 'sk-proj-...' },
    { key: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
    { key: 'deepseek', label: 'DeepSeek', placeholder: 'sk-...' },
    { key: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-...' },
  ] as const;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Configure system settings and credentials</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Settings className="h-4 w-4" />
              General Settings
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'billing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Billing & Credits
            </button>
          </nav>
        </div>

        {activeTab === 'general' ? (
          <>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-900">{error}</span>
                </div>
              </div>
            )}

            {saveSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Settings saved successfully</span>
                </div>
              </div>
            )}

            {/* LLM Credentials */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">LLM API Credentials</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure API keys for language model providers
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Credentials'}
                </button>
              </div>

              <div className="space-y-4">
                {providers.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {label} API Key
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showKeys[key] ? 'text' : 'password'}
                          value={credentials[key] || ''}
                          onChange={(e) =>
                            setCredentials((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          placeholder={placeholder}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowKey(key)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showKeys[key] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => testConnection(key)}
                        disabled={!credentials[key] || testing === key}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {testing === key ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
                      </button>
                    </div>
                    {testResults[key] && (
                      <div
                        className={`mt-2 flex items-center gap-2 text-sm ${
                          testResults[key].success ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {testResults[key].success ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {testResults[key].message}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Note:</span> API keys are securely stored and
                  encrypted. They are never exposed in API responses.
                </p>
              </div>
            </div>

            {/* Database Configuration */}
            <DatabaseSettings />

            {/* Memory Service */}
            <MemoryServiceSettings />

            {/* Rate Limiting */}
            <RateLimitControls />
          </>
        ) : (
          <BillingCredits />
        )}
      </div>
    </div>
  );
}
