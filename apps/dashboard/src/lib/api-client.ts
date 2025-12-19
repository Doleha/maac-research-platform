const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = {
  // Experiments
  async createExperiment(config: any) {
    const res = await fetch(`${API_BASE_URL}/experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  async getExperimentStatus(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/experiments/${experimentId}/status`);
    return res.json();
  },

  async getExperimentResults(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/experiments/${experimentId}/results`);
    return res.json();
  },

  // Analysis
  async runAnalysis(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/analysis/${experimentId}`, {
      method: 'POST'
    });
    return res.json();
  },

  async getAnalysisResults(experimentId: string) {
    const res = await fetch(`${API_BASE_URL}/analysis/${experimentId}/latest`);
    return res.json();
  }
};
