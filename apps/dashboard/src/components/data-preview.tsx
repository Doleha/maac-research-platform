'use client';

import { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';

interface DataPreviewProps {
  headers: string[];
  rows: any[];
  totalRows: number;
  fileName: string;
  maxRows?: number;
}

export function DataPreview({
  headers,
  rows,
  totalRows,
  fileName,
  maxRows = 50,
}: DataPreviewProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState(rows);

  const displayRows = localData.slice(0, maxRows);
  const isShowingAll = displayRows.length === totalRows;

  const handleEdit = (rowIndex: number, colName: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, col: colName });
    setEditValue(String(currentValue || ''));
  };

  const handleSave = () => {
    if (!editingCell) return;

    const newData = [...localData];
    newData[editingCell.row][editingCell.col] = editValue;
    setLocalData(newData);
    setEditingCell(null);
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
          <p className="text-sm text-gray-600">
            Showing {displayRows.length.toLocaleString()} of {totalRows.toLocaleString()} rows
            {!isShowingAll && ' (limited preview)'}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          File: <span className="font-medium">{fileName}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                #
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {header}
                </th>
              ))}
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {displayRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="sticky left-0 bg-white px-3 py-2 text-xs font-medium text-gray-500">
                  {row._lineNumber || rowIndex + 1}
                </td>
                {headers.map((header) => {
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === header;
                  const value = row[header];

                  return (
                    <td key={header} className="px-3 py-2 text-sm text-gray-900">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="w-full rounded border border-blue-500 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleSave}
                            className="rounded p-1 text-green-600 hover:bg-green-50"
                            title="Save"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={value ? '' : 'italic text-gray-400'}
                          title={String(value || 'empty')}
                        >
                          {String(value || '—')}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2">
                  {!editingCell && (
                    <button
                      onClick={() => handleEdit(rowIndex, headers[0], row[headers[0]])}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Edit row"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      {!isShowingAll && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          <p>
            ℹ️ Displaying first {maxRows} rows for preview. All {totalRows.toLocaleString()} rows
            will be imported.
          </p>
        </div>
      )}

      {/* Column Summary */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="mb-2 text-sm font-medium text-gray-900">Column Summary</h4>
        <div className="flex flex-wrap gap-2">
          {headers.map((header) => (
            <span
              key={header}
              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm"
            >
              {header}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
