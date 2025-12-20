'use client';

import { Info, HelpCircle } from 'lucide-react';

export interface ControlExpectations {
  expected_calculations: {
    memory_retrievals: number;
    planning_steps: number;
    reflections: number;
    validations: number;
    clarifications: number;
    evaluations: number;
    goal_updates: number;
    error_corrections: number;
    total_token_usage: number;
    avg_response_time_ms: number;
    context_switches: number;
    backtracking_events: number;
  };
  success_thresholds: {
    min_accuracy: number;
    max_error_rate: number;
    min_completeness: number;
    max_token_budget: number;
    max_time_seconds: number;
    min_efficiency_score: number;
  };
}

interface ControlExpectationsProps {
  value: ControlExpectations;
  onChange: (expectations: ControlExpectations) => void;
  errors?: Record<string, string>;
}

const calculationFields = [
  {
    key: 'memory_retrievals',
    label: 'Memory Retrievals',
    description: 'Expected number of memory queries',
    min: 0,
    max: 1000,
  },
  {
    key: 'planning_steps',
    label: 'Planning Steps',
    description: 'Expected planning iterations',
    min: 0,
    max: 100,
  },
  {
    key: 'reflections',
    label: 'Reflections',
    description: 'Expected self-reflection cycles',
    min: 0,
    max: 50,
  },
  {
    key: 'validations',
    label: 'Validations',
    description: 'Expected validation checks',
    min: 0,
    max: 100,
  },
  {
    key: 'clarifications',
    label: 'Clarifications',
    description: 'Expected clarification requests',
    min: 0,
    max: 50,
  },
  {
    key: 'evaluations',
    label: 'Evaluations',
    description: 'Expected evaluation cycles',
    min: 0,
    max: 50,
  },
  {
    key: 'goal_updates',
    label: 'Goal Updates',
    description: 'Expected goal refinements',
    min: 0,
    max: 50,
  },
  {
    key: 'error_corrections',
    label: 'Error Corrections',
    description: 'Expected error recovery attempts',
    min: 0,
    max: 50,
  },
  {
    key: 'total_token_usage',
    label: 'Total Token Usage',
    description: 'Expected total tokens consumed',
    min: 0,
    max: 1000000,
  },
  {
    key: 'avg_response_time_ms',
    label: 'Avg Response Time (ms)',
    description: 'Expected average response time',
    min: 0,
    max: 60000,
  },
  {
    key: 'context_switches',
    label: 'Context Switches',
    description: 'Expected context changes',
    min: 0,
    max: 100,
  },
  {
    key: 'backtracking_events',
    label: 'Backtracking Events',
    description: 'Expected backtrack occurrences',
    min: 0,
    max: 50,
  },
];

const thresholdFields = [
  {
    key: 'min_accuracy',
    label: 'Min Accuracy',
    description: 'Minimum required accuracy (0.0-1.0)',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'max_error_rate',
    label: 'Max Error Rate',
    description: 'Maximum acceptable error rate (0.0-1.0)',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'min_completeness',
    label: 'Min Completeness',
    description: 'Minimum task completion (0.0-1.0)',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'max_token_budget',
    label: 'Max Token Budget',
    description: 'Maximum tokens allowed per trial',
    min: 0,
    max: 1000000,
    step: 1000,
  },
  {
    key: 'max_time_seconds',
    label: 'Max Time (seconds)',
    description: 'Maximum execution time per trial',
    min: 0,
    max: 3600,
    step: 10,
  },
  {
    key: 'min_efficiency_score',
    label: 'Min Efficiency Score',
    description: 'Minimum efficiency rating (0.0-1.0)',
    min: 0,
    max: 1,
    step: 0.01,
  },
];

export function ControlExpectations({ value, onChange, errors = {} }: ControlExpectationsProps) {
  const handleCalculationChange = (key: string, newValue: number) => {
    onChange({
      ...value,
      expected_calculations: {
        ...value.expected_calculations,
        [key]: newValue,
      },
    });
  };

  const handleThresholdChange = (key: string, newValue: number) => {
    onChange({
      ...value,
      success_thresholds: {
        ...value.success_thresholds,
        [key]: newValue,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Expected Calculations */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">Expected Calculations</h3>
          <span title="Define expected cognitive operation counts for control scenarios">
            <Info className="h-4 w-4 text-gray-400" />
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {calculationFields.map((field) => (
            <div key={field.key}>
              <label htmlFor={field.key} className="flex items-center gap-1 text-sm font-medium text-gray-700">
                {field.label}
                <span title={field.description}>
                  <HelpCircle className="h-3 w-3 text-gray-400" />
                </span>
              </label>
              <input
                type="number"
                id={field.key}
                min={field.min}
                max={field.max}
                value={(value.expected_calculations as any)[field.key]}
                onChange={(e) => handleCalculationChange(field.key, parseInt(e.target.value, 10))}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                  errors[field.key]
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors[field.key] && <p className="mt-1 text-xs text-red-600">{errors[field.key]}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Success Thresholds */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">Success Thresholds</h3>
          <span title="Define success criteria and acceptable limits">
            <Info className="h-4 w-4 text-gray-400" />
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {thresholdFields.map((field) => (
            <div key={field.key}>
              <label htmlFor={field.key} className="flex items-center gap-1 text-sm font-medium text-gray-700">
                {field.label}
                <span title={field.description}>
                  <HelpCircle className="h-3 w-3 text-gray-400" />
                </span>
              </label>
              <input
                type="number"
                id={field.key}
                min={field.min}
                max={field.max}
                step={field.step}
                value={(value.success_thresholds as any)[field.key]}
                onChange={(e) => handleThresholdChange(field.key, parseFloat(e.target.value))}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                  errors[field.key]
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors[field.key] && <p className="mt-1 text-xs text-red-600">{errors[field.key]}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
