import type { ContentVersionEntity } from './content-version.entity';

export const CONTENT_REPOSITORY = Symbol('CONTENT_REPOSITORY');

export interface DestinationSnapshot {
  slug: string;
  locale: string;
  name: string;
  summary: string;
  body: string;
  highlights: string[];
}

export interface ToolGuideSnapshot {
  slug: string;
  locale: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

export interface DestinationRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  activeVersionNo: number;
  publishedVersionNo: number | null;
  versions: ContentVersionEntity<DestinationSnapshot>[];
}

export interface ToolGuideRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  activeVersionNo: number;
  publishedVersionNo: number | null;
  versions: ContentVersionEntity<ToolGuideSnapshot>[];
}

export interface ContentRepository {
  saveDestination(record: DestinationRecord): DestinationRecord;
  findDestinationById(id: string): DestinationRecord | undefined;
  listDestinations(): DestinationRecord[];
  saveToolGuide(record: ToolGuideRecord): ToolGuideRecord;
  findToolGuideById(id: string): ToolGuideRecord | undefined;
  listToolGuides(): ToolGuideRecord[];
}
