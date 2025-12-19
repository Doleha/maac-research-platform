'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function StatisticalResults({ experimentId }: { experimentId: string }) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['analysis-results', experimentId],
    queryFn: () => apiClient.getAnalysisResults(experimentId),
  });

  if (isLoading) return <div>Loading analysis...</div>;
  if (!analysis) return <div>No analysis available</div>;

  const stats = analysis.coreStatistics?.descriptiveStatistics;
  const synthesis = analysis.synthesisResults;

  return (
    <div className="space-y-6 p-6 border rounded-lg">
      <h2 className="text-2xl font-bold">Statistical Analysis</h2>

      {/* Descriptive Statistics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Descriptive Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          {stats?.meanScores &&
            Object.entries(stats.meanScores).map(([key, value]) => (
              <div key={key} className="p-4 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">{key}</p>
                <p className="text-xl font-bold">{(value as number).toFixed(2)}</p>
                <p className="text-xs text-gray-500">
                  SD: {stats.standardDeviations?.[key]?.toFixed(2) || 'N/A'}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Synthesis */}
      {synthesis && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Key Findings</h3>
          <div className="space-y-3">
            {synthesis.convergent_findings?.map((finding: string, i: number) => (
              <div key={i} className="p-3 bg-green-50 border-l-4 border-green-500">
                {finding}
              </div>
            ))}
          </div>

          {synthesis.integrated_recommendations && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="list-disc list-inside space-y-1">
                {synthesis.integrated_recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
