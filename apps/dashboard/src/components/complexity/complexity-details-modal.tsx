'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, Copy, Check, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComplexityBadge, TierPill } from './complexity-badge';

interface WoodMetrics {
  distinctActs: number;
  informationCues: number;
  coordinativeComplexity: {
    level: string;
    dependencyCount: number;
  };
  dynamicComplexity: {
    stateChanges: number;
  };
}

interface CampbellAttributes {
  multiplePaths: boolean;
  multipleOutcomes: boolean;
  conflictingInterdependence: boolean;
  uncertainLinkages: string;
}

interface LiuLiDimensions {
  variety: number;
  ambiguity: string;
  instability: string;
  coupling: string;
  novelty: string;
  timePressure: string;
  equivocality: string;
  scope: string;
  workFlow: string;
  coordination: string;
}

interface ComplexityMetrics {
  overallScore: number;
  wood: WoodMetrics | null;
  campbell: CampbellAttributes | null;
  liuLi: LiuLiDimensions | null;
}

interface ScenarioValidation {
  scenarioId: string;
  domain: string;
  tier: 'simple' | 'moderate' | 'complex';
  validation: {
    passed: boolean;
    timestamp: string | null;
  };
  complexityMetrics: ComplexityMetrics;
}

interface ComplexityDetailsModalProps {
  scenarioId: string;
  isOpen: boolean;
  onClose: () => void;
  apiUrl?: string;
}

/**
 * Modal showing detailed complexity metrics for a scenario
 */
