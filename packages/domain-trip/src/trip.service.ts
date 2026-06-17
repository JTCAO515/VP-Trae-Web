import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type {
  AITaskType,
  GenerationRecordPayload,
  TripDetail,
  TripSnapshotSummary,
  TripSourceType,
  TripStatus,
  TripSummary,
} from '@visepanda/shared-types';

import type { FavoriteEntity } from './favorite.entity';
import type { GenerationRecordEntity } from './generation-record.entity';
import { TRIP_REPOSITORY, type TripRecord, type TripRepository } from './trip.repository';
import type { TripDayEntity } from './trip-day.entity';
import type { TripEntity } from './trip.entity';
import type { TripItemEntity } from './trip-item.entity';
import type { TripSnapshotEntity } from './trip-snapshot.entity';

export const INVOCATION_LOG_READER = Symbol('INVOCATION_LOG_READER');

export interface InvocationLogReader {
  getInvocationLog(logId: string): unknown;
}

export interface CreateTripInput {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  aiSummary: string;
  favorite?: boolean;
  source: {
    type: TripSourceType;
    invocationLogId: string;
    taskType: AITaskType;
  };
  days: Array<{
    dayNumber: number;
    title: string;
    items: Array<{
      type: string;
      title: string;
      startTime: string;
      endTime: string;
      notes: string;
    }>;
  }>;
}

export interface UpdateTripInput {
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  aiSummary?: string;
  status?: TripStatus;
}

export interface CreateTripSnapshotInput {
  reason?: string;
}

