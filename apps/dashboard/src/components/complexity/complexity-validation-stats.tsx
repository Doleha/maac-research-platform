'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationStats {
  summary: {
    totalScenarios: number;
    validatedCount: number;
    validationRate: number;
  };
  complexityByTier: Array<{
    tier: string;
    averageScore: number | null;
    count: number;
  }>;
  tierDistribution: Array<{
    tier: string;
    count: number;
  }>;
  recentFailures: Array<{
    scenarioId: string;
    domain: string;
    tier: string;
    complexityScore: number | null;
    validatedAt: string | null;
  }>;
}

interface ComplexityValidationStatsProps {
  apiUrl?: string;
  refreshInterval?: number; // ms
  onScenarioClick?: (scenarioId: string) => void;
}

/**
 * Overview component showing complexity validation statistics
 */
export function ComplexityValidationStats({
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  refreshInterval = 30000,
  onScenarioClick,
}: ComplexityValidationStatsProps) {
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await fetch(`${apiUrl}/scenarios/validation/stats`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [apiUrl, refreshInterval]);

  if (loading && !stats) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading validation statistics...</span>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading stats: {error}</span>
        </div>
        <button
          onClick={fetchStats}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, complexityByTier, tierDistribution, recentFailures } = stats || {
    summary: { totalScenarios: 0, validatedCount: 0, validationRate: 0 },
    complexityByTier: [],
    tierDistribution: [],
    recentFailures: [],
  };

  // Get validation rate color
  const rateColor =
    summary.validationRate >= 95
      ? 'text-green-600'
      : summary.validationRate >= 80
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Complexity Validation Overview</h2>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchStats}
            className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard
          title="Total Scenarios"
          value={summary.totalScenarios.toLocaleString()}
          icon={BarChart3}
          color="blue"
        />
        <SummaryCard
          title="Validated"
          value={summary.validatedCount.toLocaleString()}
          icon={CheckCircle}
          color="green"
        />
        <SummaryCard
          title="Validation Rate"
          value={`${summary.validationRate.toFixed(1)}%`}
          icon={TrendingUp}
          color={summary.validationRate >= 95 ? 'green' : summary.validationRate >= 80 ? 'yellow' : 'red'}
        />
        <SummaryCard
          title="Recent Failures"
          value={recentFailures.length.toString()}
          icon={XCircle}
          color={recentFailures.length === 0 ? 'green' : 'red'}
        />
      </div>

      {/* Complexity by Tier */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Average Complexity Score by Tier</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {['simple', 'moderate', 'complex'].map((tier) => {
            const tierData = complexityByTier.find((t) => t.tier === tier);
            const avgScore = tierData?.averageScore ?? 0;
            const count = tierData?.count ?? 0;

            // Expected ranges
            const ranges = {
              simple: { min: 0, max: 15, target: 10 },
              moderate: { min: 15, max: 30, target: 22.5 },
              complex: { min: 30, max: 60, target: 40 },
            };
            const range = ranges[tier as keyof typeof ranges];

            // Score position as percentage
            const position = Math.min(100, Math.max(0, ((avgScore - range.min) / (range.max - range.min)) * 100));

            // Color based on tier
            const tierColors = {
              simple: 'bg-blue-500',
              moderate: 'bg-yellow-500',
              complex: 'bg-purple-500',
            };

            return (
              <div key={tier} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize text-gray-700">{tier}</span>
                  <span className="text-sm text-gray-500">{count} scenarios</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {avgScore > 0 ? avgScore.toFixed(1) : '-'}
                </div>
                {/* Score bar */}
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all', tierColors[tier as keyof typeof tierColors])}
                    style={{ width: `${position}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>{range.min}</span>
                  <span>Expected: {range.min}-{range.max}</span>
                  <span>{range.max}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Failures */}
      {recentFailures.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="mb-4 font-semibold text-red-900 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Recent Validation Failures
          </h3>
          <div className="space-y-2">
            {recentFailures.map((failure) => (
              <button
                key={failure.scenarioId}
                onClick={() => onScenarioClick?.(failure.scenarioId)}
                className="w-full flex items-center justify-between rounded-md bg-white p-3 text-left hover:bg-red-100 transition-colors border border-red-200"
              >
                <div>
                  <span className="font-mono text-sm text-gray-900">{failure.scenarioId}</span>
                  <div className="text-xs text-gray-500">
                    {failure.domain} • {failure.tier}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-red-700">
                    Score: {failure.complexityScore?.toFixed(1) ?? 'N/A'}
                  </span>
                  {failure.validatedAt && (
                    <div className="text-xs text-gray-500">
                      {new Date(failure.validatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Summary card component
function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  const iconBg = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
  };

  return (
    <div className={cn('rounded-lg border p-4', colorClasses[color])}>
      <div className="flex items-center gap-3">
        <div className={cn('rounded-full p-2', iconBg[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
