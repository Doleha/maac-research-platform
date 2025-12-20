export default function ExperimentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900">Experiment Details</h1>
        <p className="mt-2 text-gray-600">ID: {params.id}</p>
        
        <div className="mt-8 space-y-6">
          {/* Metadata Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Experiment Information</h2>
            <p className="mt-2 text-gray-500">Experiment metadata and configuration details</p>
          </div>

          {/* Controls Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Execution Controls</h2>
            <p className="mt-2 text-gray-500">Start, pause, stop, and monitor experiment execution</p>
          </div>

          {/* Results Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Results</h2>
            <p className="mt-2 text-gray-500">Analysis results and visualizations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
