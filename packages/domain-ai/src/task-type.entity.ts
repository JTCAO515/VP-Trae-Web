import type { AITaskType } from '@visepanda/shared-types';

export interface TaskTypeEntity {
  code: AITaskType;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
