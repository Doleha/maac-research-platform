'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Server,
  Cpu,
  HardDrive,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface WorkerMetrics {
  workerId: string;
  status: 'active' | 'idle' | 'paused' | 'offline';
  currentJob?: string;
  processedJobs: number;
  failedJobs: number;
  activeTime: number; // milliseconds
  lastSeen: string;
  cpu?: number; // percentage
  memory?: number; // percentage
  uptime?: number; // seconds
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  workerId?: string;
  metadata?: Record<string, any>;
}

interface WorkerStatusProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxLogs?: number;
}

export function WorkerStatus({ 
  autoRefresh = true, 
  refreshInterval = 3000,
  maxLogs = 100 
}: WorkerStatusProps) {
  const [workers, setWorkers] = useState<WorkerMetrics[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    fetchWorkerData();
    if (autoRefresh) {
      const interval = setInterval(fetchWorkerData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const fetchWorkerData = async () => {
    try {
      const [workersRes, logsRes] = await Promise.all([
        fetch('http://localhost:3001/api/workers'),
        fetch(`http://localhost:3001/api/workers/logs?limit=${maxLogs}`)
      ]);

      if (!workersRes.ok || !logsRes.ok) {
        throw new Error('Failed to fetch worker data');
      }

      const workersData = await workersRes.json();
      const logsData = await logsRes.json();

      setWorkers(workersData.workers || []);
      setLogs(logsData.logs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getWorkerStatusBadge = (status: WorkerMetrics['status']) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: Activity },
      idle: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle },
      offline: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className={`h-3 w-3 ${status === 'active' ? 'animate-pulse' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getLogLevelBadge = (level: LogEntry['level']) => {
    const badges = {
      info: { bg: 'bg-blue-100', text: 'text-blue-800' },
      warn: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      error: { bg: 'bg-red-100', text: 'text-red-800' },
      debug: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };
    const badge = badges[level];
    return (
      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatActiveTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-red-900">Error: {error}</span>
        </div>
      </div>
    );
  }

  const activeWorkers = workers.filter(w => w.status === 'active').length;
  const totalProcessed = workers.reduce((sum, w) => sum + w.processedJobs, 0);
  const totalFailed = workers.reduce((sum, w) => sum + w.failedJobs, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Workers</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {activeWorkers} / {workers.length}
              </p>
            </div>
            <Server className="h-8 w-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jobs Processed</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{totalProcessed}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jobs Failed</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{totalFailed}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Worker Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Workers ({workers.length})
          </h3>
          <button
            onClick={fetchWorkerData}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {workers.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <Server className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">No workers found</p>
            <p className="mt-1 text-xs text-gray-500">Workers will appear here when they connect</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {workers.map((worker) => (
              <div
                key={worker.workerId}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {worker.workerId.substring(0, 12)}
                      </h4>
                      {getWorkerStatusBadge(worker.status)}
                    </div>
                    {worker.currentJob && (
                      <p className="mt-1 text-xs text-gray-600">
                        Processing: <code className="font-mono">{worker.currentJob.substring(0, 8)}</code>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Processed</p>
                    <p className="mt-0.5 font-semibold text-green-600">{worker.processedJobs}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Failed</p>
                    <p className="mt-0.5 font-semibold text-red-600">{worker.failedJobs}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Active Time</p>
                    <p className="mt-0.5 font-semibold text-gray-900">
                      {formatActiveTime(worker.activeTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Seen</p>
                    <p className="mt-0.5 font-semibold text-gray-900">
                      {new Date(worker.lastSeen).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {(worker.cpu !== undefined || worker.memory !== undefined) && (
                  <div className="mt-4 space-y-2">
                    {worker.cpu !== undefined && (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" />
                            CPU
                          </span>
                          <span>{worker.cpu.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              worker.cpu > 80 ? 'bg-red-600' : worker.cpu > 60 ? 'bg-yellow-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${worker.cpu}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {worker.memory !== undefined && (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            Memory
                          </span>
                          <span>{worker.memory.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              worker.memory > 80 ? 'bg-red-600' : worker.memory > 60 ? 'bg-yellow-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${worker.memory}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {worker.uptime !== undefined && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Uptime: {formatUptime(worker.uptime)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logs Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Worker Logs (Last {maxLogs})
          </h3>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Auto-scroll
          </label>
        </div>

        <div className="h-96 overflow-y-auto rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              No logs available
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 rounded bg-white p-2">
                  <span className="shrink-0 text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {getLogLevelBadge(log.level)}
                  {log.workerId && (
                    <code className="shrink-0 text-gray-600">[{log.workerId.substring(0, 8)}]</code>
                  )}
                  <span className={`flex-1 ${log.level === 'error' ? 'text-red-800' : 'text-gray-800'}`}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
