export type ModelProfileStatus = 'active' | 'disabled';

export interface ModelProfileEntity {
  id: string;
  provider: string;
  model: string;
  capabilities: string[];
  priority: number;
  status: ModelProfileStatus;
  createdAt: Date;
  updatedAt: Date;
}
