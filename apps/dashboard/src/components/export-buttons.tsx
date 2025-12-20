'use client';

import { useState } from 'react';
import { Download, FileText, FileJson, FileImage, Loader2, CheckCircle2 } from 'lucide-react';

type ExportFormat = 'csv' | 'json' | 'pdf';

interface ExportButtonsProps {
  experimentId: string;
  experimentName?: string;
}

export function ExportButtons({ experimentId, experimentName }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [success, setSuccess] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `http://localhost:3001/api/experiments/${experimentId}/export?format=${format}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to export ${format.toUpperCase()}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Set filename
      const timestamp = new Date().toISOString().split('T')[0];
      const name = experimentName
        ? experimentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        : experimentId.substring(0, 8);
      a.download = `experiment_${name}_${timestamp}.${format}`;

      // Trigger download
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(format);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const getButtonClass = (format: ExportFormat) => {
    const baseClass =
      'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    if (success === format) {
      return `${baseClass} bg-green-600 text-white`;
    }

    const colorClasses = {
      csv: 'bg-blue-600 text-white hover:bg-blue-700',
      json: 'bg-purple-600 text-white hover:bg-purple-700',
      pdf: 'bg-red-600 text-white hover:bg-red-700',
    };

    return `${baseClass} ${colorClasses[format]}`;
  };

  const getIcon = (format: ExportFormat) => {
    if (exporting === format) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (success === format) {
      return <CheckCircle2 className="h-4 w-4" />;
    }

    const icons = {
      csv: <FileText className="h-4 w-4" />,
      json: <FileJson className="h-4 w-4" />,
      pdf: <FileImage className="h-4 w-4" />,
    };

    return icons[format];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleExport('csv')}
          disabled={exporting !== null}
          className={getButtonClass('csv')}
        >
          {getIcon('csv')}
          {success === 'csv' ? 'Exported!' : 'Export CSV'}
        </button>

        <button
          onClick={() => handleExport('json')}
          disabled={exporting !== null}
          className={getButtonClass('json')}
        >
          {getIcon('json')}
          {success === 'json' ? 'Exported!' : 'Export JSON'}
        </button>

        <button
          onClick={() => handleExport('pdf')}
          disabled={exporting !== null}
          className={getButtonClass('pdf')}
        >
          {getIcon('pdf')}
          {success === 'pdf' ? 'Exported!' : 'Export PDF'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p className="font-medium mb-1">Export formats:</p>
        <ul className="space-y-0.5 ml-4">
          <li>
            • <span className="font-medium">CSV</span> - Trial data with MAAC scores
          </li>
          <li>
            • <span className="font-medium">JSON</span> - Full experiment data structure
          </li>
          <li>
            • <span className="font-medium">PDF</span> - Formatted report with visualizations
          </li>
        </ul>
      </div>
    </div>
  );
}
