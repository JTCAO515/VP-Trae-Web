import type { TripDayEntity } from './trip-day.entity';

export interface TripSnapshotEntity {
  id: string;
  tripId: string;
  version: number;
  reason: string | null;
  days: TripDayEntity[];
  createdAt: Date;
}
