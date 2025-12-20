'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, Loader2, Timer, Activity, TrendingUp } from 'lucide-react';

interface Job {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'failed' | 'waiting' | 'delayed';
  data: {
    experimentId: string;
    scenarioId: string;
    trialId: string;
    modelId: string;
    configId: string;
  };
  progress?: number;
  timestamp: string;
  processedOn?: string;
  finishedOn?: string;
  failedReason?: string;
  attemptsMade?: number;
  delay?: number;
}

interface QueueStats {
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface QueueMonitorProps {
  experimentId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function QueueMonitor({
  experimentId,
  autoRefresh = true,
  refreshInterval = 2000,
}: QueueMonitorProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    active: 0,
    waiting: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQueueData();
    if (autoRefresh) {
      const interval = setInterval(fetchQueueData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [experimentId, autoRefresh, refreshInterval]);

  const fetchQueueData = async () => {
    try {
      const url = experimentId
        ? `http://localhost:3001/api/queue?experimentId=${experimentId}`
        : 'http://localhost:3001/api/queue';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch queue data');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setStats(data.stats || stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getJobStatusBadge = (status: Job['status']) => {
    const badges = {
      active: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Loader2 },
      waiting: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      delayed: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Timer },
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        <Icon className={`h-3 w-3 ${status === 'active' ? 'animate-spin' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-red-900">Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{stats.active}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Waiting</p>
              <p className="mt-1 text-2xl font-bold text-gray-600">{stats.waiting}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-600 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delayed</p>
              <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.delayed}</p>
            </div>
            <Timer className="h-8 w-8 text-yellow-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Jobs ({jobs.length})</h3>
          <button
            onClick={fetchQueueData}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <TrendingUp className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">No jobs in queue</p>
            <p className="mt-1 text-xs text-gray-500">
              Jobs will appear here when experiments are running
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{job.name}</h4>
                      {getJobStatusBadge(job.status)}
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                      <div>
                        <span className="font-medium">Trial ID:</span>{' '}
                        <code className="font-mono">{job.data.trialId.substring(0, 8)}</code>
                      </div>
                      <div>
                        <span className="font-medium">Model:</span>{' '}
                        <span className="font-mono">{job.data.modelId}</span>
                      </div>
                      <div>
                        <span className="font-medium">Scenario:</span>{' '}
                        <code className="font-mono">{job.data.scenarioId.substring(0, 8)}</code>
                      </div>
                      <div>
                        <span className="font-medium">Config:</span>{' '}
                        <code className="font-mono">{job.data.configId}</code>
                      </div>
                    </div>

                    {job.status === 'active' && typeof job.progress === 'number' && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {job.failedReason && (
                      <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-800">
                        <span className="font-medium">Error:</span> {job.failedReason}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      {job.processedOn && <span>Started {formatTimestamp(job.processedOn)}</span>}
                      {job.finishedOn && <span> • Finished {formatTimestamp(job.finishedOn)}</span>}
                      {!job.processedOn && !job.finishedOn && (
                        <span>Queued {formatTimestamp(job.timestamp)}</span>
                      )}
                      {job.attemptsMade && job.attemptsMade > 1 && (
                        <span className="ml-2 text-yellow-600">• Attempt #{job.attemptsMade}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
