import type { AITaskType } from '@visepanda/shared-types';

export interface RoutePolicyEntity {
  id: string;
  taskType: AITaskType;
  routePolicy: string;
  primaryModelId: string;
  fallbackModelIds: string[];
  promptTemplateVersion: string;
  createdAt: Date;
  updatedAt: Date;
}
