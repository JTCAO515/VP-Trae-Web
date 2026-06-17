import { Injectable } from '@nestjs/common';

import type { TripRecord, TripRepository } from './trip.repository';

@Injectable()
export class InMemoryTripRepository implements TripRepository {
  private readonly trips = new Map<string, TripRecord>();

  saveTrip(record: TripRecord): TripRecord {
    this.trips.set(record.trip.id, record);
    return record;
  }

  findTripById(id: string): TripRecord | undefined {
    return this.trips.get(id);
  }

  listTripsByUserId(userId: string): TripRecord[] {
    return [...this.trips.values()].filter((record) => record.trip.userId === userId);
  }

  deleteTrip(id: string): boolean {
    return this.trips.delete(id);
  }
}
