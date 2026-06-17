import type { FavoriteEntity } from './favorite.entity';
import type { GenerationRecordEntity } from './generation-record.entity';
import type { TripDayEntity } from './trip-day.entity';
import type { TripEntity } from './trip.entity';
import type { TripSnapshotEntity } from './trip-snapshot.entity';

export const TRIP_REPOSITORY = Symbol('TRIP_REPOSITORY');

export interface TripRecord {
  trip: TripEntity;
  days: TripDayEntity[];
  snapshots: TripSnapshotEntity[];
  favorite: FavoriteEntity | null;
  generationRecord: GenerationRecordEntity | null;
}

export interface TripRepository {
  saveTrip(record: TripRecord): TripRecord;
  findTripById(id: string): TripRecord | undefined;
  listTripsByUserId(userId: string): TripRecord[];
  deleteTrip(id: string): boolean;
}
