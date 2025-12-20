'use client';

import { useEffect, useState } from 'react';
import { ExportButtons } from '@/components/export-buttons';
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ExperimentDetails {
  experimentId: string;
  name: string;
  description: string;
  totalTrials: number;
  completedTrials: number;
}

export default function ExperimentExportPage({ params }: { params: { id: string } }) {
  const [experiment, setExperiment] = useState<ExperimentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExperiment();
  }, [params.id]);

  const fetchExperiment = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/experiments/${params.id}/status`);
      if (response.ok) {
        const data = await response.json();
        setExperiment(data);
      }
    } catch (err) {
      console.error('Failed to fetch experiment', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/experiments/${params.id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Experiment
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Export Experiment Data</h1>
              {experiment && (
                <p className="mt-1 text-gray-600">{experiment.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Export Options
          </h2>
          {experiment && (
            <ExportButtons 
              experimentId={params.id} 
              experimentName={experiment.name}
            />
          )}
        </div>

        {/* Information */}
        {experiment && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Experiment Summary
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{experiment.name}</dd>
              </div>
              {experiment.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{experiment.description}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Completed Trials</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {experiment.completedTrials} / {experiment.totalTrials}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Experiment ID</dt>
                <dd className="mt-1 text-sm font-mono text-gray-700">{experiment.experimentId}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Export Guide */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Export Guide
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <span className="font-medium">CSV:</span> Best for spreadsheet analysis and statistical tools. Includes trial IDs, scenarios, models, configurations, and all MAAC dimensional scores.
            </p>
            <p>
              <span className="font-medium">JSON:</span> Complete structured data including metadata, configurations, and nested results. Ideal for programmatic analysis and re-import.
            </p>
            <p>
              <span className="font-medium">PDF:</span> Human-readable report with executive summary, visualizations, and detailed results. Perfect for sharing and presentations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
