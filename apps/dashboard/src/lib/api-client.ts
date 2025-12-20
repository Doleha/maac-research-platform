const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ExperimentListFilters {
  status?: string;
  sortBy?: 'createdAt' | 'name' | 'status' | 'totalTrials';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface Experiment {
  id: number;
  experimentId: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  domains: string[];
  tiers: string[];
  models: string[];
  toolConfigs: any;
  totalTrials: number;
  completedTrials: number;
  failedTrials: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export const apiClient = {
  // Experiments - List with filters
  async listExperiments(filters: ExperimentListFilters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.offset) params.set('offset', String(filters.offset));
    
    const res = await fetch(`${API_BASE_URL}/api/experiments?${params}`);
    return res.json();
  },

  // Experiments - Get by ID
  async getExperiment(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/api/experiments/${experimentId}`);
    return res.json();
  },

  // Experiments - Create
  async createExperiment(config: any) {
    const res = await fetch(`${API_BASE_URL}/api/experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  // Experiments - Get Status
  async getExperimentStatus(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/api/experiments/${experimentId}/status`);
    return res.json();
  },

  // Experiments - Get Results
  async getExperimentResults(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/api/experiments/${experimentId}/results`);
    const data = await res.json();
    return data.results || data;
  },

  // Experiments - Stop
  async stopExperiment(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/api/experiments/${experimentId}/stop`, {
      method: 'POST',
    });
    return res.json();
  },

  // Experiments - Pause
  async pauseExperiment(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/api/experiments/${experimentId}/pause`, {
      method: 'POST',
    });
    return res.json();
  },

  // Experiments - Resume
  async resumeExperiment(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/api/experiments/${experimentId}/resume`, {
      method: 'POST',
    });
    return res.json();
  },

  // Analysis
  async runAnalysis(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/api/analysis/${experimentId}`, {
      method: 'POST',
    });
    return res.json();
  },

  async getAnalysisResults(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/api/analysis/${experimentId}/latest`);
    return res.json();
  },
};
