import type { AITaskType, TripSourceType } from '@visepanda/shared-types';

export interface GenerationRecordEntity {
  id: string;
  tripId: string;
  userId: string;
  sourceType: TripSourceType;
  invocationLogId: string;
  taskType: AITaskType;
  createdAt: Date;
}
