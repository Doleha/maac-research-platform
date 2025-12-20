export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Configure system settings and credentials</p>
        
        <div className="mt-8 space-y-6">
          {/* LLM Credentials */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">LLM API Credentials</h2>
            <p className="mt-2 text-gray-500">Configure API keys for language model providers</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">OpenAI API Key</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Anthropic API Key</label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Database Configuration */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Database Configuration</h2>
            <p className="mt-2 text-gray-500">Connection settings for PostgreSQL, Neo4j, and Redis</p>
          </div>

          {/* Rate Limiting */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Rate Limiting</h2>
            <p className="mt-2 text-gray-500">Control worker limits and API request rates</p>
          </div>
        </div>
      </div>
    </div>
  );
}
