'use client';

import { useState } from 'react';
import { DataUpload } from '@/components/data-upload';
import { DataPreview } from '@/components/data-preview';
import { ScenarioValidator } from '@/components/scenario-validator';
import { TemplateDownload } from '@/components/template-download';
import { CheckCircle } from 'lucide-react';

interface ParsedData {
  headers: string[];
  rows: any[];
  fileName: string;
  fileType: 'csv' | 'json';
  totalRows: number;
}

export default function DataPage() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleDataParsed = (data: ParsedData) => {
    setParsedData(data);
    setImportSuccess(false);
  };

  const handleClear = () => {
    setParsedData(null);
    setImportSuccess(false);
  };

  const handleValidationComplete = (isValid: boolean) => {
    // Validation complete - isValid indicates if data passed validation
    console.log('Validation complete:', isValid);
  };

  const handleImport = async () => {
    if (!parsedData) return;

    try {
      const response = await fetch('/api/scenarios/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarios: parsedData.rows,
          fileName: parsedData.fileName,
        }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      console.log('Import successful:', result);
      setImportSuccess(true);

      // Clear after a delay
      setTimeout(() => {
        handleClear();
      }, 3000);
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
        <p className="mt-2 text-gray-600">Upload and validate scenario data</p>

        <div className="mt-8 space-y-6">
          {/* Template Download Section */}
          <TemplateDownload />

          {/* Upload Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Upload Scenarios</h2>
            <p className="mt-2 text-gray-500">
              Drag and drop CSV or JSON files to upload scenario data
            </p>
            <div className="mt-4">
              <DataUpload onDataParsed={handleDataParsed} onClear={handleClear} />
            </div>
          </div>

          {/* Preview Section */}
          {parsedData && !importSuccess && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <DataPreview
                headers={parsedData.headers}
                rows={parsedData.rows}
                totalRows={parsedData.totalRows}
                fileName={parsedData.fileName}
              />
            </div>
          )}

          {/* Validation Section */}
          {parsedData && !importSuccess && (
            <ScenarioValidator
              data={parsedData.rows}
              onValidationComplete={handleValidationComplete}
              onImport={handleImport}
            />
          )}

          {/* Success Message */}
          {importSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Import Successful!</h3>
                  <p className="mt-1 text-sm text-green-700">
                    {parsedData?.totalRows} scenarios have been imported to the database.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
