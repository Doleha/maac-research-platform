'use client';

import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Loader2, X, Save, Eye } from 'lucide-react';

interface Scenario {
  scenario_id: string;
  domain: string;
  task_id: string;
  task_description: string;
  baseline_answer: string;
  ground_truth: string;
  created_at?: string;
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  // Editor modal
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [editForm, setEditForm] = useState<Scenario | null>(null);
  const [saving, setSaving] = useState(false);

  // View modal (read-only)
  const [viewingScenario, setViewingScenario] = useState<Scenario | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fetch scenarios
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/scenarios');
        if (!response.ok) throw new Error('Failed to fetch scenarios');
        const data = await response.json();
        setScenarios(data.scenarios || []);
        setFilteredScenarios(data.scenarios || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scenarios');
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...scenarios];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (scenario) =>
          scenario.task_id.toLowerCase().includes(query) ||
          scenario.task_description.toLowerCase().includes(query) ||
          scenario.scenario_id.toLowerCase().includes(query),
      );
    }

    // Domain filter
    if (domainFilter !== 'all') {
      filtered = filtered.filter((scenario) => scenario.domain === domainFilter);
    }

    setFilteredScenarios(filtered);
    setCurrentPage(1);
  }, [searchQuery, domainFilter, scenarios]);

  // Pagination
  const totalPages = Math.ceil(filteredScenarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedScenarios = filteredScenarios.slice(startIndex, endIndex);

  // Edit handlers
  const handleEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setEditForm({ ...scenario });
  };

  const handleSave = async () => {
    if (!editForm) return;

    try {
      setSaving(true);
      const response = await fetch(
        `http://localhost:3001/api/scenarios/${editForm.scenario_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        },
      );

      if (!response.ok) throw new Error('Failed to update scenario');

      // Update local state
      setScenarios((prev) =>
        prev.map((s) => (s.scenario_id === editForm.scenario_id ? editForm : s)),
      );
      setEditingScenario(null);
      setEditForm(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (scenarioId: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/scenarios/${scenarioId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete scenario');

      // Update local state
      setScenarios((prev) => prev.filter((s) => s.scenario_id !== scenarioId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete scenario');
    }
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scenarios</h1>
          <p className="mt-2 text-gray-600">Browse, search, and manage your experiment scenarios</p>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by task ID, description, or scenario ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
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
              Showing {startIndex + 1}-{Math.min(endIndex, filteredScenarios.length)} of{' '}
              {filteredScenarios.length} scenarios
            </span>
            {(searchQuery || domainFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
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

        {/* Scenarios Table */}
        {!loading && !error && (
          <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                      Task ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                      Task Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                      Baseline Answer
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedScenarios.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        {filteredScenarios.length === 0 && scenarios.length > 0
                          ? 'No scenarios match your filters'
                          : 'No scenarios yet. Upload data to create scenarios.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedScenarios.map((scenario) => (
                      <tr key={scenario.scenario_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm text-gray-900">
                            {scenario.task_id}
                          </div>
                          <div className="text-xs text-gray-500">{scenario.scenario_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                            {scenario.domain.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-md truncate text-sm text-gray-600">
                            {scenario.task_description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs truncate text-sm text-gray-600">
                            {scenario.baseline_answer}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingScenario(scenario)}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              title="View Full Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(scenario)}
                              className="rounded p-1 text-blue-600 hover:bg-blue-100"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(scenario.scenario_id)}
                              className="rounded p-1 text-red-600 hover:bg-red-100"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
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
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
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

        {/* View Modal */}
        {viewingScenario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Scenario Details</h2>
                <button
                  onClick={() => setViewingScenario(null)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scenario ID</label>
                  <p className="mt-1 font-mono text-sm text-gray-900">
                    {viewingScenario.scenario_id}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Task ID</label>
                  <p className="mt-1 font-mono text-sm text-gray-900">{viewingScenario.task_id}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingScenario.domain.replace(/_/g, ' ')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Task Description
                  </label>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                    {viewingScenario.task_description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Baseline Answer</label>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                    {viewingScenario.baseline_answer}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ground Truth</label>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                    {viewingScenario.ground_truth}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingScenario && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Edit Scenario</h2>
                <button
                  onClick={() => {
                    setEditingScenario(null);
                    setEditForm(null);
                  }}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Scenario ID <span className="text-gray-400">(read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.scenario_id}
                    disabled
                    className="mt-1 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Task ID</label>
                  <input
                    type="text"
                    value={editForm.task_id}
                    onChange={(e) => setEditForm({ ...editForm, task_id: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain</label>
                  <select
                    value={editForm.domain}
                    onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="problem_solving">Problem Solving</option>
                    <option value="creative_writing">Creative Writing</option>
                    <option value="data_analysis">Data Analysis</option>
                    <option value="technical_reasoning">Technical Reasoning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Task Description
                  </label>
                  <textarea
                    value={editForm.task_description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, task_description: e.target.value })
                    }
                    rows={4}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Baseline Answer</label>
                  <textarea
                    value={editForm.baseline_answer}
                    onChange={(e) => setEditForm({ ...editForm, baseline_answer: e.target.value })}
                    rows={4}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ground Truth</label>
                  <textarea
                    value={editForm.ground_truth}
                    onChange={(e) => setEditForm({ ...editForm, ground_truth: e.target.value })}
                    rows={4}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  onClick={() => {
                    setEditingScenario(null);
                    setEditForm(null);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
