'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Loader2,
  XCircle,
  CheckSquare,
  Square,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Search,
} from 'lucide-react';

interface ExperimentSummary {
  experimentId: string;
  name: string;
  status: string;
  totalTrials: number;
  completedTrials: number;
  avgMAACScore: number;
  dimensionalScores: {
    cognitiveLoad: number;
    toolExecution: number;
    contentQuality: number;
    memoryIntegration: number;
    complexityHandling: number;
    hallucinationControl: number;
    knowledgeTransfer: number;
    processingEfficiency: number;
    constructValidity: number;
  };
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  };
}

const DIMENSIONS = [
  { key: 'cognitiveLoad', label: 'Cognitive Load' },
  { key: 'toolExecution', label: 'Tool Execution' },
  { key: 'contentQuality', label: 'Content Quality' },
  { key: 'memoryIntegration', label: 'Memory Integration' },
  { key: 'complexityHandling', label: 'Complexity Handling' },
  { key: 'hallucinationControl', label: 'Hallucination Control' },
  { key: 'knowledgeTransfer', label: 'Knowledge Transfer' },
  { key: 'processingEfficiency', label: 'Processing Efficiency' },
  { key: 'constructValidity', label: 'Construct Validity' },
] as const;

function ComparePageContent() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  const searchParams = useSearchParams();
  const [experiments, setExperiments] = useState<ExperimentSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ExperimentSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExperiments();

    // Pre-select experiments from URL params
    const ids = searchParams?.get('ids')?.split(',').filter(Boolean);
    if (ids?.length) {
      setSelectedIds(new Set(ids));
    }
  }, [searchParams]);

  const fetchExperiments = async () => {
    try {
      const response = await fetch(`${apiUrl}/experiments`);
      if (!response.ok) {
        throw new Error('Failed to fetch experiments');
      }
      const data = await response.json();
      setExperiments(data.experiments || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (newSelected.size < 5) {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const compareExperiments = async () => {
    if (selectedIds.size < 2) return;

    setComparing(true);
    try {
      const ids = Array.from(selectedIds);
      const response = await fetch(`${apiUrl}/experiments/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentIds: ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare experiments');
      }

      const data = await response.json();
      setComparisonData(data.experiments || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare experiments');
    } finally {
      setComparing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.0) return 'text-green-600';
    if (score >= 3.0) return 'text-blue-600';
    if (score >= 2.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 4.0) return 'bg-green-100';
    if (score >= 3.0) return 'bg-blue-100';
    if (score >= 2.0) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getDifference = (
    exp1: ExperimentSummary,
    exp2: ExperimentSummary,
    key: keyof ExperimentSummary['dimensionalScores'],
  ) => {
    return exp1.dimensionalScores[key] - exp2.dimensionalScores[key];
  };

  const filteredExperiments = experiments.filter(
    (exp) =>
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.experimentId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Compare Experiments</h1>
          <p className="mt-2 text-gray-600">
            Select 2-5 experiments to compare their MAAC performance
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-900">{error}</span>
            </div>
          </div>
        )}

        {/* Experiment Selection */}
        {comparisonData.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Experiments ({selectedIds.size}/5)
              </h2>
              <button
                onClick={compareExperiments}
                disabled={selectedIds.size < 2 || comparing}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {comparing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                Compare Selected
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search experiments..."
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredExperiments.map((exp) => {
                const isSelected = selectedIds.has(exp.experimentId);
                const canSelect = isSelected || selectedIds.size < 5;

                return (
                  <button
                    key={exp.experimentId}
                    onClick={() => canSelect && toggleSelection(exp.experimentId)}
                    disabled={!canSelect}
                    className={`w-full text-left rounded-lg border p-4 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-3">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                      ) : (
                        <Square className="h-5 w-5 shrink-0 text-gray-400 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{exp.name}</h3>
                        <p className="mt-1 text-xs text-gray-500">ID: {exp.experimentId}</p>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            {exp.completedTrials} / {exp.totalTrials} trials
                          </span>
                          <span className={`font-semibold ${getScoreColor(exp.avgMAACScore)}`}>
                            Avg: {exp.avgMAACScore.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {comparisonData.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Comparison Results ({comparisonData.length} Experiments)
              </h2>
              <button
                onClick={() => {
                  setComparisonData([]);
                  setSelectedIds(new Set());
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                New Comparison
              </button>
            </div>

            {/* Overall Scores */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Scores</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {comparisonData.map((exp) => (
                  <div
                    key={exp.experimentId}
                    className={`rounded-lg border p-4 ${getScoreBgColor(exp.avgMAACScore)}`}
                  >
                    <h4 className="font-medium text-gray-900">{exp.name}</h4>
                    <p className="mt-2 text-3xl font-bold ${getScoreColor(exp.avgMAACScore)}">
                      {exp.avgMAACScore.toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">Average MAAC Score</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dimensional Comparison Table */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Dimensional Scores Comparison
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dimension
                      </th>
                      {comparisonData.map((exp) => (
                        <th
                          key={exp.experimentId}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {exp.name}
                        </th>
                      ))}
                      {comparisonData.length === 2 && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Difference
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {DIMENSIONS.map((dim) => (
                      <tr key={dim.key}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {dim.label}
                        </td>
                        {comparisonData.map((exp) => {
                          const score = exp.dimensionalScores[dim.key];
                          return (
                            <td
                              key={exp.experimentId}
                              className="whitespace-nowrap px-6 py-4 text-sm"
                            >
                              <span className={`font-semibold ${getScoreColor(score)}`}>
                                {score.toFixed(2)}
                              </span>
                            </td>
                          );
                        })}
                        {comparisonData.length === 2 && (
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {(() => {
                              const diff = getDifference(
                                comparisonData[0],
                                comparisonData[1],
                                dim.key,
                              );
                              return (
                                <span className="flex items-center gap-1">
                                  {diff > 0.1 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  ) : diff < -0.1 ? (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <Minus className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span
                                    className={
                                      diff > 0
                                        ? 'text-green-600'
                                        : diff < 0
                                          ? 'text-red-600'
                                          : 'text-gray-600'
                                    }
                                  >
                                    {diff > 0 ? '+' : ''}
                                    {diff.toFixed(2)}
                                  </span>
                                </span>
                              );
                            })()}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statistical Summary */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistical Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experiment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mean
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Median
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Std Dev
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Min
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Max
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trials
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {comparisonData.map((exp) => (
                      <tr key={exp.experimentId}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {exp.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {exp.statistics.mean.toFixed(3)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {exp.statistics.median.toFixed(3)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {exp.statistics.stdDev.toFixed(3)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {exp.statistics.min.toFixed(3)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {exp.statistics.max.toFixed(3)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {exp.completedTrials}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ExperimentComparePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}
