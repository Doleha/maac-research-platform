'use client';

import { useState, useEffect } from 'react';
import { Brain, Save, Loader2, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';

interface MemorySettings {
  enabled: boolean;
  webhookUrl: string;
  groupId: string;
  neo4jStats?: {
    nodes: number;
    relationships: number;
    labels: string[];
  };
}

export function MemoryServiceSettings() {
  const [settings, setSettings] = useState<MemorySettings>({
    enabled: false,
    webhookUrl: '',
    groupId: '',
  });
  const [saving, setSaving] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/memory');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (err) {
      console.error('Failed to fetch memory settings', err);
    }
  };

  const fetchGraphStats = async () => {
    if (!settings.enabled) return;

    setLoadingStats(true);
    try {
      const response = await fetch('http://localhost:3001/api/memory/stats');
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, neo4jStats: data.stats }));
      }
    } catch (err) {
      console.error('Failed to fetch graph stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:3001/api/settings/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save memory settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Memory Service (Graphiti)</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure long-term memory integration with Neo4j graph database
          </p>
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
          {saving ? 'Saving...' : success ? 'Saved!' : 'Save Settings'}
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

      <div className="space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Enable Memory Service</h3>
              <p className="text-xs text-gray-500">
                Activate Graphiti for long-term memory and knowledge graphs
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300"></div>
          </label>
        </div>

        {/* Webhook URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Graphiti Webhook URL
          </label>
          <input
            type="text"
            value={settings.webhookUrl}
            onChange={(e) => setSettings((prev) => ({ ...prev, webhookUrl: e.target.value }))}
            placeholder="https://your-graphiti-instance.com/webhook"
            disabled={!settings.enabled}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Group ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group ID</label>
          <input
            type="text"
            value={settings.groupId}
            onChange={(e) => setSettings((prev) => ({ ...prev, groupId: e.target.value }))}
            placeholder="maac-research-group"
            disabled={!settings.enabled}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            Unique identifier for grouping related memory entries
          </p>
        </div>

        {/* Graph Statistics */}
        {settings.enabled && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Neo4j Graph Statistics</h3>
              </div>
              <button
                onClick={fetchGraphStats}
                disabled={loadingStats}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStats ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
              </button>
            </div>

            {settings.neo4jStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Nodes</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {settings.neo4jStats.nodes.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Relationships</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {settings.neo4jStats.relationships.toLocaleString()}
                  </p>
                </div>
                {settings.neo4jStats.labels && settings.neo4jStats.labels.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-2">Node Labels</p>
                    <div className="flex flex-wrap gap-2">
                      {settings.neo4jStats.labels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Click Refresh to load graph statistics</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
