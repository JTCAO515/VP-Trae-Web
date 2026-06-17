import type { TripStatus } from '@visepanda/shared-types';

export interface TripEntity {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  aiSummary: string;
  createdAt: Date;
  updatedAt: Date;
}
