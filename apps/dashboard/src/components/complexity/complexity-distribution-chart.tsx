'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DistributionData {
  distribution: {
    simple: Record<string, number>;
    moderate: Record<string, number>;
    complex: Record<string, number>;
  };
  byDomain: Array<{
    domain: string;
    count: number;
    average: number;
    min: number;
    max: number;
  }>;
  totalValidated: number;
}

interface ComplexityDistributionChartProps {
  apiUrl?: string;
}

/**
 * Chart component showing complexity score distribution
 */
export function ComplexityDistributionChart({
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
}: ComplexityDistributionChartProps) {
  const [data, setData] = useState<DistributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tier' | 'domain'>('tier');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${apiUrl}/scenarios/validation/distribution`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiUrl]);

  if (loading && !data) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500 py-12">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading distribution data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        Error: {error}
      </div>
    );
  }

  if (!data || data.totalValidated === 0) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-500">
          <Info className="h-8 w-8" />
          <p>No validated scenarios yet</p>
          <p className="text-sm">Generate and validate scenarios to see distribution data</p>
        </div>
      </div>
    );
  }

  const tierColors = {
    simple: { bar: 'bg-blue-500', light: 'bg-blue-100' },
    moderate: { bar: 'bg-yellow-500', light: 'bg-yellow-100' },
    complex: { bar: 'bg-purple-500', light: 'bg-purple-100' },
  };

  const domainColors = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-pink-500',
  ];

  // Find max count for scaling
  const allCounts = Object.entries(data.distribution).flatMap(([_, ranges]) =>
    Object.values(ranges)
  );
  const maxCount = Math.max(...allCounts, 1);

  return (
    <div className="rounded-lg border bg-white">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Complexity Score Distribution</h3>
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex rounded-lg border bg-gray-50 p-1">
            <button
              onClick={() => setActiveTab('tier')}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                activeTab === 'tier'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              By Tier
            </button>
            <button
              onClick={() => setActiveTab('domain')}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                activeTab === 'domain'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              By Domain
            </button>
          </div>
          <button
            onClick={fetchData}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'tier' ? (
          <div className="space-y-6">
            {/* Tier Distribution */}
            {(['simple', 'moderate', 'complex'] as const).map((tier) => {
              const tierData = data.distribution[tier];
              const ranges = Object.entries(tierData);
              const tierTotal = ranges.reduce((sum, [_, count]) => sum + count, 0);

              return (
                <div key={tier} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize text-gray-700">{tier}</span>
                    <span className="text-sm text-gray-500">{tierTotal} scenarios</span>
                  </div>
                  <div className="flex gap-1 h-8">
                    {ranges.map(([range, count]) => {
                      const width = (count / maxCount) * 100;
                      if (count === 0) return null;
                      return (
                        <div
                          key={range}
                          className={cn(
                            'relative flex items-center justify-center rounded text-xs font-medium text-white transition-all hover:opacity-80',
                            tierColors[tier].bar
                          )}
                          style={{ width: `${Math.max(width, 8)}%` }}
                          title={`${range}: ${count} scenarios`}
                        >
                          {count > 5 && <span>{range}</span>}
                        </div>
                      );
                    })}
                  </div>
                  {/* Range Legend */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {ranges.map(([range, count]) => (
                      <span key={range} className="flex items-center gap-1">
                        <span className={cn('w-2 h-2 rounded', tierColors[tier].bar)} />
                        {range}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Domain Stats */}
            {data.byDomain.map((domain, idx) => {
              const color = domainColors[idx % domainColors.length];
              const range = domain.max - domain.min;

              return (
                <div key={domain.domain} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-3 h-3 rounded-full', color)} />
                      <span className="font-medium capitalize text-gray-900">
                        {domain.domain.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{domain.count} scenarios</span>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Average</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {domain.average.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Min</p>
                      <p className="text-lg font-semibold text-gray-700">
                        {domain.min.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Max</p>
                      <p className="text-lg font-semibold text-gray-700">
                        {domain.max.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Range</p>
                      <p className="text-lg font-semibold text-gray-700">
                        {range.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {/* Visual Range Bar */}
                  <div className="mt-3 relative">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full', color)}
                        style={{
                          marginLeft: `${(domain.min / 60) * 100}%`,
                          width: `${(range / 60) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span>
                      <span>30</span>
                      <span>60</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Total Footer */}
        <div className="mt-6 pt-4 border-t flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <TrendingUp className="h-4 w-4" />
            <span>Total Validated: {data.totalValidated.toLocaleString()} scenarios</span>
          </div>
        </div>
      </div>
    </div>
  );
}
