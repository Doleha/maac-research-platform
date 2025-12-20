'use client';

import { useEffect, useState } from 'react';
import {
  Server,
  Database,
  HardDrive,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Square,
  RotateCw,
} from 'lucide-react';

interface ContainerStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime: string;
  cpu_percent: number;
  memory_percent: number;
  memory_usage: string;
  health: 'healthy' | 'unhealthy' | 'starting';
}

interface ServiceHealth {
  service: string;
  status: 'connected' | 'disconnected' | 'degraded';
  latency_ms: number;
  details: string;
}

interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  memory_total: string;
  memory_used: string;
  disk_percent: number;
  disk_total: string;
  disk_used: string;
}

export default function SystemHealthPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const [containers, setContainers] = useState<ContainerStatus[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSystemHealth = async () => {
    try {
      const [containersRes, servicesRes, metricsRes] = await Promise.all([
        fetch(`${apiUrl}/system/containers`),
        fetch(`${apiUrl}/system/services`),
        fetch(`${apiUrl}/system/metrics`),
      ]);

      if (!containersRes.ok || !servicesRes.ok || !metricsRes.ok) {
        throw new Error('Failed to fetch system health');
      }

      const [containersData, servicesData, metricsData] = await Promise.all([
        containersRes.json(),
        servicesRes.json(),
        metricsRes.json(),
      ]);

      setContainers(containersData.containers || []);
      setServices(servicesData.services || []);
      setMetrics(metricsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();

    const interval = autoRefresh
      ? setInterval(() => {
          fetchSystemHealth();
        }, 5000)
      : undefined;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleContainerAction = async (
    containerName: string,
    action: 'start' | 'stop' | 'restart',
  ) => {
    try {
      const response = await fetch(`${apiUrl}/system/containers/${containerName}/${action}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} container`);
      }

      // Refresh data
      await fetchSystemHealth();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} container`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'connected':
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'stopped':
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'degraded':
      case 'starting':
      case 'unhealthy':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'connected':
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'stopped':
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'degraded':
      case 'starting':
      case 'unhealthy':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent < 50) return 'bg-green-500';
    if (percent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading && containers.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Loading system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
            <p className="mt-2 text-gray-600">Monitor services, containers, and resources</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-refresh (5s)
            </label>
            <button
              onClick={() => fetchSystemHealth()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-900">{error}</span>
            </div>
          </div>
        )}

        {/* System Metrics */}
        {metrics && (
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* CPU */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-700" />
                  <span className="font-semibold text-gray-900">CPU Usage</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {metrics.cpu_percent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full transition-all ${getProgressColor(metrics.cpu_percent)}`}
                  style={{ width: `${metrics.cpu_percent}%` }}
                />
              </div>
            </div>

            {/* Memory */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-gray-700" />
                  <span className="font-semibold text-gray-900">Memory</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {metrics.memory_percent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full transition-all ${getProgressColor(metrics.memory_percent)}`}
                  style={{ width: `${metrics.memory_percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-600">
                {metrics.memory_used} / {metrics.memory_total}
              </p>
            </div>

            {/* Disk */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-gray-700" />
                  <span className="font-semibold text-gray-900">Disk</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {metrics.disk_percent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full transition-all ${getProgressColor(metrics.disk_percent)}`}
                  style={{ width: `${metrics.disk_percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-600">
                {metrics.disk_used} / {metrics.disk_total}
              </p>
            </div>
          </div>
        )}

        {/* Service Health */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Service Health</h2>
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.service}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <span className="font-medium text-gray-900">{service.service}</span>
                    <p className="text-sm text-gray-600">{service.details}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{service.latency_ms}ms</span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(service.status)}`}
                  >
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Container Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Docker Containers</h2>
          <div className="space-y-3">
            {containers.map((container) => (
              <div
                key={container.name}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-gray-700" />
                    <div>
                      <span className="font-medium text-gray-900">{container.name}</span>
                      <p className="text-sm text-gray-600">Uptime: {container.uptime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(container.health)}`}
                    >
                      {container.health}
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(container.status)}`}
                    >
                      {container.status}
                    </span>
                    <div className="flex gap-1">
                      {container.status === 'stopped' && (
                        <button
                          onClick={() => handleContainerAction(container.name, 'start')}
                          className="rounded p-1 hover:bg-green-100"
                          title="Start"
                        >
                          <Play className="h-4 w-4 text-green-600" />
                        </button>
                      )}
                      {container.status === 'running' && (
                        <>
                          <button
                            onClick={() => handleContainerAction(container.name, 'restart')}
                            className="rounded p-1 hover:bg-blue-100"
                            title="Restart"
                          >
                            <RotateCw className="h-4 w-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleContainerAction(container.name, 'stop')}
                            className="rounded p-1 hover:bg-red-100"
                            title="Stop"
                          >
                            <Square className="h-4 w-4 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resource Usage */}
                <div className="space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-600">CPU</span>
                      <span className="font-medium text-gray-900">
                        {container.cpu_percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full transition-all ${getProgressColor(container.cpu_percent)}`}
                        style={{ width: `${Math.min(container.cpu_percent, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-600">Memory</span>
                      <span className="font-medium text-gray-900">
                        {container.memory_usage} ({container.memory_percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full transition-all ${getProgressColor(container.memory_percent)}`}
                        style={{ width: `${Math.min(container.memory_percent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
