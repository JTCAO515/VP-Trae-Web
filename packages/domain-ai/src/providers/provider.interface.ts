import type { AITaskType } from '@visepanda/shared-types';

import type { ModelProfileEntity } from '../model-profile.entity';

export interface AIProviderInvocationRequest {
  modelProfile: ModelProfileEntity;
  taskType: AITaskType;
  prompt: string;
  promptTemplateVersion: string;
  input: Record<string, unknown>;
}

export interface AIProviderInvocationResult {
  answer: string;
}

export interface AIProvider {
  readonly name: string;
  invoke(request: AIProviderInvocationRequest): Promise<AIProviderInvocationResult>;
}

export const AI_PROVIDERS = 'AI_PROVIDERS';
