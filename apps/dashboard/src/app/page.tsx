'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExperimentStatus } from '@/components/experiment-status';
import { MAACVisualization } from '@/components/maac-visualization';
import { StatisticalResults } from '@/components/statistical-results';

const queryClient = new QueryClient();

export default function Home() {
  const [experimentId, setExperimentId] = useState('');

  return (
    <QueryClientProvider client={queryClient}>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">MAAC Research Dashboard</h1>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Experiment ID
            </label>
            <input
              type="text"
              value={experimentId}
              onChange={(e) => setExperimentId(e.target.value)}
              placeholder="Enter experiment ID"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {experimentId && (
            <div className="space-y-6">
              <ExperimentStatus experimentId={experimentId} />
              <MAACVisualization experimentId={experimentId} />
              <StatisticalResults experimentId={experimentId} />
            </div>
          )}
        </div>
      </main>
    </QueryClientProvider>
  );
}
