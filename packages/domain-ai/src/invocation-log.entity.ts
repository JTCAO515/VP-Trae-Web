import type { AITaskType } from '@visepanda/shared-types';

export interface InvocationAttemptLog {
  modelId: string;
  model: string;
  provider: string;
  status: 'succeeded' | 'failed';
  errorMessage: string | null;
}

export interface InvocationLogEntity {
  id: string;
  taskType: AITaskType;
  routePolicy: string;
  promptTemplateVersion: string;
  selectedModelId: string;
  selectedModel: string;
  provider: string;
  attempts: InvocationAttemptLog[];
  fallbackUsed: boolean;
  requestPayload: Record<string, unknown>;
  responsePayload: {
    answer: string;
  };
  createdAt: Date;
  completedAt: Date;
}