@Injectable()
export class TripService {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly repository: TripRepository,
    @Optional()
    @Inject(INVOCATION_LOG_READER)
    private readonly invocationLogReader?: InvocationLogReader,
  ) {}

  createTrip(userId: string, input: CreateTripInput): TripDetail {
    this.validateCreateInput(input);
    this.assertInvocationSource(input.source.type, input.source.invocationLogId);

    const now = new Date();
    const trip: TripEntity = {
      id: randomUUID(),
      userId,
      title: input.title.trim(),
      destination: input.destination.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'draft',
      aiSummary: input.aiSummary.trim(),
      createdAt: now,
      updatedAt: now,
    };
    const days = input.days.map((day) => this.toTripDayEntity(trip.id, day));
    const generationRecord: GenerationRecordEntity = {
      id: randomUUID(),
      tripId: trip.id,
      userId,
      sourceType: input.source.type,
      invocationLogId: input.source.invocationLogId,
      taskType: input.source.taskType,
      createdAt: now,
    };
    const favorite = input.favorite ? this.createFavorite(userId, trip.id, now) : null;
    const record: TripRecord = {
      trip,
      days,
      snapshots: [],
      favorite,
      generationRecord,
    };

    this.repository.saveTrip(record);
    return this.toTripDetail(record);
  }

  updateTrip(userId: string, tripId: string, input: UpdateTripInput): TripDetail {
    const record = this.getOwnedTripRecord(userId, tripId);
    const updatedAt = new Date();

    record.trip = {
      ...record.trip,
      title: input.title?.trim() ?? record.trip.title,
      destination: input.destination?.trim() ?? record.trip.destination,
      startDate: input.startDate ?? record.trip.startDate,
      endDate: input.endDate ?? record.trip.endDate,
      aiSummary: input.aiSummary?.trim() ?? record.trip.aiSummary,
      status: input.status ?? record.trip.status,
      updatedAt,
    };
    this.repository.saveTrip(record);

    return this.toTripDetail(record);
  }

  listTrips(userId: string): TripSummary[] {
    return this.repository
      .listTripsByUserId(userId)
      .sort((left, right) => right.trip.updatedAt.getTime() - left.trip.updatedAt.getTime())
      .map((record) => ({
        id: record.trip.id,
        title: record.trip.title,
        destination: record.trip.destination,
        startDate: record.trip.startDate,
        endDate: record.trip.endDate,
        status: record.trip.status,
        dayCount: record.days.length,
        isFavorite: Boolean(record.favorite),
        updatedAt: record.trip.updatedAt.toISOString(),
      }));
  }

  getTrip(userId: string, tripId: string): TripDetail {
    return this.toTripDetail(this.getOwnedTripRecord(userId, tripId));
  }

  createSnapshot(userId: string, tripId: string, input: CreateTripSnapshotInput): TripSnapshotSummary {
    const record = this.getOwnedTripRecord(userId, tripId);
    const snapshot = this.buildSnapshot(record, input.reason);

    record.snapshots.push(snapshot);
    record.trip.updatedAt = snapshot.createdAt;
    this.repository.saveTrip(record);

    return this.toSnapshotSummary(snapshot);
  }

  setFavorite(userId: string, tripId: string, favorite: boolean): TripDetail {
    const record = this.getOwnedTripRecord(userId, tripId);
    record.favorite = favorite ? this.createFavorite(userId, tripId, new Date()) : null;
    record.trip.updatedAt = new Date();
    this.repository.saveTrip(record);

    return this.toTripDetail(record);
  }

  deleteTrip(tripId: string, userId: string): { deleted: true } {
    this.getOwnedTripRecord(userId, tripId);
    this.repository.deleteTrip(tripId);
    return { deleted: true };
  }

  private getOwnedTripRecord(userId: string, tripId: string): TripRecord {
    const record = this.repository.findTripById(tripId);

    if (!record || record.trip.userId !== userId) {
      throw new NotFoundException('Trip not found');
    }

    return record;
  }

  private buildSnapshot(record: TripRecord, reason?: string): TripSnapshotEntity {
    const createdAt = new Date();

    return {
      id: randomUUID(),
      tripId: record.trip.id,
      version: record.snapshots.length + 1,
      reason: reason?.trim() || null,
      days: record.days.map((day) => ({
        ...day,
        items: day.items.map((item) => ({ ...item })),
      })),
      createdAt,
    };
  }

  private toTripDayEntity(
    tripId: string,
    input: CreateTripInput['days'][number],
  ): TripDayEntity {
    const tripDayId = randomUUID();

    return {
      id: tripDayId,
      tripId,
      dayNumber: input.dayNumber,
      title: input.title.trim(),
      items: input.items.map((item) => this.toTripItemEntity(tripDayId, item)),
    };
  }

  private toTripItemEntity(
    tripDayId: string,
    input: CreateTripInput['days'][number]['items'][number],
  ): TripItemEntity {
    return {
      id: randomUUID(),
      tripDayId,
      type: input.type.trim(),
      title: input.title.trim(),
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes.trim(),
    };
  }

  private createFavorite(userId: string, tripId: string, createdAt: Date): FavoriteEntity {
    return {
      id: randomUUID(),
      userId,
      tripId,
      createdAt,
    };
  }

  private toTripDetail(record: TripRecord): TripDetail {
    const latestSnapshot = record.snapshots[record.snapshots.length - 1];

    return {
      id: record.trip.id,
      title: record.trip.title,
      destination: record.trip.destination,
      startDate: record.trip.startDate,
      endDate: record.trip.endDate,
      status: record.trip.status,
      aiSummary: record.trip.aiSummary,
      isFavorite: Boolean(record.favorite),
      snapshotCount: record.snapshots.length,
      latestSnapshotId: latestSnapshot?.id ?? null,
      days: record.days.map((day) => ({
        id: day.id,
        dayNumber: day.dayNumber,
        title: day.title,
        items: day.items.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          startTime: item.startTime,
          endTime: item.endTime,
          notes: item.notes,
        })),
      })),
      generationRecord: this.toGenerationRecordPayload(record.generationRecord),
      createdAt: record.trip.createdAt.toISOString(),
      updatedAt: record.trip.updatedAt.toISOString(),
    };
  }

  private toGenerationRecordPayload(
    generationRecord: GenerationRecordEntity | null,
  ): GenerationRecordPayload | null {
    if (!generationRecord) {
      return null;
    }

    return {
      id: generationRecord.id,
      sourceType: generationRecord.sourceType,
      invocationLogId: generationRecord.invocationLogId,
      taskType: generationRecord.taskType,
    };
  }

  private toSnapshotSummary(snapshot: TripSnapshotEntity): TripSnapshotSummary {
    return {
      id: snapshot.id,
      tripId: snapshot.tripId,
      version: snapshot.version,
      reason: snapshot.reason,
      createdAt: snapshot.createdAt.toISOString(),
    };
  }

  private validateCreateInput(input: CreateTripInput): void {
    if (!input.title.trim() || !input.destination.trim()) {
      throw new BadRequestException('Trip title and destination are required');
    }

    if (!input.days.length) {
      throw new BadRequestException('Trip days are required');
    }
  }

  private assertInvocationSource(sourceType: TripSourceType, invocationLogId: string): void {
    const normalizedLogId = invocationLogId.trim();

    if (!normalizedLogId) {
      throw new BadRequestException('Invocation log is required');
    }

    if (sourceType === 'task' && !this.invocationLogReader?.getInvocationLog(normalizedLogId)) {
      throw new BadRequestException('Invocation log not found');
    }
  }
}
