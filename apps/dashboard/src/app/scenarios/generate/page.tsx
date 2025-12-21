'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Target,
  XCircle,
} from 'lucide-react';
import { useScenariosState } from '@/contexts/DashboardStateContext';
import { SimpleLLMSelector } from '@/components/llm-selector';

interface GenerationRequest {
  domains: string[];
  tiers: string[];
  repetitions: number;
  provider: string;
  model: string;
  configId: string;
  concurrency: number;
}

interface ProgressState {
  startTime: number | null;
  currentCount: number;
  targetCount: number;
  elapsedSeconds: number;
}

// Helper function to format time
function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

export default function GenerateScenariosPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Use persisted state for form data
  const { generateForm, setGenerateForm } = useScenariosState();

  const [formData, setFormData] = useState<GenerationRequest>({
    domains: generateForm.domains.length > 0 ? generateForm.domains : ['analytical'],
    tiers: generateForm.tiers.length > 0 ? generateForm.tiers : ['simple'],
    repetitions: generateForm.scenariosPerDomainTier || 5,
    provider: 'deepseek',
    model: 'deepseek-chat',
    configId: '111111111111',
    concurrency: 3,
  });

  // Persist form changes to global state
  useEffect(() => {
    setGenerateForm({
      domains: formData.domains,
      tiers: formData.tiers,
      scenariosPerDomainTier: formData.repetitions,
    });
  }, [formData.domains, formData.tiers, formData.repetitions, setGenerateForm]);

  // Calculate total scenarios
  const totalScenarios = formData.domains.length * formData.tiers.length * formData.repetitions;

  const [generating, setGenerating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [generatedScenarios, setGeneratedScenarios] = useState<any[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Progress tracking
  const [progress, setProgress] = useState<ProgressState>({
    startTime: null,
    currentCount: 0,
    targetCount: 0,
    elapsedSeconds: 0,
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update elapsed time while generating (but not when paused)
  useEffect(() => {
    if (generating && !paused && progress.startTime) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => ({
          ...prev,
          elapsedSeconds: (Date.now() - (prev.startTime || Date.now())) / 1000,
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [generating, paused, progress.startTime]);

  // Cancel generation
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setGenerating(false);
    setPaused(false);
    setError('Generation cancelled by user');
  };

  // Generate scenarios with SSE streaming
  const handleGenerate = async () => {
    // Create new abort controller for this generation
    abortControllerRef.current = new AbortController();

    setGenerating(true);
    setPaused(false);
    setError(null);
    setGeneratedScenarios([]);
    setStreamingText('');

    // Initialize progress tracking
    setProgress({
      startTime: Date.now(),
      currentCount: 0,
      targetCount: totalScenarios,
      elapsedSeconds: 0,
    });

    try {
      console.log('Sending request to:', `${apiUrl}/scenarios/generate-llm-stream`);
      console.log('Request body:', JSON.stringify(formData, null, 2));

      const response = await fetch(`${apiUrl}/scenarios/generate-llm-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: abortControllerRef.current?.signal,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorMessage = 'Failed to start generation';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          // Parse SSE data lines (API sends: "event: X\ndata: {...}")
          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6));

              // Handle different event types from the API
              // API sends type: 'start', 'progress', 'scenario_complete', 'storing', 'complete', 'error'
              if (data.type === 'start' || data.type === 'progress') {
                // Show progress message
                setStreamingText(
                  data.message || `Generating scenario ${data.current}/${data.total}...`,
                );
              } else if (data.type === 'scenario_complete') {
                // A scenario was generated
                if (data.scenario) {
                  setGeneratedScenarios((prev) => [...prev, data.scenario]);
                }
                setProgress((prev) => ({
                  ...prev,
                  currentCount: data.current || prev.currentCount + 1,
                }));
                setStreamingText(data.message || `Completed ${data.current}/${data.total}`);
              } else if (data.type === 'storing') {
                // Database storage progress
                setStreamingText(data.message || 'Storing scenarios to database...');
              } else if (data.type === 'complete') {
                setStreamingText('');
                setGenerating(false);
                setPaused(false);
              } else if (data.type === 'error') {
                setError(data.message || data.error || 'Generation failed');
                setGenerating(false);
                setPaused(false);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', trimmedLine, parseError);
            }
          }
        }
      }
    } catch (err) {
      // Don't show error if user cancelled
      if (err instanceof Error && err.name === 'AbortError') {
        // Already handled in handleCancel
        return;
      }
      setError(err instanceof Error ? err.message : 'Generation failed');
      setGenerating(false);
      setPaused(false);
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
              {/* Domains - Multi-select checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Domains <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 space-y-2">
                  {['analytical', 'planning', 'communication', 'problem_solving'].map((domain) => (
                    <label key={domain} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.domains.includes(domain)}
                        onChange={(e) => {
                          const newDomains = e.target.checked
                            ? [...formData.domains, domain]
                            : formData.domains.filter((d) => d !== domain);
                          setFormData({
                            ...formData,
                            domains: newDomains.length > 0 ? newDomains : [domain],
                          });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {domain.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tiers - Multi-select checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Complexity Tiers <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 space-y-2">
                  {['simple', 'moderate', 'complex'].map((tier) => (
                    <label key={tier} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.tiers.includes(tier)}
                        onChange={(e) => {
                          const newTiers = e.target.checked
                            ? [...formData.tiers, tier]
                            : formData.tiers.filter((t) => t !== tier);
                          setFormData({
                            ...formData,
                            tiers: newTiers.length > 0 ? newTiers : [tier],
                          });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{tier}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Repetitions per domain/tier */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Repetitions per Domain/Tier <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={formData.repetitions}
                  onChange={(e) => {
                    setFormData({ ...formData, repetitions: parseInt(e.target.value) || 1 });
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Total: {totalScenarios} scenarios ({formData.domains.length} domains ×{' '}
                  {formData.tiers.length} tiers × {formData.repetitions} reps)
                </p>
              </div>

              {/* LLM Provider & Model Selection */}
              <SimpleLLMSelector
                provider={formData.provider}
                model={formData.model}
                onProviderChange={(provider) => setFormData({ ...formData, provider })}
                onModelChange={(model) => setFormData({ ...formData, model })}
              />

              {/* Concurrency */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Parallel Generation (Concurrency)
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.concurrency}
                    onChange={(e) => {
                      setFormData({ ...formData, concurrency: parseInt(e.target.value) || 1 });
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
                  />
                  <span className="w-8 text-center font-medium text-blue-600">
                    {formData.concurrency}x
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.concurrency === 1
                    ? 'Sequential (slower but safer for rate limits)'
                    : `${formData.concurrency} parallel API calls (~${formData.concurrency}x faster)`}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!generating ? (
                <button
                  onClick={handleGenerate}
                  disabled={totalScenarios === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Wand2 className="h-4 w-4" />
                  Generate {totalScenarios} Scenarios
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Generation
                  </button>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    Generating {progress.currentCount}/{totalScenarios}...
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2">
                <Target className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {totalScenarios} total scenarios
                </span>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {generating && progress.startTime && (
            <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Generation Progress</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Clock className="h-4 w-4" />
                  <span>Elapsed: {formatTime(progress.elapsedSeconds)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-blue-900">
                    {progress.currentCount} of {progress.targetCount} scenarios
                  </span>
                  <span className="font-bold text-blue-700">
                    {progress.targetCount > 0
                      ? Math.round((progress.currentCount / progress.targetCount) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-blue-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                    style={{
                      width: `${
                        progress.targetCount > 0
                          ? (progress.currentCount / progress.targetCount) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-white/60 p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{progress.currentCount}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {progress.targetCount - progress.currentCount}
                  </div>
                  <div className="text-xs text-gray-600">Remaining</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {progress.currentCount > 0
                      ? formatTime(progress.elapsedSeconds / progress.currentCount)
                      : '--'}
                  </div>
                  <div className="text-xs text-gray-600">Avg per Scenario</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {progress.currentCount > 0
                      ? formatTime(
                          ((progress.targetCount - progress.currentCount) *
                            progress.elapsedSeconds) /
                            progress.currentCount,
                        )
                      : '--'}
                  </div>
                  <div className="text-xs text-gray-600">Est. Remaining</div>
                </div>
              </div>
            </div>
          )}

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
                        Scenario {idx + 1}:{' '}
                        {scenario.task_id || scenario.scenarioId || `#${idx + 1}`}
                      </span>
                      <div className="flex gap-2">
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          {scenario.domain || scenario.metadata?.business_domain || 'unknown'}
                        </span>
                        <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                          {scenario.complexity_level || scenario.tier || 'unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong className="text-gray-900">Title:</strong>{' '}
                        {scenario.task_title || 'N/A'}
                      </p>
                      <p>
                        <strong className="text-gray-900">Description:</strong>{' '}
                        {scenario.task_description || 'N/A'}
                      </p>
                      <p>
                        <strong className="text-gray-900">Business Context:</strong>{' '}
                        {scenario.business_context || 'N/A'}
                      </p>
                      {scenario.requirements && scenario.requirements.length > 0 && (
                        <div>
                          <strong className="text-gray-900">Requirements:</strong>
                          <ul className="ml-4 list-disc">
                            {scenario.requirements.slice(0, 3).map((req: string, i: number) => (
                              <li key={i}>{req}</li>
                            ))}
                            {scenario.requirements.length > 3 && (
                              <li className="text-gray-500">
                                +{scenario.requirements.length - 3} more...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      {scenario.success_criteria && scenario.success_criteria.length > 0 && (
                        <div>
                          <strong className="text-gray-900">Success Criteria:</strong>
                          <ul className="ml-4 list-disc">
                            {scenario.success_criteria
                              .slice(0, 3)
                              .map((criteria: string, i: number) => (
                                <li key={i}>{criteria}</li>
                              ))}
                            {scenario.success_criteria.length > 3 && (
                              <li className="text-gray-500">
                                +{scenario.success_criteria.length - 3} more...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      {scenario.control_expectations?.expected_calculations && (
                        <p>
                          <strong className="text-gray-900">Expected Calculations:</strong>{' '}
                          {Object.keys(scenario.control_expectations.expected_calculations).length}{' '}
                          defined
                        </p>
                      )}
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
