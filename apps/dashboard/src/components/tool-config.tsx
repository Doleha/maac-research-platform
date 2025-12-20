'use client';

import { Info } from 'lucide-react';

export interface ToolConfig {
  memory: boolean;
  planning: boolean;
  reflection: boolean;
  validation: boolean;
  clarification: boolean;
  evaluation: boolean;
}

interface ToolConfigProps {
  value: ToolConfig;
  onChange: (config: ToolConfig) => void;
}

const tools = [
  {
    key: 'memory' as keyof ToolConfig,
    label: 'Memory Engine',
    description: 'Graphiti-powered episodic and semantic memory',
    bit: 5,
  },
  {
    key: 'planning' as keyof ToolConfig,
    label: 'Planning Engine',
    description: 'Strategic task decomposition and planning',
    bit: 4,
  },
  {
    key: 'reflection' as keyof ToolConfig,
    label: 'Reflection Engine',
    description: 'Self-assessment and metacognitive monitoring',
    bit: 3,
  },
  {
    key: 'validation' as keyof ToolConfig,
    label: 'Validation Engine',
    description: 'Output verification and error detection',
    bit: 2,
  },
  {
    key: 'clarification' as keyof ToolConfig,
    label: 'Clarification Engine',
    description: 'Question generation and ambiguity resolution',
    bit: 1,
  },
  {
    key: 'evaluation' as keyof ToolConfig,
    label: 'Evaluation Engine',
    description: 'Solution quality assessment',
    bit: 0,
  },
];

export function ToolConfiguration({ value, onChange }: ToolConfigProps) {
  const handleToggle = (key: keyof ToolConfig) => {
    onChange({ ...value, [key]: !value[key] });
  };

  const handleToggleAll = (enabled: boolean) => {
    const newConfig = tools.reduce((acc, tool) => {
      acc[tool.key] = enabled;
      return acc;
    }, {} as ToolConfig);
    onChange(newConfig);
  };

  // Generate 6-bit configuration string
  const getBitString = () => {
    return tools.map((tool) => (value[tool.key] ? '1' : '0')).join('');
  };

  const enabledCount = Object.values(value).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">MIMIC Cognitive Tools</h3>
          <span title="Select which cognitive engines to enable for this experiment">
            <Info className="h-4 w-4 text-gray-400" />
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleToggleAll(true)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Select All
          </button>
          <span className="text-xs text-gray-400">|</span>
          <button
            type="button"
            onClick={() => handleToggleAll(false)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Tool checkboxes */}
      <div className="space-y-3">
        {tools.map((tool) => (
          <div
            key={tool.key}
            className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              id={tool.key}
              checked={value[tool.key]}
              onChange={() => handleToggle(tool.key)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <label
                htmlFor={tool.key}
                className="block cursor-pointer text-sm font-medium text-gray-900"
              >
                {tool.label}
              </label>
              <p className="text-xs text-gray-500">{tool.description}</p>
            </div>
            <span className="text-xs font-mono text-gray-400">Bit {tool.bit}</span>
          </div>
        ))}
      </div>

      {/* Configuration summary */}
      <div className="rounded-lg bg-gray-50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700">
            Configuration: <span className="font-mono font-semibold">{getBitString()}</span>
          </span>
          <span className="text-gray-600">
            {enabledCount} of {tools.length} tools enabled
          </span>
        </div>
      </div>
    </div>
  );
}
