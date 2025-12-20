'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LLMSelector, type LLMConfig } from './llm-selector';
import { ToolConfiguration, type ToolConfig } from './tool-config';
import {
  ControlExpectations,
  type ControlExpectations as ControlExpectationsType,
} from './control-expectations';
import { APIKeyModeSelector, type APIKeyMode, type SessionAPIKeys } from './api-key-mode';

// Updated domains to match backend API
const domains = [
  { value: 'analytical', label: 'Analytical' },
  { value: 'planning', label: 'Planning' },
  { value: 'communication', label: 'Communication' },
  { value: 'problem_solving', label: 'Problem Solving' },
];

// Updated tiers to match backend API (simple, moderate, complex)
const tiers = [
  {
    value: 'simple',
    label: 'Simple',
    description: 'Basic tasks with straightforward requirements',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Tasks with moderate complexity and multi-step reasoning',
  },
  {
    value: 'complex',
    label: 'Complex',
    description: 'Challenging tasks requiring advanced cognitive processing',
  },
];

// Model options matching backend API
const modelOptions = [
  { value: 'deepseek_v3', label: 'DeepSeek V3' },
  { value: 'sonnet_37', label: 'Claude 3.5 Sonnet' },
  { value: 'gpt_4o', label: 'GPT-4o' },
  { value: 'llama_maverick', label: 'Llama Maverick' },
];

interface FormData {
  name: string;
  description: string;
  domains: string[];      // Changed to array
  tiers: string[];        // Changed to array
  models: string[];       // Changed to array (replaces single llmConfig.model)
  repetitionsPerDomainTier: number;  // Renamed from replicationCount
  apiKeyMode: APIKeyMode;
  sessionKeys: SessionAPIKeys;
  llmConfig: LLMConfig;
  toolConfig: ToolConfig;
  controlExpectations: ControlExpectationsType;
}

