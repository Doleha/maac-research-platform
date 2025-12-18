// Database model types
export interface DatabaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends DatabaseModel {
  email: string;
  name: string;
  role: 'admin' | 'researcher' | 'viewer';
}

export interface Experiment extends DatabaseModel {
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  userId: string;
}

export interface ExperimentData extends DatabaseModel {
  experimentId: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export * from './index';
