'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';

// Scenario validation schema - matches MAAC system requirements
const scenarioSchema = z.object({
  task_id: z.string().min(1, 'task_id is required'),
  task_title: z.string().min(1, 'task_title is required'),
  task_description: z.string().min(1, 'task_description is required'),
  business_context: z.string().min(1, 'business_context is required'),
  domain: z.enum(['problem_solving', 'creative_writing', 'data_analysis', 'technical_reasoning'], {
    errorMap: () => ({ message: 'Invalid domain' }),
  }),
  scenario_type: z.enum(['control', 'test'], {
    errorMap: () => ({ message: 'scenario_type must be "control" or "test"' }),
  }),
  requirements: z.union([z.array(z.string()), z.string()]).refine(
    (val) => (Array.isArray(val) ? val.length > 0 : val.length > 0),
    { message: 'requirements is required' }
  ),
  success_criteria: z.union([z.array(z.string()), z.string()]).refine(
    (val) => (Array.isArray(val) ? val.length > 0 : val.length > 0),
    { message: 'success_criteria is required' }
  ),
  complexity_level: z.enum(['simple', 'moderate', 'complex'], {
    errorMap: () => ({ message: 'complexity_level must be "simple", "moderate", or "complex"' }),
  }),
  estimated_duration: z.string().min(1, 'estimated_duration is required'),
  expected_calculations: z.union([z.record(z.any()), z.string()]).refine(
    (val) => (typeof val === 'object' && Object.keys(val).length > 0) || (typeof val === 'string' && val.length > 0),
    { message: 'expected_calculations is required' }
  ),
  expected_insights: z.union([z.array(z.string()), z.string()]).refine(
    (val) => (Array.isArray(val) ? val.length > 0 : val.length > 0),
    { message: 'expected_insights is required' }
  ),
  metadata: z.union([z.record(z.any()), z.string()]).refine(
    (val) => (typeof val === 'object' && Object.keys(val).length > 0) || (typeof val === 'string' && val.length > 0),
    { message: 'metadata is required' }
  ),
});

interface ValidationError {
  line: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ScenarioValidatorProps {
  data: any[];
  onValidationComplete: (isValid: boolean, errors: ValidationError[]) => void;
  onImport: () => void;
}

export function ScenarioValidator({
  data,
  onValidationComplete,
  onImport,
}: ScenarioValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    valid: number;
    errors: ValidationError[];
    warnings: ValidationError[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const validateData = async () => {
    setIsValidating(true);

    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let validCount = 0;

    data.forEach((row, index) => {
      const lineNumber = row._lineNumber || index + 1;

      try {
        // Validate against schema
        scenarioSchema.parse(row);
        validCount++;

        // Add warnings for optional fields
        if (!row.expected_output) {
          warnings.push({
            line: lineNumber,
            field: 'expected_output',
            message: 'Missing expected_output (optional but recommended)',
            severity: 'warning',
          });
        }

        if (!row.difficulty) {
          warnings.push({
            line: lineNumber,
            field: 'difficulty',
            message: 'Missing difficulty level',
            severity: 'warning',
          });
        }
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err: z.ZodIssue) => {
            errors.push({
              line: lineNumber,
              field: err.path.join('.'),
              message: err.message,
              severity: 'error',
            });
          });
        }
      }
    });

    const results = {
      valid: validCount,
      errors,
      warnings,
    };

    setValidationResults(results);
    onValidationComplete(errors.length === 0, errors);
    setIsValidating(false);
  };

  const handleImport = async () => {
    setIsImporting(true);

    try {
      // Call the onImport callback which will handle the API call
      await onImport();
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const hasErrors = validationResults && validationResults.errors.length > 0;
  const hasWarnings = validationResults && validationResults.warnings.length > 0;

  return (
    <div className="space-y-4">
      {/* Validation Controls */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scenario Validation</h3>
          <p className="text-sm text-gray-600">Validate data before importing to the database</p>
        </div>
        <button
          onClick={validateData}
          disabled={isValidating}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            'Validate Data'
          )}
        </button>
      </div>

      {/* Validation Results */}
      {validationResults && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{validationResults.valid}</p>
                  <p className="text-sm text-green-700">Valid Scenarios</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900">
                    {validationResults.errors.length}
                  </p>
                  <p className="text-sm text-red-700">Errors</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-900">
                    {validationResults.warnings.length}
                  </p>
                  <p className="text-sm text-yellow-700">Warnings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Errors List */}
          {hasErrors && (
            <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-900">
                <XCircle className="h-5 w-5" />
                Validation Errors ({validationResults.errors.length})
              </h4>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {validationResults.errors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded border border-red-100 bg-red-50 p-3 text-sm"
                  >
                    <span className="font-mono text-xs font-medium text-red-700">
                      Line {error.line}
                    </span>
                    <div className="flex-1">
                      {error.field && (
                        <span className="font-medium text-red-900">{error.field}: </span>
                      )}
                      <span className="text-red-800">{error.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings List */}
          {hasWarnings && (
            <div className="rounded-lg border border-yellow-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-yellow-900">
                <AlertTriangle className="h-5 w-5" />
                Warnings ({validationResults.warnings.length})
              </h4>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {validationResults.warnings.slice(0, 10).map((warning, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded border border-yellow-100 bg-yellow-50 p-3 text-sm"
                  >
                    <span className="font-mono text-xs font-medium text-yellow-700">
                      Line {warning.line}
                    </span>
                    <div className="flex-1">
                      {warning.field && (
                        <span className="font-medium text-yellow-900">{warning.field}: </span>
                      )}
                      <span className="text-yellow-800">{warning.message}</span>
                    </div>
                  </div>
                ))}
                {validationResults.warnings.length > 10 && (
                  <p className="text-xs text-yellow-600">
                    ...and {validationResults.warnings.length - 10} more warnings
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import Button */}
          {!hasErrors && (
            <div className="flex items-center justify-end gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-600">
                {validationResults.valid} scenarios ready to import
              </p>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import to Database'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