export function ComplexityDetailsModal({
  scenarioId,
  isOpen,
  onClose,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
}: ComplexityDetailsModalProps) {
  const [data, setData] = useState<ScenarioValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && scenarioId) {
      fetchDetails();
    }
  }, [isOpen, scenarioId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${apiUrl}/scenarios/${scenarioId}/validation`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Scenario not found');
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scenarioId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Complexity Analysis</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading complexity data...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-600">
              <p className="font-medium">Error: {error}</p>
              <button onClick={fetchDetails} className="mt-2 text-sm underline hover:text-red-800">
                Try again
              </button>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Scenario Header */}
              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-600">{data.scenarioId}</span>
                      <button
                        onClick={copyToClipboard}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy ID"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Domain:{' '}
                      <span className="capitalize font-medium">
                        {data.domain.replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                  <ComplexityBadge
                    validationPassed={data.validation.passed}
                    complexityScore={data.complexityMetrics.overallScore}
                    tier={data.tier}
                    size="lg"
                  />
                </div>
                {data.validation.timestamp && (
                  <p className="text-xs text-gray-400">
                    Validated: {new Date(data.validation.timestamp).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Overall Score */}
              <div className="text-center py-4">
                <div className="text-5xl font-bold text-gray-900">
                  {data.complexityMetrics.overallScore.toFixed(1)}
                </div>
                <p className="text-sm text-gray-500 mt-1">Overall Complexity Score</p>
                <div className="mt-3">
                  <TierPill tier={data.tier} />
                </div>
              </div>

              {/* Framework Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Wood (1986) */}
                <FrameworkCard title="Wood (1986)" subtitle="Component Complexity" color="blue">
                  {data.complexityMetrics.wood ? (
                    <div className="space-y-2 text-sm">
                      <MetricRow
                        label="Distinct Acts"
                        value={data.complexityMetrics.wood.distinctActs}
                      />
                      <MetricRow
                        label="Information Cues"
                        value={data.complexityMetrics.wood.informationCues}
                      />
                      <MetricRow
                        label="Coordination Level"
                        value={data.complexityMetrics.wood.coordinativeComplexity.level}
                        capitalize
                      />
                      <MetricRow
                        label="Dependencies"
                        value={data.complexityMetrics.wood.coordinativeComplexity.dependencyCount}
                      />
                      <MetricRow
                        label="State Changes"
                        value={data.complexityMetrics.wood.dynamicComplexity.stateChanges}
                      />
                    </div>
                  ) : (
                    <NoData />
                  )}
                </FrameworkCard>

                {/* Campbell (1988) */}
                <FrameworkCard title="Campbell (1988)" subtitle="Four Sources" color="yellow">
                  {data.complexityMetrics.campbell ? (
                    <div className="space-y-2 text-sm">
                      <BoolMetric
                        label="Multiple Paths"
                        value={data.complexityMetrics.campbell.multiplePaths}
                      />
                      <BoolMetric
                        label="Multiple Outcomes"
                        value={data.complexityMetrics.campbell.multipleOutcomes}
                      />
                      <BoolMetric
                        label="Conflicting Interdependence"
                        value={data.complexityMetrics.campbell.conflictingInterdependence}
                      />
                      <MetricRow
                        label="Uncertain Linkages"
                        value={data.complexityMetrics.campbell.uncertainLinkages}
                        capitalize
                      />
                    </div>
                  ) : (
                    <NoData />
                  )}
                </FrameworkCard>

                {/* Liu & Li (2012) */}
                <FrameworkCard title="Liu & Li (2012)" subtitle="Ten Dimensions" color="purple">
                  {data.complexityMetrics.liuLi ? (
                    <div className="space-y-1.5 text-sm">
                      <MetricRow label="Variety" value={data.complexityMetrics.liuLi.variety} />
                      <MetricRow
                        label="Ambiguity"
                        value={data.complexityMetrics.liuLi.ambiguity}
                        capitalize
                      />
                      <MetricRow
                        label="Instability"
                        value={data.complexityMetrics.liuLi.instability}
                        capitalize
                      />
                      <MetricRow
                        label="Coupling"
                        value={data.complexityMetrics.liuLi.coupling}
                        capitalize
                      />
                      <MetricRow
                        label="Novelty"
                        value={data.complexityMetrics.liuLi.novelty}
                        capitalize
                      />
                      <MetricRow
                        label="Time Pressure"
                        value={data.complexityMetrics.liuLi.timePressure}
                        capitalize
                      />
                      <MetricRow
                        label="Equivocality"
                        value={data.complexityMetrics.liuLi.equivocality}
                        capitalize
                      />
                      <MetricRow
                        label="Scope"
                        value={data.complexityMetrics.liuLi.scope}
                        capitalize
                      />
                      <MetricRow
                        label="Work Flow"
                        value={data.complexityMetrics.liuLi.workFlow}
                        capitalize
                      />
                      <MetricRow
                        label="Coordination"
                        value={data.complexityMetrics.liuLi.coordination}
                        capitalize
                      />
                    </div>
                  ) : (
                    <NoData />
                  )}
                </FrameworkCard>
              </div>

              {/* Academic References */}
              <div className="rounded-lg border bg-gray-50 p-4">
                <h4 className="font-medium text-gray-700 mb-2">Academic References</h4>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>
                    • Wood, R.E. (1986). Task complexity.{' '}
                    <i>Organizational Behavior and Human Decision Processes</i>, 37(1), 60-82.
                  </li>
                  <li>
                    • Campbell, D.J. (1988). Task Complexity. <i>Academy of Management Review</i>,
                    13(1), 40-52.
                  </li>
                  <li>
                    • Liu, L., & Li, X. (2012). Multidimensional Task Complexity.{' '}
                    <i>Procedia Engineering</i>, 29, 3244-3249.
                  </li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Helper components
function FrameworkCard({
  title,
  subtitle,
  color,
  children,
}: {
  title: string;
  subtitle: string;
  color: 'blue' | 'yellow' | 'purple';
  children: React.ReactNode;
}) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    purple: 'border-purple-200 bg-purple-50',
  };

  const headerColors = {
    blue: 'text-blue-800',
    yellow: 'text-yellow-800',
    purple: 'text-purple-800',
  };

  return (
    <div className={cn('rounded-lg border p-4', colors[color])}>
      <div className="mb-3">
        <h4 className={cn('font-semibold', headerColors[color])}>{title}</h4>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function MetricRow({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string | number;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={cn('font-medium text-gray-900', capitalize && 'capitalize')}>{value}</span>
    </div>
  );
}

function BoolMetric({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span
        className={cn(
          'text-xs font-medium px-2 py-0.5 rounded',
          value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600',
        )}
      >
        {value ? 'Yes' : 'No'}
      </span>
    </div>
  );
}

function NoData() {
  return <p className="text-xs text-gray-400 italic">No data available</p>;
}
