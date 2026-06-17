import { Injectable } from '@nestjs/common';

import type {
  ContentRepository,
  DestinationRecord,
  ToolGuideRecord,
} from './content.repository';

@Injectable()
export class InMemoryContentRepository implements ContentRepository {
  private readonly destinations = new Map<string, DestinationRecord>();
  private readonly toolGuides = new Map<string, ToolGuideRecord>();

  saveDestination(record: DestinationRecord): DestinationRecord {
    this.destinations.set(record.id, record);
    return record;
  }

  findDestinationById(id: string): DestinationRecord | undefined {
    return this.destinations.get(id);
  }

  listDestinations(): DestinationRecord[] {
    return [...this.destinations.values()];
  }

  saveToolGuide(record: ToolGuideRecord): ToolGuideRecord {
    this.toolGuides.set(record.id, record);
    return record;
  }

  findToolGuideById(id: string): ToolGuideRecord | undefined {
    return this.toolGuides.get(id);
  }

  listToolGuides(): ToolGuideRecord[] {
    return [...this.toolGuides.values()];
  }
}
