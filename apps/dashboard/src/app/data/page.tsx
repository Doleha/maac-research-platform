export default function DataPage() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
        <p className="mt-2 text-gray-600">Upload and validate scenario data</p>
        
        <div className="mt-8 space-y-6">
          {/* Upload Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Upload Scenarios</h2>
            <p className="mt-2 text-gray-500">Drag and drop CSV or JSON files to upload scenario data</p>
            <div className="mt-4 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12">
              <p className="text-gray-400">File upload component will be implemented here</p>
            </div>
          </div>

          {/* Preview Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Data Preview</h2>
            <p className="mt-2 text-gray-500">Preview and validate uploaded data before import</p>
          </div>
        </div>
      </div>
    </div>
  );
}
