'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shield, BookOpen, Info } from 'lucide-react';
import {
  ComplexityValidationStats,
  ComplexityDistributionChart,
  ComplexityScenarioList,
  ComplexityDetailsModal,
} from '@/components/complexity';

const queryClient = new QueryClient();

export default function ValidationDashboardPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Complexity Validation</h1>
            </div>
            <p className="text-gray-600">
              Monitor and analyze scenario complexity validation based on peer-reviewed academic frameworks
            </p>
          </div>

          {/* Academic Info Banner */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Academic Framework</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Complexity validation uses three peer-reviewed frameworks: Wood (1986) Component
                  Complexity, Campbell (1988) Four Sources, and Liu & Li (2012) Ten-Dimension Model.
                  All scenarios must pass validation before being stored in the database.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Overview Stats */}
            <ComplexityValidationStats
              onScenarioClick={setSelectedScenarioId}
            />

            {/* Distribution Chart */}
            <ComplexityDistributionChart />

            {/* Scenario List */}
            <ComplexityScenarioList
              onScenarioClick={setSelectedScenarioId}
            />

            {/* Info Section */}
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <h4 className="font-medium text-gray-900 mb-2">Understanding Complexity Scores</h4>
                  <ul className="space-y-1.5">
                    <li>
                      <span className="font-medium">Simple (0-15):</span> Single-step tasks with
                      minimal dependencies and clear objectives.
                    </li>
                    <li>
                      <span className="font-medium">Moderate (15-30):</span> Multi-step analysis
                      with some interdependencies and moderate cognitive load.
                    </li>
                    <li>
                      <span className="font-medium">Complex (30+):</span> Strategic synthesis
                      requiring integration of multiple frameworks, high element interactivity.
                    </li>
                  </ul>
                  <p className="mt-3">
                    Scores are calculated using weighted contributions from all three frameworks
                    plus element interactivity analysis. The system ensures scenarios match their
                    intended complexity tier before database storage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        <ComplexityDetailsModal
          scenarioId={selectedScenarioId || ''}
          isOpen={!!selectedScenarioId}
          onClose={() => setSelectedScenarioId(null)}
        />
      </main>
    </QueryClientProvider>
  );
}
