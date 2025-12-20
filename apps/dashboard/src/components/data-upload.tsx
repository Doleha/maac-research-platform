'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ParsedData {
  headers: string[];
  rows: any[];
  fileName: string;
  fileType: 'csv' | 'json';
  totalRows: number;
}

interface DataUploadProps {
  onDataParsed: (data: ParsedData) => void;
  onClear: () => void;
}

export function DataUpload({ onDataParsed, onClear }: DataUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<ParsedData | null>(null);

  const parseCSV = (text: string): { headers: string[]; rows: any[] } => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line, index) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: any = { _lineNumber: index + 2 };
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    return { headers, rows };
  };

  const parseJSON = (text: string): { headers: string[]; rows: any[] } => {
    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of objects');
    }

    if (data.length === 0) {
      throw new Error('Empty JSON array');
    }

    const headers = Object.keys(data[0]);
    const rows = data.map((item, index) => ({
      _lineNumber: index + 1,
      ...item,
    }));

    return { headers, rows };
  };

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const text = await file.text();
      const fileType = file.name.endsWith('.json') ? 'json' : 'csv';

      let parsed;
      if (fileType === 'json') {
        parsed = parseJSON(text);
      } else {
        parsed = parseCSV(text);
      }

      const parsedData: ParsedData = {
        headers: parsed.headers,
        rows: parsed.rows,
        fileName: file.name,
        fileType,
        totalRows: parsed.rows.length,
      };

      setUploadedFile(parsedData);
      onDataParsed(parsedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse file';
      setError(message);
      console.error('File parsing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        handleFile(file);
      } else {
        setError('Please upload a CSV or JSON file');
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClear = () => {
    setUploadedFile(null);
    setError(null);
    onClear();
  };

  if (uploadedFile) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">File Uploaded Successfully</h3>
              <p className="mt-1 text-sm text-green-700">
                <span className="font-medium">{uploadedFile.fileName}</span> (
                {uploadedFile.totalRows.toLocaleString()} rows)
              </p>
              <p className="mt-1 text-xs text-green-600">
                Type: {uploadedFile.fileType.toUpperCase()} • {uploadedFile.headers.length} columns
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="rounded-lg p-1 text-green-600 hover:bg-green-100"
            title="Remove file"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileInput}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={isProcessing}
        />

        <div className="pointer-events-none">
          {isProcessing ? (
            <>
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              <p className="text-sm font-medium text-gray-700">Processing file...</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-sm font-medium text-gray-700">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-gray-500">Supports CSV and JSON files (max 50MB)</p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-900">Upload Error</h4>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="rounded p-1 text-red-600 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* File Format Info */}
      <div className="mt-4 rounded-lg bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-gray-400" />
          <div className="flex-1 text-sm text-gray-600">
            <p className="font-medium text-gray-700">Supported Formats:</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>
                • <strong>CSV:</strong> Comma-separated values with header row
              </li>
              <li>
                • <strong>JSON:</strong> Array of objects with consistent properties
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
