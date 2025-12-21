'use client';

import { useState, useEffect } from 'react';
import { Search, CheckSquare, Square, Filter, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface Scenario {
  id: number;
  scenarioId: string;
  experimentId: string;
  domain: string;
  tier: string;
  taskTitle: string;
  completed: boolean;
  createdAt: string;
}

interface ScenarioSelectorProps {
  selectedScenarioIds: string[];
  onSelectionChange: (scenarioIds: string[]) => void;
  disabled?: boolean;
}

export function ScenarioSelector({
  selectedScenarioIds,
  onSelectionChange,
  disabled = false,
}: ScenarioSelectorProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fetch scenarios
  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/scenarios?limit=1000`);
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      const data = await response.json();
      setScenarios(data.scenarios || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...scenarios];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.taskTitle.toLowerCase().includes(query) ||
          s.scenarioId.toLowerCase().includes(query)
      );
    }

    if (domainFilter !== 'all') {
      filtered = filtered.filter((s) => s.domain === domainFilter);
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter((s) => s.tier === tierFilter);
    }

    setFilteredScenarios(filtered);
  }, [searchQuery, domainFilter, tierFilter, scenarios]);

  // Get unique domains and tiers
  const uniqueDomains = [...new Set(scenarios.map((s) => s.domain))];
  const uniqueTiers = [...new Set(scenarios.map((s) => s.tier))];

  // Toggle selection
  const toggleScenario = (scenarioId: string) => {
    if (disabled) return;
    const newSelection = selectedScenarioIds.includes(scenarioId)
      ? selectedScenarioIds.filter((id) => id !== scenarioId)
      : [...selectedScenarioIds, scenarioId];
    onSelectionChange(newSelection);
  };

  // Select all filtered
  const selectAllFiltered = () => {
    if (disabled) return;
    const filteredIds = filteredScenarios.map((s) => s.scenarioId);
    const newSelection = [...new Set([...selectedScenarioIds, ...filteredIds])];
    onSelectionChange(newSelection);
  };

  // Deselect all filtered
  const deselectAllFiltered = () => {
    if (disabled) return;
    const filteredIds = new Set(filteredScenarios.map((s) => s.scenarioId));
    const newSelection = selectedScenarioIds.filter((id) => !filteredIds.has(id));
    onSelectionChange(newSelection);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading scenarios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="font-medium text-red-900">{error}</span>
        </div>
        <button
          onClick={fetchScenarios}
          className="mt-2 inline-flex items-center gap-1 text-sm text-red-700 hover:text-red-800"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <span className="font-medium text-yellow-900">No scenarios available</span>
        </div>
        <p className="mt-1 text-sm text-yellow-700">
          Generate scenarios first using the "Generate Scenarios" page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium text-blue-600">{selectedScenarioIds.length}</span> of{' '}
          <span className="font-medium">{scenarios.length}</span> scenarios selected
        </div>
        <button
          onClick={fetchScenarios}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search scenarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Domain filter */}
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Domains</option>
          {uniqueDomains.map((domain) => (
            <option key={domain} value={domain}>
              {domain.replace('_', ' ')}
            </option>
          ))}
        </select>

        {/* Tier filter */}
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Tiers</option>
          {uniqueTiers.map((tier) => (
            <option key={tier} value={tier}>
              {tier}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={selectAllFiltered}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <CheckSquare className="h-3.5 w-3.5" />
          Select All ({filteredScenarios.length})
        </button>
        <button
          type="button"
          onClick={deselectAllFiltered}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Square className="h-3.5 w-3.5" />
          Deselect All
        </button>
      </div>

      {/* Scenario list */}
      <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
        {filteredScenarios.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No scenarios match your filters
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredScenarios.map((scenario) => (
              <label
                key={scenario.scenarioId}
                className={`flex cursor-pointer items-start gap-3 p-3 hover:bg-gray-50 ${
                  selectedScenarioIds.includes(scenario.scenarioId) ? 'bg-blue-50' : ''
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedScenarioIds.includes(scenario.scenarioId)}
                  onChange={() => toggleScenario(scenario.scenarioId)}
                  disabled={disabled}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {scenario.taskTitle}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                      {scenario.domain.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">
                      {scenario.tier}
                    </span>
                    <span className="text-gray-500">{scenario.scenarioId}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
