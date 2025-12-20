'use client';

import { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  FileText,
} from 'lucide-react';
import { LiveProgress } from '@/components/live-progress';

interface ExperimentDetails {
  experimentId: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  totalTrials: number;
  completedTrials: number;
  failedTrials: number;
  startedAt?: string;
  completedAt?: string;
  config: {
    domains: string[];
    tiers: string[];
    models: string[];
    toolConfigs: Array<{
      configId: string;
      name: string;
      description: string;
    }>;
    repetitionsPerDomainTier: number;
    parallelism: number;
    timeout: number;
  };
}

export default function ExperimentDetailPage({ params }: { params: { id: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  const [experiment, setExperiment] = useState<ExperimentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchExperiment();
    const interval = setInterval(fetchExperiment, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [params.id]);

  const fetchExperiment = async () => {
    try {
      const response = await fetch(`${apiUrl}/experiments/${params.id}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch experiment');
      }
      const data = await response.json();
      setExperiment(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    setActionLoading(action);
    try {
      const endpoint =
        action === 'start'
          ? `/experiments/${params.id}/start`
          : `/experiments/${params.id}/${action}`;

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} experiment`);
      }

      await fetchExperiment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !experiment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !experiment) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-900">Error: {error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!experiment) return null;

  const getStatusBadge = (status: ExperimentDetails['status']) => {
    const badges = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
      running: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Loader2 },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Pause },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${badge.bg} ${badge.text}`}
      >
        <Icon className={`h-4 w-4 ${status === 'running' ? 'animate-spin' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const progress =
    experiment.totalTrials > 0 ? (experiment.completedTrials / experiment.totalTrials) * 100 : 0;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{experiment.name}</h1>
              <p className="mt-1 text-sm text-gray-500">ID: {experiment.experimentId}</p>
            </div>
            {getStatusBadge(experiment.status)}
          </div>
          {experiment.description && <p className="mt-2 text-gray-600">{experiment.description}</p>}
        </div>

        {/* Progress Bar */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Progress</h3>
            <span className="text-sm text-gray-600">
              {experiment.completedTrials} / {experiment.totalTrials} trials
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>{progress.toFixed(1)}% complete</span>
            {experiment.failedTrials > 0 && (
              <span className="text-red-600">{experiment.failedTrials} failed</span>
            )}
          </div>
        </div>

        {/* Live Progress Tracking */}
        {(experiment.status === 'running' || experiment.status === 'paused') && (
          <LiveProgress
            experimentId={experiment.experimentId}
            totalTrials={experiment.totalTrials}
            onComplete={fetchExperiment}
          />
        )}

        {/* Control Panel */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Execution Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleAction('start')}
              disabled={
                experiment.status === 'running' ||
                experiment.status === 'completed' ||
                actionLoading === 'start'
              }
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === 'start' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start
            </button>

            <button
              onClick={() => handleAction('pause')}
              disabled={experiment.status !== 'running' || actionLoading === 'pause'}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === 'pause' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              Pause
            </button>

            <button
              onClick={() => handleAction('resume')}
              disabled={experiment.status !== 'paused' || actionLoading === 'resume'}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === 'resume' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Resume
            </button>

            <button
              onClick={() => handleAction('stop')}
              disabled={
                experiment.status === 'completed' ||
                experiment.status === 'failed' ||
                actionLoading === 'stop'
              }
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === 'stop' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Stop
            </button>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Experiment Configuration */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Domains</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {experiment.config.domains.map((domain) => (
                    <span
                      key={domain}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {domain}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Complexity Tiers</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {experiment.config.tiers.map((tier) => (
                    <span
                      key={tier}
                      className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
                    >
                      {tier}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Models</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {experiment.config.models.map((model) => (
                    <span
                      key={model}
                      className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                    >
                      {model}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Repetitions per Domain/Tier</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {experiment.config.repetitionsPerDomainTier}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Parallelism</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {experiment.config.parallelism} concurrent trials
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Timeout</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {experiment.config.timeout / 1000}s per trial
                </dd>
              </div>
            </dl>
          </div>

          {/* Tool Configurations */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tool Configurations</h3>
            <div className="space-y-3">
              {experiment.config.toolConfigs.map((config) => (
                <div
                  key={config.configId}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{config.name}</h4>
                      <p className="mt-1 text-xs text-gray-600">{config.description}</p>
                    </div>
                    <code className="text-xs font-mono text-gray-500">{config.configId}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timing Information */}
        {(experiment.startedAt || experiment.completedAt) && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timing</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              {experiment.startedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Started At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(experiment.startedAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {experiment.completedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completed At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(experiment.completedAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Quick Actions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/experiments/${params.id}/results`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              View Results
            </a>
            <a
              href={`/experiments/${params.id}/errors`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <AlertCircle className="h-4 w-4" />
              View Errors ({experiment.failedTrials})
            </a>
            <a
              href={`/experiments/${params.id}/export`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Export Data
            </a>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-900">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
