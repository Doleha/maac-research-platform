'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Eye,
  FileText,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';

interface Experiment {
  id: number;
  experimentId: string;
  name: string;
  description?: string;
  domains: string[];
  tiers: string[];
  models: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  totalTrials: number;
  completedTrials: number;
  failedTrials: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'createdAt' | 'totalTrials'>(
    'createdAt',
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fetch experiments
  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/experiments');
        if (!response.ok) throw new Error('Failed to fetch experiments');
        const data = await response.json();
        setExperiments(data.experiments || []);
        setFilteredExperiments(data.experiments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load experiments');
      } finally {
        setLoading(false);
      }
    };

    fetchExperiments();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...experiments];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (exp) =>
          exp.name.toLowerCase().includes(query) ||
          exp.description?.toLowerCase().includes(query) ||
          exp.experimentId.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((exp) => exp.status === statusFilter);
    }

    // Tier filter (check if any tier in the array matches)
    if (tierFilter !== 'all') {
      filtered = filtered.filter((exp) => exp.tiers?.includes(tierFilter));
    }

    // Domain filter (check if any domain in the array matches)
    if (domainFilter !== 'all') {
      filtered = filtered.filter((exp) => exp.domains?.includes(domainFilter));
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof Experiment];
      let bVal: any = b[sortField as keyof Experiment];

      if (sortField === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredExperiments(filtered);
    setCurrentPage(1); // Reset to first page
  }, [searchQuery, statusFilter, tierFilter, domainFilter, sortField, sortDirection, experiments]);

  // Pagination
  const totalPages = Math.ceil(filteredExperiments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExperiments = filteredExperiments.slice(startIndex, endIndex);

  // Status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      running: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      paused: 'bg-orange-100 text-orange-800 border-orange-200',
    };

    const icons = {
      pending: <Clock className="h-3 w-3" />,
      running: <Loader2 className="h-3 w-3 animate-spin" />,
      completed: <CheckCircle className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      paused: <Clock className="h-3 w-3" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
      >
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Experiments</h1>
            <p className="mt-2 text-gray-600">Browse and manage all your experiments</p>
          </div>
          <Link
            href="/experiments/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            New Experiment
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search experiments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Tier Filter */}
            <div>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="1a">Tier 1a</option>
                <option value="1b">Tier 1b</option>
                <option value="2">Tier 2</option>
              </select>
            </div>

            {/* Domain Filter */}
            <div>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Domains</option>
                <option value="problem_solving">Problem Solving</option>
                <option value="creative_writing">Creative Writing</option>
                <option value="data_analysis">Data Analysis</option>
                <option value="technical_reasoning">Technical Reasoning</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-sm text-gray-600">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredExperiments.length)} of{' '}
              {filteredExperiments.length} experiments
            </span>
            {(searchQuery || statusFilter !== 'all' || tierFilter !== 'all' || domainFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTierFilter('all');
                  setDomainFilter('all');
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Experiments Table */}
        {!loading && !error && (
          <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => {
                          setSortField('name');
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-600 hover:text-gray-900"
                      >
                        Name
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                      Tiers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                      Domains
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                      Models
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => {
                          setSortField('totalTrials');
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-600 hover:text-gray-900"
                      >
                        Trials
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => {
                          setSortField('createdAt');
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-600 hover:text-gray-900"
                      >
                        Created
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedExperiments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        {filteredExperiments.length === 0 && experiments.length > 0
                          ? 'No experiments match your filters'
                          : 'No experiments yet. Create your first experiment to get started.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedExperiments.map((exp) => (
                      <tr key={exp.experimentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{exp.name}</div>
                            <div className="text-sm text-gray-500">{exp.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(exp.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {exp.tiers?.map((tier) => (
                              <span key={tier} className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize">
                                {tier}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {exp.domains?.map((domain) => (
                              <span key={domain} className="text-xs text-gray-600 capitalize">
                                {domain.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {exp.models?.map((model) => (
                              <span key={model} className="text-xs text-gray-600">
                                {model}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {exp.completedTrials} / {exp.totalTrials}
                          </div>
                          <div className="mt-1 h-2 w-24 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-blue-600"
                              style={{
                                width: `${(exp.completedTrials / (exp.totalTrials || 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            {exp.totalTrials}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(exp.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/experiments/${exp.experimentId}`}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            <Link
                              href={`/experiments/${exp.experimentId}/export`}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              title="Export Results"
                            >
                              <FileText className="h-5 w-5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded px-3 py-1 text-sm font-medium ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="text-gray-500">...</span>}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
