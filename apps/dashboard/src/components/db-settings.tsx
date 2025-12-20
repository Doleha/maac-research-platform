'use client';

import { useState, useEffect } from 'react';
import { Database, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface DBConnection {
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'unknown';
  version?: string;
  metadata?: Record<string, any>;
}

export function DatabaseSettings() {
  const [connections, setConnections] = useState<DBConnection[]>([
    { name: 'PostgreSQL', url: '', status: 'unknown' },
    { name: 'Neo4j', url: '', status: 'unknown' },
    { name: 'Redis', url: '', status: 'unknown' },
  ]);
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/settings/databases');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || connections);
      }
    } catch (err) {
      console.error('Failed to fetch database connections', err);
    }
  };

  const testConnection = async (name: string) => {
    setTesting(name);
    try {
      const response = await fetch('http://localhost:3000/api/settings/test-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: name.toLowerCase() }),
      });

      const data = await response.json();

      setConnections((prev) =>
        prev.map((conn) =>
          conn.name === name
            ? {
                ...conn,
                status: data.success ? 'connected' : 'disconnected',
                version: data.version,
                metadata: data.metadata,
              }
            : conn,
        ),
      );
    } catch (err) {
      setConnections((prev) =>
        prev.map((conn) =>
          conn.name === name ? { ...conn, status: 'disconnected' as const } : conn,
        ),
      );
    } finally {
      setTesting(null);
    }
  };

  const updateURL = (name: string, url: string) => {
    setConnections((prev) => prev.map((conn) => (conn.name === name ? { ...conn, url } : conn)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/settings/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connections }),
      });

      if (!response.ok) {
        throw new Error('Failed to save database settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: DBConnection['status']) => {
    const badges = {
      connected: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
      disconnected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      unknown: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Database },
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPlaceholder = (name: string) => {
    const placeholders: Record<string, string> = {
      PostgreSQL: 'postgresql://user:password@localhost:5432/maac',
      Neo4j: 'neo4j://localhost:7687',
      Redis: 'redis://localhost:6379',
    };
    return placeholders[name] || '';
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Database Connections</h2>
          <p className="mt-1 text-sm text-gray-500">Configure database connection strings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          Save Settings
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {connections.map((conn) => (
          <div key={conn.name} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">{conn.name}</h3>
              </div>
              {getStatusBadge(conn.status)}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={conn.url}
                onChange={(e) => updateURL(conn.name, e.target.value)}
                placeholder={getPlaceholder(conn.name)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => testConnection(conn.name)}
                disabled={!conn.url || testing === conn.name}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing === conn.name ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Test
              </button>
            </div>

            {conn.status === 'connected' && (
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                {conn.version && (
                  <p>
                    <span className="font-medium">Version:</span> {conn.version}
                  </p>
                )}
                {conn.metadata && Object.keys(conn.metadata).length > 0 && (
                  <div>
                    <span className="font-medium">Metadata:</span>
                    <pre className="mt-1 rounded bg-gray-100 p-2 font-mono text-xs">
                      {JSON.stringify(conn.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
