import type { AITaskType } from '@visepanda/shared-types';

export interface PromptTemplateEntity {
  id: string;
  taskType: AITaskType;
  version: string;
  template: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
