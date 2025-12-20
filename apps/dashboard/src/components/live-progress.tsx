'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  AlertCircle,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface Trial {
  trial_id: string;
  replication_number: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  overall_maac_score: number | null;
  started_at: string | null;
  completed_at: string | null;
  error_message?: string;
}

interface ProgressUpdate {
  experiment_id: string;
  status: string;
  completed_trials: number;
  total_trials: number;
  current_trial?: Trial;
  average_score?: number;
  estimated_completion?: string;
}

interface LiveProgressProps {
  experimentId: string;
  totalTrials: number;
  onComplete?: () => void;
}

export function LiveProgress({ experimentId, totalTrials: _totalTrials, onComplete }: LiveProgressProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource(
      `http://localhost:3001/api/experiments/${experimentId}/progress`,
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressUpdate = JSON.parse(event.data);
        setProgress(data);

        // Update trials list
        if (data.current_trial) {
          setTrials((prev) => {
            const existing = prev.findIndex((t) => t.trial_id === data.current_trial!.trial_id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = data.current_trial!;
              return updated;
            }
            return [...prev, data.current_trial!];
          });
        }

        // Check if experiment completed
        if (data.status === 'completed' || data.status === 'failed') {
          eventSource.close();
          setIsConnected(false);
          onComplete?.();
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      setError('Connection lost. Retrying...');
      setIsConnected(false);
      eventSource.close();
    };

    // Cleanup
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [experimentId, onComplete]);

  if (!progress && !error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Connecting to experiment...</span>
        </div>
      </div>
    );
  }

  const completionPercentage = progress
    ? (progress.completed_trials / progress.total_trials) * 100
    : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
              <span className="text-sm font-medium text-gray-700">Live Updates Active</span>
            </>
          ) : (
            <>
              <div className="h-3 w-3 rounded-full bg-gray-400" />
              <span className="text-sm font-medium text-gray-700">Disconnected</span>
            </>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      {/* Overall Progress */}
      {progress && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Experiment Progress</h3>
              <p className="text-sm text-gray-600">
                {progress.completed_trials} of {progress.total_trials} trials completed
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(progress.status)}
              <span className="text-sm font-medium capitalize text-gray-700">
                {progress.status}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                {completionPercentage.toFixed(1)}% Complete
              </span>
              {progress.estimated_completion && (
                <span className="text-gray-500">
                  Est. completion: {new Date(progress.estimated_completion).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <PlayCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-900">
                {progress.completed_trials}
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">Avg Score</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-green-900">
                {progress.average_score !== undefined ? progress.average_score.toFixed(2) : '—'}
              </div>
            </div>

            <div className="rounded-lg bg-purple-50 p-4">
              <div className="flex items-center gap-2 text-purple-700">
                <Activity className="h-5 w-5" />
                <span className="text-sm font-medium">Remaining</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-purple-900">
                {progress.total_trials - progress.completed_trials}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trials Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Trials Timeline</h3>
        <div className="space-y-3">
          {trials.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No trials started yet</p>
          ) : (
            trials
              .sort((a, b) => a.replication_number - b.replication_number)
              .map((trial) => (
                <div
                  key={trial.trial_id}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex-shrink-0">{getStatusIcon(trial.status)}</div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">
                          Trial #{trial.replication_number}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">{trial.trial_id}</span>
                      </div>
                      {trial.overall_maac_score !== null && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Score:</span>
                          <span className="font-semibold text-gray-900">
                            {trial.overall_maac_score.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                      {trial.started_at && (
                        <span>Started: {new Date(trial.started_at).toLocaleTimeString()}</span>
                      )}
                      {trial.completed_at && (
                        <span>Completed: {new Date(trial.completed_at).toLocaleTimeString()}</span>
                      )}
                      {trial.error_message && (
                        <span className="text-red-600">Error: {trial.error_message}</span>
                      )}
                    </div>
                  </div>

                  {trial.status === 'running' && (
                    <div className="flex-shrink-0">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
