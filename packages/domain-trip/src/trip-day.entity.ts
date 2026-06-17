import type { TripItemEntity } from './trip-item.entity';

export interface TripDayEntity {
  id: string;
  tripId: string;
  dayNumber: number;
  title: string;
  items: TripItemEntity[];
}
