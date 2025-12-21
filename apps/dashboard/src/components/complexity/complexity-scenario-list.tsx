'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComplexityBadge, ValidationIndicator, TierPill } from './complexity-badge';

interface ScenarioRow {
  scenarioId: string;
  domain: string;
  tier: 'simple' | 'moderate' | 'complex';
  validationPassed: boolean | null;
  complexityScore: number | null;
  validatedAt: string | null;
}

interface ComplexityScenarioListProps {
  apiUrl?: string;
  onScenarioClick?: (scenarioId: string) => void;
  pageSize?: number;
}

type SortField = 'scenarioId' | 'domain' | 'tier' | 'complexityScore' | 'validatedAt';
type SortOrder = 'asc' | 'desc';

/**
 * List component with filtering and sorting for scenarios by complexity
 */
export function ComplexityScenarioList({
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  onScenarioClick,
  pageSize = 20,
}: ComplexityScenarioListProps) {
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [validationFilter, setValidationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('validatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [page, setPage] = useState(0);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, you'd pass filters to API
      // For now, we'll fetch from the stats endpoint and mock
      const response = await fetch(`${apiUrl}/scenarios/validation/stats`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Mock some scenario data based on the distribution
      // In production, this would be a proper paginated endpoint
      const mockScenarios: ScenarioRow[] = [];
      const domains = ['analytical', 'planning', 'communication', 'problem_solving'];
      const tiers: Array<'simple' | 'moderate' | 'complex'> = ['simple', 'moderate', 'complex'];

      for (let i = 0; i < 50; i++) {
        const tier = tiers[i % 3];
        const scoreRanges = {
          simple: { min: 5, max: 14 },
          moderate: { min: 15, max: 29 },
          complex: { min: 30, max: 50 },
        };
        const range = scoreRanges[tier];

        mockScenarios.push({
          scenarioId: `${domains[i % 4]}-${tier}-${String(Math.floor(i / 12)).padStart(3, '0')}-${i}`,
          domain: domains[i % 4],
          tier,
          validationPassed: Math.random() > 0.05, // 95% pass rate
          complexityScore:
            Math.round((range.min + Math.random() * (range.max - range.min)) * 10) / 10,
          validatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      setScenarios(mockScenarios);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, [apiUrl]);

  // Apply filters
  const filteredScenarios = scenarios.filter((s) => {
    if (searchQuery && !s.scenarioId.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (tierFilter !== 'all' && s.tier !== tierFilter) {
      return false;
    }
    if (domainFilter !== 'all' && s.domain !== domainFilter) {
      return false;
    }
    if (validationFilter === 'passed' && !s.validationPassed) {
      return false;
    }
    if (validationFilter === 'failed' && s.validationPassed !== false) {
      return false;
    }
    return true;
  });

  // Apply sorting
  const sortedScenarios = [...filteredScenarios].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'scenarioId':
        comparison = a.scenarioId.localeCompare(b.scenarioId);
        break;
      case 'domain':
        comparison = a.domain.localeCompare(b.domain);
        break;
      case 'tier':
        const tierOrder = { simple: 0, moderate: 1, complex: 2 };
        comparison = tierOrder[a.tier] - tierOrder[b.tier];
        break;
      case 'complexityScore':
        comparison = (a.complexityScore || 0) - (b.complexityScore || 0);
        break;
      case 'validatedAt':
        comparison =
          new Date(a.validatedAt || 0).getTime() - new Date(b.validatedAt || 0).getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Apply pagination
  const paginatedScenarios = sortedScenarios.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sortedScenarios.length / pageSize);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // Get unique domains for filter
  const domains = [...new Set(scenarios.map((s) => s.domain))];

  return (
    <div className="rounded-lg border bg-white">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Validated Scenarios</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                showFilters
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <button
              onClick={fetchScenarios}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search scenarios..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-md border bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(0);
              }}
              className="rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Tiers</option>
              <option value="simple">Simple</option>
              <option value="moderate">Moderate</option>
              <option value="complex">Complex</option>
            </select>
            <select
              value={domainFilter}
              onChange={(e) => {
                setDomainFilter(e.target.value);
                setPage(0);
              }}
              className="rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d.replace('_', ' ')}
                </option>
              ))}
            </select>
            <select
              value={validationFilter}
              onChange={(e) => {
                setValidationFilter(e.target.value);
                setPage(0);
              }}
              className="rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('scenarioId')}
                  className="flex items-center gap-1 hover:text-gray-900"
                >
                  Scenario ID
                  <SortIcon field="scenarioId" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('domain')}
                  className="flex items-center gap-1 hover:text-gray-900"
                >
                  Domain
                  <SortIcon field="domain" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('tier')}
                  className="flex items-center gap-1 hover:text-gray-900"
                >
                  Tier
                  <SortIcon field="tier" />
                </button>
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('complexityScore')}
                  className="flex items-center gap-1 hover:text-gray-900"
                >
                  Score
                  <SortIcon field="complexityScore" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('validatedAt')}
                  className="flex items-center gap-1 hover:text-gray-900"
                >
                  Validated
                  <SortIcon field="validatedAt" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && scenarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading scenarios...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                  Error: {error}
                </td>
              </tr>
            ) : paginatedScenarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No scenarios match your filters
                </td>
              </tr>
            ) : (
              paginatedScenarios.map((scenario) => (
                <tr
                  key={scenario.scenarioId}
                  onClick={() => onScenarioClick?.(scenario.scenarioId)}
                  className={cn(
                    'transition-colors',
                    onScenarioClick && 'cursor-pointer hover:bg-gray-50',
                  )}
                >
                  <td className="px-4 py-3 font-mono text-sm text-gray-900">
                    {scenario.scenarioId}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                    {scenario.domain.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3">
                    <TierPill tier={scenario.tier} />
                  </td>
                  <td className="px-4 py-3">
                    <ValidationIndicator passed={scenario.validationPassed} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {scenario.complexityScore?.toFixed(1) ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {scenario.validatedAt
                      ? new Date(scenario.validatedAt).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-gray-500">
            Showing {page * pageSize + 1} to{' '}
            {Math.min((page + 1) * pageSize, sortedScenarios.length)} of {sortedScenarios.length}{' '}
            scenarios
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="rounded-md border px-3 py-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="rounded-md border px-3 py-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