export function ExperimentForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    // Fetch user's credit balance
    fetch('http://localhost:3001/api/billing/credits')
      .then((res) => res.json())
      .then((data) => setUserCredits(data.balance?.remainingCredits || 0))
      .catch((err) => console.error('Failed to fetch credits', err));
  }, []);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    domains: [],           // Multi-select array
    tiers: [],             // Multi-select array
    models: [],            // Multi-select array
    repetitionsPerDomainTier: 1,
    apiKeyMode: 'system',
    sessionKeys: {
      openai: undefined,
      anthropic: undefined,
      deepseek: undefined,
      openrouter: undefined,
      grok: undefined,
      gemini: undefined,
      llama: undefined,
    },
    llmConfig: {
      provider: '',
      model: '',
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 1.0,
    },
    toolConfig: {
      memory: true,
      planning: true,
      reflection: true,
      validation: true,
      clarification: true,
      evaluation: true,
    },
    controlExpectations: {
      expected_calculations: {
        memory_retrievals: 10,
        planning_steps: 5,
        reflections: 3,
        validations: 5,
        clarifications: 2,
        evaluations: 3,
        goal_updates: 2,
        error_corrections: 1,
        total_token_usage: 10000,
        avg_response_time_ms: 2000,
        context_switches: 3,
        backtracking_events: 1,
      },
      success_thresholds: {
        min_accuracy: 0.8,
        max_error_rate: 0.2,
        min_completeness: 0.9,
        max_token_budget: 50000,
        max_time_seconds: 300,
        min_efficiency_score: 0.7,
      },
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Experiment name is required';
    }

    if (formData.domains.length === 0) {
      newErrors.domains = 'Please select at least one domain';
    }

    if (formData.tiers.length === 0) {
      newErrors.tiers = 'Please select at least one tier';
    }

    if (formData.models.length === 0) {
      newErrors.models = 'Please select at least one model';
    }

    if (formData.repetitionsPerDomainTier < 1 || formData.repetitionsPerDomainTier > 200) {
      newErrors.repetitionsPerDomainTier = 'Repetitions must be between 1 and 200';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Format data for backend API
      const apiPayload = {
        name: formData.name,
        description: formData.description,
        domains: formData.domains,
        tiers: formData.tiers,
        models: formData.models,
        repetitionsPerDomainTier: formData.repetitionsPerDomainTier,
        toolConfigs: [{
          configId: 'config-' + Date.now(),
          name: 'Default Configuration',
          description: 'Auto-generated tool configuration',
          toolConfiguration: {
            enableGoalEngine: true,
            enablePlanningEngine: formData.toolConfig.planning,
            enableClarificationEngine: formData.toolConfig.clarification,
            enableValidationEngine: formData.toolConfig.validation,
            enableEvaluationEngine: formData.toolConfig.evaluation,
            enableReflectionEngine: formData.toolConfig.reflection,
            enableMemoryStore: formData.toolConfig.memory,
            enableMemoryQuery: formData.toolConfig.memory,
            enableThinkTool: true,
          },
        }],
        parallelism: 10,
        timeout: 60000,
      };

      // Connect to backend API
      const response = await fetch('http://localhost:3001/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create experiment');
      }

      const result = await response.json();

      // Redirect to experiment detail page
      router.push(`/experiments/${result.experimentId}`);
    } catch (error) {
      console.error('Failed to create experiment:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create experiment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handler for multi-select arrays (domains, tiers, models)
  const handleArrayToggle = (field: 'domains' | 'tiers' | 'models', value: string) => {
    setFormData((prev) => {
      const currentArray = prev[field];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLLMChange = (config: LLMConfig) => {
    setFormData((prev) => ({ ...prev, llmConfig: config }));
    // Clear LLM-related errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.provider;
      delete newErrors.model;
      return newErrors;
    });
  };

  const handleToolChange = (config: ToolConfig) => {
    setFormData((prev) => ({ ...prev, toolConfig: config }));
  };

  const handleExpectationsChange = (expectations: ControlExpectationsType) => {
    setFormData((prev) => ({ ...prev, controlExpectations: expectations }));
  };

  const handleAPIKeyModeChange = (mode: APIKeyMode) => {
    setFormData((prev) => ({ ...prev, apiKeyMode: mode }));
  };

  const handleSessionKeysChange = (keys: SessionAPIKeys) => {
    setFormData((prev) => ({ ...prev, sessionKeys: keys }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        <p className="mt-1 text-sm text-gray-500">Provide details about your experiment</p>

        <div className="mt-6 space-y-4">
          {/* Experiment Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Experiment Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                errors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="e.g., GPT-4 Problem Solving Baseline"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Describe the purpose and goals of this experiment..."
            />
          </div>
        </div>
      </div>

      {/* Experiment Configuration */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
        <p className="mt-1 text-sm text-gray-500">Select domain and tier settings</p>

        <div className="mt-6 space-y-4">
          {/* Domain Selection - Multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Domains <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-gray-500">(Select one or more)</span>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {domains.map((domain) => (
                <label
                  key={domain.value}
                  className={`relative flex cursor-pointer items-center rounded-lg border p-3 hover:bg-gray-50 ${
                    formData.domains.includes(domain.value)
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.domains.includes(domain.value)}
                    onChange={() => handleArrayToggle('domains', domain.value)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">{domain.label}</span>
                </label>
              ))}
            </div>
            {errors.domains && <p className="mt-1 text-sm text-red-600">{errors.domains}</p>}
          </div>

          {/* Tier Selection - Multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Complexity Tiers <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-gray-500">(Select one or more)</span>
            </label>
            <div className="mt-2 space-y-2">
              {tiers.map((tier) => (
                <label
                  key={tier.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 hover:bg-gray-50 ${
                    formData.tiers.includes(tier.value)
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.tiers.includes(tier.value)}
                      onChange={() => handleArrayToggle('tiers', tier.value)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <span className="block text-sm font-medium text-gray-900">{tier.label}</span>
                    <p className="text-sm text-gray-500">{tier.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.tiers && <p className="mt-1 text-sm text-red-600">{errors.tiers}</p>}
          </div>

          {/* Model Selection - Multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Models <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-gray-500">(Select one or more)</span>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {modelOptions.map((model) => (
                <label
                  key={model.value}
                  className={`relative flex cursor-pointer items-center rounded-lg border p-3 hover:bg-gray-50 ${
                    formData.models.includes(model.value)
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.models.includes(model.value)}
                    onChange={() => handleArrayToggle('models', model.value)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">{model.label}</span>
                </label>
              ))}
            </div>
            {errors.models && <p className="mt-1 text-sm text-red-600">{errors.models}</p>}
          </div>

          {/* Repetitions Per Domain-Tier */}
          <div>
            <label htmlFor="repetitionsPerDomainTier" className="block text-sm font-medium text-gray-700">
              Repetitions per Domain-Tier
            </label>
            <input
              type="number"
              id="repetitionsPerDomainTier"
              min="1"
              max="200"
              value={formData.repetitionsPerDomainTier}
              onChange={(e) => handleChange('repetitionsPerDomainTier', parseInt(e.target.value, 10) || 1)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                errors.repetitionsPerDomainTier
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            <p className="mt-1 text-sm text-gray-500">
              Number of repetitions for each domain-tier-model combination (1-200)
            </p>
            {errors.repetitionsPerDomainTier && (
              <p className="mt-1 text-sm text-red-600">{errors.repetitionsPerDomainTier}</p>
            )}
            {/* Trial count estimate */}
            {formData.domains.length > 0 && formData.tiers.length > 0 && formData.models.length > 0 && (
              <p className="mt-2 text-sm font-medium text-blue-600">
                Total trials: {formData.domains.length * formData.tiers.length * formData.models.length * formData.repetitionsPerDomainTier}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* API Key Mode - Hidden for now as we're using system keys */}
      {false && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">API Key Mode</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose how to authenticate with LLM providers
          </p>

          <div className="mt-6">
            <APIKeyModeSelector
              mode={formData.apiKeyMode}
              sessionKeys={formData.sessionKeys}
              userCredits={userCredits}
              selectedProvider={formData.llmConfig.provider}
              onModeChange={handleAPIKeyModeChange}
              onSessionKeysChange={handleSessionKeysChange}
            />
          </div>
        </div>
      )}

      {/* Credit Requirements Info - show when any selections are made */}
      {formData.domains.length > 0 && formData.tiers.length > 0 && formData.models.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">
                Experiment Configuration
              </h3>
              <p className="mt-1 text-sm text-blue-800">
                This experiment will run{' '}
                <strong>
                  {formData.domains.length * formData.tiers.length * formData.models.length * formData.repetitionsPerDomainTier}
                </strong>{' '}
                total trials across {formData.domains.length} domain(s), {formData.tiers.length} tier(s), and{' '}
                {formData.models.length} model(s).
              </p>
              <p className="mt-2 text-xs text-blue-700">
                Your balance: {userCredits.toLocaleString()} credits
                {userCredits < 100 && (
                  <span className="ml-2 font-semibold">
                    • Low balance - consider purchasing more credits
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LLM Configuration */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">LLM Configuration</h2>
        <p className="mt-1 text-sm text-gray-500">Select language model and parameters</p>

        <div className="mt-6">
          <LLMSelector value={formData.llmConfig} onChange={handleLLMChange} errors={errors} />
        </div>
      </div>

      {/* Tool Configuration */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">MIMIC Tool Configuration</h2>
        <p className="mt-1 text-sm text-gray-500">Enable cognitive engines for this experiment</p>

        <div className="mt-6">
          <ToolConfiguration value={formData.toolConfig} onChange={handleToolChange} />
        </div>
      </div>

      {/* Control Expectations */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Control Expectations</h2>
        <p className="mt-1 text-sm text-gray-500">
          Define expected performance metrics and success thresholds
        </p>

        <div className="mt-6">
          <ControlExpectations
            value={formData.controlExpectations}
            onChange={handleExpectationsChange}
            errors={errors}
          />
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Experiment'}
        </button>
      </div>
    </form>
  );
}
