'use client';

import { useState } from 'react';
import { Wand2, Loader2, CheckCircle, AlertCircle, DollarSign, FileText } from 'lucide-react';

interface GenerationRequest {
  domain: string;
  count: number;
  complexity: 'simple' | 'moderate' | 'complex';
  llm_provider: string;
  llm_model: string;
  temperature: number;
}

export default function GenerateScenariosPage() {
  const [formData, setFormData] = useState<GenerationRequest>({
    domain: 'problem_solving',
    count: 10,
    complexity: 'moderate',
    llm_provider: 'openai',
    llm_model: 'gpt-4o',
    temperature: 0.7,
  });

  const [generating, setGenerating] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [generatedScenarios, setGeneratedScenarios] = useState<any[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Estimate cost
  const handleEstimate = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/scenarios/generate/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to estimate cost');

      const data = await response.json();
      setEstimatedCost(data.estimated_credits);
    } catch (err) {
      console.error('Estimation error:', err);
      setEstimatedCost(null);
    }
  };

  // Generate scenarios with SSE streaming
  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setGeneratedScenarios([]);
    setStreamingText('');

    try {
      const response = await fetch('http://localhost:3001/api/scenarios/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to start generation');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'progress') {
              setStreamingText((prev) => prev + data.text);
            } else if (data.type === 'scenario') {
              setGeneratedScenarios((prev) => [...prev, data.scenario]);
              setStreamingText('');
            } else if (data.type === 'complete') {
              setGenerating(false);
            } else if (data.type === 'error') {
              setError(data.message);
              setGenerating(false);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setGenerating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Generate Scenarios</h1>
          <p className="mt-2 text-gray-600">
            Use AI to automatically generate experiment scenarios
          </p>
        </div>

        {/* Generation Form */}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Configuration</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Domain */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Domain <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.domain}
                  onChange={(e) => {
                    setFormData({ ...formData, domain: e.target.value });
                    setEstimatedCost(null);
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="problem_solving">Problem Solving</option>
                  <option value="creative_writing">Creative Writing</option>
                  <option value="data_analysis">Data Analysis</option>
                  <option value="technical_reasoning">Technical Reasoning</option>
                </select>
              </div>

              {/* Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Number of Scenarios <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.count}
                  onChange={(e) => {
                    setFormData({ ...formData, count: parseInt(e.target.value) || 1 });
                    setEstimatedCost(null);
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Complexity */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Complexity <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.complexity}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      complexity: e.target.value as 'simple' | 'moderate' | 'complex',
                    });
                    setEstimatedCost(null);
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="simple">Simple</option>
                  <option value="moderate">Moderate</option>
                  <option value="complex">Complex</option>
                </select>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) =>
                    setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0.7 })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Higher = more creative (0.0 - 2.0)</p>
              </div>

              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  LLM Provider <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.llm_provider}
                  onChange={(e) => {
                    setFormData({ ...formData, llm_provider: e.target.value });
                    setEstimatedCost(null);
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.llm_model}
                  onChange={(e) => {
                    setFormData({ ...formData, llm_model: e.target.value });
                    setEstimatedCost(null);
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., gpt-4o, claude-3-5-sonnet-20241022"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleEstimate}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <DollarSign className="h-4 w-4" />
                Estimate Cost
              </button>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate Scenarios
                  </>
                )}
              </button>

              {estimatedCost !== null && (
                <div className="ml-auto flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Est. {estimatedCost.toFixed(2)} credits
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Streaming Output */}
          {(generating || streamingText) && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <h3 className="font-semibold text-blue-900">Generating...</h3>
              </div>
              <div className="whitespace-pre-wrap font-mono text-sm text-blue-900">
                {streamingText || 'Initializing generation...'}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">{error}</span>
              </div>
            </div>
          )}

          {/* Generated Scenarios */}
          {generatedScenarios.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Generated {generatedScenarios.length} Scenarios
                  </h3>
                </div>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(generatedScenarios, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `scenarios-${Date.now()}.json`;
                    a.click();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4" />
                  Download JSON
                </button>
              </div>

              <div className="space-y-4">
                {generatedScenarios.map((scenario, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        Scenario {idx + 1}: {scenario.task_id}
                      </span>
                      <span className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
                        {scenario.domain}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="mb-2">
                        <strong>Task:</strong> {scenario.task_description}
                      </p>
                      <p className="mb-2">
                        <strong>Baseline:</strong> {scenario.baseline_answer}
                      </p>
                      <p>
                        <strong>Ground Truth:</strong> {scenario.ground_truth}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
