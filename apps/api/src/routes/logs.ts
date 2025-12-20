/**
 * Logs Routes
 *
 * API endpoints for system logging:
 * - GET /logs - Get recent logs
 * - GET /logs/stream - SSE stream of real-time logs
 */

import type { FastifyInstance, FastifyReply } from 'fastify';

// In-memory log buffer (circular buffer of last 1000 logs)
const logBuffer: LogEntry[] = [];
const MAX_LOGS = 1000;

// SSE clients
const sseClients: Set<FastifyReply> = new Set();

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// Generate unique ID
function generateId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Add log entry and broadcast to SSE clients
export function addLog(
  level: LogEntry['level'],
  source: string,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  const entry: LogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    metadata,
  };

  // Add to buffer (circular)
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }

  // Broadcast to SSE clients
  const data = JSON.stringify(entry);
  for (const client of sseClients) {
    try {
      client.raw.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Convenience logging functions
export const logger = {
  info: (source: string, message: string, metadata?: Record<string, unknown>) =>
    addLog('info', source, message, metadata),
  warn: (source: string, message: string, metadata?: Record<string, unknown>) =>
    addLog('warn', source, message, metadata),
  error: (source: string, message: string, metadata?: Record<string, unknown>) =>
    addLog('error', source, message, metadata),
  debug: (source: string, message: string, metadata?: Record<string, unknown>) =>
    addLog('debug', source, message, metadata),
};

/**
 * Register logs routes
 */
export async function logsRoutes(fastify: FastifyInstance): Promise<void> {
  // ==========================================================================
  // GET LOGS
  // ==========================================================================

  /**
   * GET /logs
   * Get recent logs with optional filtering
   */
  fastify.get<{
    Querystring: {
      level?: string;
      source?: string;
      search?: string;
      limit?: number;
      offset?: number;
    };
  }>(
    '/logs',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['info', 'warn', 'error', 'debug'] },
            source: { type: 'string' },
            search: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
      },
    },
    async (request) => {
      const { level, source, search, limit = 100, offset = 0 } = request.query;

      let filtered = [...logBuffer];

      // Apply filters
      if (level) {
        filtered = filtered.filter((log) => log.level === level);
      }
      if (source) {
        filtered = filtered.filter((log) => log.source.includes(source));
      }
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((log) => log.message.toLowerCase().includes(searchLower));
      }

      // Sort by timestamp (newest first)
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Paginate
      const total = filtered.length;
      const logs = filtered.slice(offset, offset + limit);

      return {
        logs,
        total,
        limit,
        offset,
      };
    },
  );

  // ==========================================================================
  // SSE LOG STREAM
  // ==========================================================================

  /**
   * GET /logs/stream
   * Real-time log streaming via Server-Sent Events
   */
  fastify.get('/logs/stream', async (request, reply) => {
    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Add to clients
    sseClients.add(reply);

    // Send initial connection message
    reply.raw.write(
      `data: ${JSON.stringify({
        id: 'connection',
        timestamp: new Date().toISOString(),
        level: 'info',
        source: 'system',
        message: 'Connected to log stream',
      })}\n\n`,
    );

    // Send last 50 logs as initial data
    const recentLogs = logBuffer.slice(-50);
    for (const log of recentLogs) {
      reply.raw.write(`data: ${JSON.stringify(log)}\n\n`);
    }

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(reply);
      }
    }, 30000);

    // Clean up on close
    request.raw.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(reply);
    });

    // Don't end the response
    return reply;
  });

  // ==========================================================================
  // CLEAR LOGS
  // ==========================================================================

  /**
   * DELETE /logs
   * Clear all logs
   */
  fastify.delete('/logs', async () => {
    logBuffer.length = 0;
    return { message: 'Logs cleared', count: 0 };
  });

  // Add initial log
  addLog('info', 'system', 'Log system initialized');
}
