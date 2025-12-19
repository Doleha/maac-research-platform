'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export function MAACVisualization({ experimentId }: { experimentId: string }) {
  const { data: results, isLoading } = useQuery({
    queryKey: ['experiment-results', experimentId],
    queryFn: () => apiClient.getExperimentResults(experimentId),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!results || results.length === 0) return <div>No results yet</div>;

  // Calculate average scores across all trials
  const avgScores = {
    cognitiveLoad: average(results.map((r: any) => Number(r.maacCognitiveLoad))),
    toolExecution: average(results.map((r: any) => Number(r.maacToolExecution))),
    contentQuality: average(results.map((r: any) => Number(r.maacContentQuality))),
    memoryIntegration: average(results.map((r: any) => Number(r.maacMemoryIntegration))),
    complexityHandling: average(results.map((r: any) => Number(r.maacComplexityHandling))),
    hallucinationControl: average(results.map((r: any) => Number(r.maacHallucinationControl))),
    knowledgeTransfer: average(results.map((r: any) => Number(r.maacKnowledgeTransfer))),
    processingEfficiency: average(results.map((r: any) => Number(r.maacProcessingEfficiency))),
    constructValidity: average(results.map((r: any) => Number(r.maacConstructValidity))),
  };

  const chartData = [
    { dimension: 'Cognitive Load', score: avgScores.cognitiveLoad },
    { dimension: 'Tool Execution', score: avgScores.toolExecution },
    { dimension: 'Content Quality', score: avgScores.contentQuality },
    { dimension: 'Memory Integration', score: avgScores.memoryIntegration },
    { dimension: 'Complexity Handling', score: avgScores.complexityHandling },
    { dimension: 'Hallucination Control', score: avgScores.hallucinationControl },
    { dimension: 'Knowledge Transfer', score: avgScores.knowledgeTransfer },
    { dimension: 'Processing Efficiency', score: avgScores.processingEfficiency },
    { dimension: 'Construct Validity', score: avgScores.constructValidity },
  ];

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-2xl font-bold mb-4">MAAC 9-Dimensional Assessment</h2>

      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" />
          <PolarRadiusAxis domain={[0, 10]} />
          <Radar
            name="MAAC Scores"
            dataKey="score"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {Object.entries(avgScores).map(([key, value]) => (
          <div key={key} className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </p>
            <p className="text-2xl font-bold">{value.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
