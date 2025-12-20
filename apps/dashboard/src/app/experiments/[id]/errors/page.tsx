'use client';

import { useEffect, useState } from 'react';
import {
  XCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface FailedTrial {
  trialId: string;
  scenarioId: string;
  modelId: string;
  configId: string;
  error: string;
  stackTrace?: string;
  failedAt: string;
  attemptNumber: number;
  scenarioDetails?: {
    taskTitle: string;
    domain: string;
    tier: string;
  };
}

export default function ExperimentErrorsPage({ params }: { params: { id: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const [trials, setTrials] = useState<FailedTrial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTrials, setExpandedTrials] = useState<Set<string>>(new Set());
  const [selectedTrials, setSelectedTrials] = useState<Set<string>>(new Set());
  const [retryingTrials, setRetryingTrials] = useState<Set<string>>(new Set());
  const [batchRetrying, setBatchRetrying] = useState(false);

  useEffect(() => {
    fetchFailedTrials();
  }, [params.id]);

  const fetchFailedTrials = async () => {
    try {
      const response = await fetch(`${apiUrl}/experiments/${params.id}/errors`);
      if (!response.ok) {
        throw new Error('Failed to fetch error logs');
      }
      const data = await response.json();
      setTrials(data.failedTrials || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (trialId: string) => {
    const newExpanded = new Set(expandedTrials);
    if (newExpanded.has(trialId)) {
      newExpanded.delete(trialId);
    } else {
      newExpanded.add(trialId);
    }
    setExpandedTrials(newExpanded);
  };

  const toggleSelected = (trialId: string) => {
    const newSelected = new Set(selectedTrials);
    if (newSelected.has(trialId)) {
      newSelected.delete(trialId);
    } else {
      newSelected.add(trialId);
    }
    setSelectedTrials(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTrials.size === trials.length) {
      setSelectedTrials(new Set());
    } else {
      setSelectedTrials(new Set(trials.map((t) => t.trialId)));
    }
  };

  const retryTrial = async (trialId: string) => {
    setRetryingTrials((prev) => new Set(prev).add(trialId));
    try {
      const response = await fetch(`${apiUrl}/experiments/${params.id}/trials/${trialId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to retry trial');
      }

      // Refresh the failed trials list
      await fetchFailedTrials();

      // Remove from selected if it was selected
      const newSelected = new Set(selectedTrials);
      newSelected.delete(trialId);
      setSelectedTrials(newSelected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry trial');
    } finally {
      setRetryingTrials((prev) => {
        const newSet = new Set(prev);
        newSet.delete(trialId);
        return newSet;
      });
    }
  };

  const retryBatch = async () => {
    if (selectedTrials.size === 0) return;

    setBatchRetrying(true);
    try {
      const response = await fetch(`${apiUrl}/experiments/${params.id}/trials/retry-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialIds: Array.from(selectedTrials) }),
      });

      if (!response.ok) {
        throw new Error('Failed to retry trials');
      }

      await fetchFailedTrials();
      setSelectedTrials(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry trials');
    } finally {
      setBatchRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/experiments/${params.id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Experiment
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Error Logs</h1>
              <p className="mt-1 text-sm text-gray-500">Experiment ID: {params.id}</p>
            </div>
            <button
              onClick={fetchFailedTrials}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
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

        {/* Batch Actions */}
        {trials.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {selectedTrials.size === trials.length ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                  Select All
                </button>
                {selectedTrials.size > 0 && (
                  <span className="text-sm text-gray-600">{selectedTrials.size} selected</span>
                )}
              </div>
              {selectedTrials.size > 0 && (
                <button
                  onClick={retryBatch}
                  disabled={batchRetrying}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {batchRetrying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Retry Selected ({selectedTrials.size})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Failed Trials List */}
        {trials.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No failed trials</h3>
            <p className="mt-2 text-sm text-gray-500">
              All trials completed successfully or are still running
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Failed Trials ({trials.length})
              </h2>
            </div>

            {trials.map((trial) => {
              const isExpanded = expandedTrials.has(trial.trialId);
              const isSelected = selectedTrials.has(trial.trialId);
              const isRetrying = retryingTrials.has(trial.trialId);

              return (
                <div
                  key={trial.trialId}
                  className="rounded-lg border border-red-200 bg-white shadow-sm"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleSelected(trial.trialId)}
                        className="mt-1 shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900">
                              {trial.scenarioDetails?.taskTitle || 'Unknown Task'}
                            </h3>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs">
                              <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-gray-700">
                                {trial.trialId.substring(0, 12)}
                              </code>
                              <span className="rounded bg-red-100 px-2 py-0.5 text-red-800">
                                {trial.modelId}
                              </span>
                              {trial.scenarioDetails && (
                                <>
                                  <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-800">
                                    {trial.scenarioDetails.domain}
                                  </span>
                                  <span className="rounded bg-purple-100 px-2 py-0.5 text-purple-800">
                                    {trial.scenarioDetails.tier}
                                  </span>
                                </>
                              )}
                              <span className="text-gray-500">Attempt #{trial.attemptNumber}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => retryTrial(trial.trialId)}
                              disabled={isRetrying}
                              className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isRetrying ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              Retry
                            </button>
                            <button
                              onClick={() => toggleExpanded(trial.trialId)}
                              className="rounded p-1 hover:bg-gray-100"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 rounded bg-red-50 p-3">
                          <p className="text-sm font-medium text-red-900">Error Message:</p>
                          <p className="mt-1 text-sm text-red-800 font-mono break-all">
                            {trial.error}
                          </p>
                        </div>

                        {isExpanded && trial.stackTrace && (
                          <div className="mt-3 rounded bg-gray-900 p-3">
                            <p className="mb-2 text-xs font-medium text-gray-300">Stack Trace:</p>
                            <pre className="overflow-x-auto text-xs text-gray-100 whitespace-pre-wrap break-all">
                              {trial.stackTrace}
                            </pre>
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500">
                          Failed at: {new Date(trial.failedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
