'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface RateLimits {
  maxWorkers: number;
  jobsPerMinute: number;
  llmRequestsPerMinute: number;
}

export function RateLimitControls() {
  const [limits, setLimits] = useState<RateLimits>({
    maxWorkers: 4,
    jobsPerMinute: 60,
    llmRequestsPerMinute: 100,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchLimits = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/rate-limits');
      if (response.ok) {
        const data = await response.json();
        setLimits((prev) => data.limits || prev);
      }
    } catch (err) {
      console.error('Failed to fetch rate limits', err);
    }
  }, []);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:3001/api/settings/rate-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits }),
      });

      if (!response.ok) {
        throw new Error('Failed to save rate limits');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rate limits');
    } finally {
      setSaving(false);
    }
  };

  const updateLimit = (key: keyof RateLimits, value: number) => {
    setLimits((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Rate Limiting</h2>
          <p className="mt-1 text-sm text-gray-500">Control concurrency and throughput limits</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : success ? 'Saved!' : 'Save Limits'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Max Workers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Maximum Concurrent Workers</label>
            <span className="text-sm font-semibold text-blue-600">{limits.maxWorkers}</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={limits.maxWorkers}
            onChange={(e) => updateLimit('maxWorkers', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>20</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Number of parallel trial executions. Higher values increase throughput but consume more
            resources.
          </p>
        </div>

        {/* Jobs Per Minute */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Jobs Per Minute</label>
            <span className="text-sm font-semibold text-blue-600">{limits.jobsPerMinute}</span>
          </div>
          <input
            type="range"
            min="10"
            max="300"
            step="10"
            value={limits.jobsPerMinute}
            onChange={(e) => updateLimit('jobsPerMinute', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10</span>
            <span>300</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Maximum number of jobs processed per minute by BullMQ. Controls overall experiment
            throughput.
          </p>
        </div>

        {/* LLM Requests Per Minute */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">LLM Requests Per Minute</label>
            <span className="text-sm font-semibold text-blue-600">
              {limits.llmRequestsPerMinute}
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={limits.llmRequestsPerMinute}
            onChange={(e) => updateLimit('llmRequestsPerMinute', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10</span>
            <span>1000</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Maximum API requests to LLM providers per minute. Stay within provider rate limits to
            avoid throttling.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-yellow-50 p-4">
        <div className="flex items-start gap-2">
          <Settings className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Important:</p>
            <p className="mt-1">
              Changes to rate limits will take effect after the next worker restart. Adjust
              carefully to balance throughput with resource constraints and provider limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
