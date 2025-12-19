'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Progress } from '@/components/ui/progress';

export function ExperimentStatus({ experimentId }: { experimentId: string }) {
  const { data: status, isLoading } = useQuery({
    queryKey: ['experiment-status', experimentId],
    queryFn: () => apiClient.getExperimentStatus(experimentId),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  if (isLoading) return <div>Loading...</div>;
  if (!status) return <div>No status available</div>;

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h2 className="text-2xl font-bold">Experiment Progress</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Total Trials</p>
          <p className="text-3xl font-bold">{status.total}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold">{status.completed}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-3xl font-bold">{status.active}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-3xl font-bold text-red-500">{status.failed}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-medium">{status.progress.toFixed(1)}%</span>
        </div>
        <Progress value={status.progress} />
      </div>
    </div>
  );
}
