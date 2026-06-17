import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type {
  ContentReviewState,
  DestinationDetail,
  DestinationSummary,
  ToolGuideDetail,
  ToolGuideSummary,
} from '@visepanda/shared-types';

import type { ContentVersionEntity } from './content-version.entity';
import {
  CONTENT_REPOSITORY,
  type ContentRepository,
  type DestinationRecord,
  type DestinationSnapshot,
  type ToolGuideRecord,
  type ToolGuideSnapshot,
} from './content.repository';
import type { DestinationEntity } from './destination.entity';
import type { ToolGuideEntity } from './tool-guide.entity';

export interface CreateDestinationDraftInput {
  slug: string;
  locale: string;
  name: string;
  summary: string;
  body: string;
  highlights: string[];
}

export interface UpdateDestinationDraftInput {
  name?: string;
  summary?: string;
  body?: string;
  highlights?: string[];
}

export interface CreateToolGuideDraftInput {
  slug: string;
  locale: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

export interface ReviewContentInput {
  reviewState: ContentReviewState;
}

export interface RollbackContentInput {
  versionNo?: number;
}

@Injectable()
export class ContentService {
  constructor(
    @Inject(CONTENT_REPOSITORY)
    private readonly repository: ContentRepository,
  ) {}

  createDestinationDraft(input: CreateDestinationDraftInput): DestinationEntity {
    const now = new Date();
    const record: DestinationRecord = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      activeVersionNo: 1,
      publishedVersionNo: null,
      versions: [
        this.createDestinationVersion(randomUUID(), 1, this.toDestinationSnapshot(input), now),
      ],
    };

    record.versions[0].contentId = record.id;
    this.repository.saveDestination(record);

    return this.toDestinationEntity(record, record.versions[0]);
  }

  updateDestinationDraft(id: string, input: UpdateDestinationDraftInput): DestinationEntity {
    const record = this.getDestinationRecord(id);
    const activeVersion = this.getDestinationVersion(record, record.activeVersionNo);
    const now = new Date();
    const nextVersionNo = this.getNextVersionNo(record.versions);
    const snapshot: DestinationSnapshot = {
      ...activeVersion.snapshot,
      ...input,
      highlights: input.highlights ? [...input.highlights] : activeVersion.snapshot.highlights,
    };
    const nextVersion = this.createDestinationVersion(record.id, nextVersionNo, snapshot, now);

    record.activeVersionNo = nextVersionNo;
    record.updatedAt = now;
    record.versions.push(nextVersion);
    this.repository.saveDestination(record);

    return this.toDestinationEntity(record, nextVersion);
  }

  reviewDestination(id: string, input: ReviewContentInput): DestinationEntity {
    if (input.reviewState !== 'approved') {
      throw new BadRequestException('Unsupported review state');
    }

    const record = this.getDestinationRecord(id);
    const activeVersion = this.getDestinationVersion(record, record.activeVersionNo);
    activeVersion.reviewState = 'approved';
    activeVersion.updatedAt = new Date();
    record.updatedAt = activeVersion.updatedAt;
    this.repository.saveDestination(record);

    return this.toDestinationEntity(record, activeVersion);
  }

  publishDestination(id: string): DestinationEntity {
    const record = this.getDestinationRecord(id);
    const activeVersion = this.getDestinationVersion(record, record.activeVersionNo);

    if (activeVersion.reviewState !== 'approved') {
      throw new BadRequestException('Content must be approved before publish');
    }

    const now = new Date();
    activeVersion.status = 'published';
    activeVersion.publishedAt = now;
    activeVersion.updatedAt = now;
    record.publishedVersionNo = activeVersion.versionNo;
    record.updatedAt = now;
    this.repository.saveDestination(record);

    return this.toDestinationEntity(record, activeVersion);
  }

  rollbackDestination(id: string, input: RollbackContentInput): DestinationEntity {
    const record = this.getDestinationRecord(id);
    const publishedVersions = record.versions.filter((version) => version.status === 'published');

    if (publishedVersions.length === 0) {
      throw new BadRequestException('No published version to rollback');
    }

    const currentPublishedVersionNo = record.publishedVersionNo;
    const fallbackTarget =
      input.versionNo ??
      [...publishedVersions]
        .reverse()
        .find((version) => version.versionNo !== currentPublishedVersionNo)?.versionNo;
    const targetVersion = fallbackTarget
      ? record.versions.find((version) => version.versionNo === fallbackTarget)
      : undefined;

    if (!targetVersion || targetVersion.status !== 'published') {
      throw new BadRequestException('Rollback target version not found');
    }

    const now = new Date();
    const nextVersionNo = this.getNextVersionNo(record.versions);
    const rollbackVersion = this.createDestinationVersion(
      record.id,
      nextVersionNo,
      targetVersion.snapshot,
      now,
    );
    rollbackVersion.reviewState = 'approved';
    rollbackVersion.status = 'published';
    rollbackVersion.publishedAt = now;
    rollbackVersion.updatedAt = now;

    record.activeVersionNo = nextVersionNo;
    record.publishedVersionNo = nextVersionNo;
    record.updatedAt = now;
    record.versions.push(rollbackVersion);
    this.repository.saveDestination(record);

    return this.toDestinationEntity(record, rollbackVersion);
  }

  listPublishedDestinations(locale = 'en-US'): DestinationSummary[] {
    return this.repository
      .listDestinations()
      .map((record) => this.getPublishedDestinationVersion(record))
      .filter((version): version is ContentVersionEntity<DestinationSnapshot> => Boolean(version))
      .filter((version) => version.locale === locale)
      .map((version) => this.toDestinationSummary(version.contentId, version))
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
  }

  getPublishedDestination(id: string, locale = 'en-US'): DestinationDetail {
    const record = this.getDestinationRecord(id);
    const version = this.getPublishedDestinationVersion(record);

    if (!version || version.locale !== locale) {
      throw new BadRequestException('Published destination not found');
    }

    return this.toDestinationDetail(record.id, version);
  }

  createToolGuideDraft(input: CreateToolGuideDraftInput): ToolGuideEntity {
    const now = new Date();
    const record: ToolGuideRecord = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      activeVersionNo: 1,
      publishedVersionNo: null,
      versions: [this.createToolGuideVersion(randomUUID(), 1, this.toToolGuideSnapshot(input), now)],
    };

    record.versions[0].contentId = record.id;
    this.repository.saveToolGuide(record);

    return this.toToolGuideEntity(record, record.versions[0]);
  }

  reviewToolGuide(id: string, input: ReviewContentInput): ToolGuideEntity {
    if (input.reviewState !== 'approved') {
      throw new BadRequestException('Unsupported review state');
    }

    const record = this.getToolGuideRecord(id);
    const activeVersion = this.getToolGuideVersion(record, record.activeVersionNo);
    activeVersion.reviewState = 'approved';
    activeVersion.updatedAt = new Date();
    record.updatedAt = activeVersion.updatedAt;
    this.repository.saveToolGuide(record);

    return this.toToolGuideEntity(record, activeVersion);
  }

  publishToolGuide(id: string): ToolGuideEntity {
    const record = this.getToolGuideRecord(id);
    const activeVersion = this.getToolGuideVersion(record, record.activeVersionNo);

    if (activeVersion.reviewState !== 'approved') {
      throw new BadRequestException('Content must be approved before publish');
    }

    const now = new Date();
    activeVersion.status = 'published';
    activeVersion.publishedAt = now;
    activeVersion.updatedAt = now;
    record.publishedVersionNo = activeVersion.versionNo;
    record.updatedAt = now;
    this.repository.saveToolGuide(record);

    return this.toToolGuideEntity(record, activeVersion);
  }

  listPublishedToolGuides(locale = 'en-US'): ToolGuideSummary[] {
    return this.repository
      .listToolGuides()
      .map((record) => this.getPublishedToolGuideVersion(record))
      .filter((version): version is ContentVersionEntity<ToolGuideSnapshot> => Boolean(version))
      .filter((version) => version.locale === locale)
      .map((version) => ({
        id: version.contentId,
        slug: version.snapshot.slug,
        title: version.snapshot.title,
        summary: version.snapshot.summary,
        locale: version.locale,
      }))
      .sort((left, right) => left.title.localeCompare(right.title, 'zh-CN'));
  }

  getPublishedToolGuide(id: string, locale = 'en-US'): ToolGuideDetail {
    const record = this.getToolGuideRecord(id);
    const version = this.getPublishedToolGuideVersion(record);

    if (!version || version.locale !== locale) {
      throw new BadRequestException('Published tool guide not found');
    }

    return {
      id: record.id,
      slug: version.snapshot.slug,
      locale: version.locale,
      title: version.snapshot.title,
      summary: version.snapshot.summary,
      body: version.snapshot.body,
      tags: [...version.snapshot.tags],
      versionNo: version.versionNo,
      publishedAt: version.publishedAt?.toISOString() ?? null,
    };
  }

  private createDestinationVersion(
    contentId: string,
    versionNo: number,
    snapshot: DestinationSnapshot,
    now: Date,
  ): ContentVersionEntity<DestinationSnapshot> {
    return {
      id: randomUUID(),
      contentId,
      contentType: 'destination',
      locale: snapshot.locale,
      versionNo,
      snapshot: {
        ...snapshot,
        highlights: [...snapshot.highlights],
      },
      status: 'draft',
      reviewState: 'draft',
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  private createToolGuideVersion(
    contentId: string,
    versionNo: number,
    snapshot: ToolGuideSnapshot,
    now: Date,
  ): ContentVersionEntity<ToolGuideSnapshot> {
    return {
      id: randomUUID(),
      contentId,
      contentType: 'tool_guide',
      locale: snapshot.locale,
      versionNo,
      snapshot: {
        ...snapshot,
        tags: [...snapshot.tags],
      },
      status: 'draft',
      reviewState: 'draft',
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  private getDestinationRecord(id: string): DestinationRecord {
    const record = this.repository.findDestinationById(id);

    if (!record) {
      throw new BadRequestException('Destination not found');
    }

    return record;
  }

  private getToolGuideRecord(id: string): ToolGuideRecord {
    const record = this.repository.findToolGuideById(id);

    if (!record) {
      throw new BadRequestException('Tool guide not found');
    }

    return record;
  }

  private getDestinationVersion(
    record: DestinationRecord,
    versionNo: number,
  ): ContentVersionEntity<DestinationSnapshot> {
    const version = record.versions.find((item) => item.versionNo === versionNo);

    if (!version) {
      throw new BadRequestException('Destination version not found');
    }

    return version;
  }

  private getToolGuideVersion(
    record: ToolGuideRecord,
    versionNo: number,
  ): ContentVersionEntity<ToolGuideSnapshot> {
    const version = record.versions.find((item) => item.versionNo === versionNo);

    if (!version) {
      throw new BadRequestException('Tool guide version not found');
    }

    return version;
  }

  private getPublishedDestinationVersion(
    record: DestinationRecord,
  ): ContentVersionEntity<DestinationSnapshot> | undefined {
    if (!record.publishedVersionNo) {
      return undefined;
    }

    return record.versions.find((version) => version.versionNo === record.publishedVersionNo);
  }

  private getPublishedToolGuideVersion(
    record: ToolGuideRecord,
  ): ContentVersionEntity<ToolGuideSnapshot> | undefined {
    if (!record.publishedVersionNo) {
      return undefined;
    }

    return record.versions.find((version) => version.versionNo === record.publishedVersionNo);
  }

  private toDestinationEntity(
    record: DestinationRecord,
    version: ContentVersionEntity<DestinationSnapshot>,
  ): DestinationEntity {
    return {
      id: record.id,
      slug: version.snapshot.slug,
      locale: version.locale,
      name: version.snapshot.name,
      summary: version.snapshot.summary,
      body: version.snapshot.body,
      highlights: [...version.snapshot.highlights],
      status: version.status,
      reviewState: version.reviewState,
      versionNo: version.versionNo,
      publishedAt: version.publishedAt,
    };
  }

  private toToolGuideEntity(
    record: ToolGuideRecord,
    version: ContentVersionEntity<ToolGuideSnapshot>,
  ): ToolGuideEntity {
    return {
      id: record.id,
      slug: version.snapshot.slug,
      locale: version.locale,
      title: version.snapshot.title,
      summary: version.snapshot.summary,
      body: version.snapshot.body,
      tags: [...version.snapshot.tags],
      status: version.status,
      reviewState: version.reviewState,
      versionNo: version.versionNo,
      publishedAt: version.publishedAt,
    };
  }

  private toDestinationSummary(
    contentId: string,
    version: ContentVersionEntity<DestinationSnapshot>,
  ): DestinationSummary {
    return {
      id: contentId,
      slug: version.snapshot.slug,
      name: version.snapshot.name,
      summary: version.snapshot.summary,
      locale: version.locale,
    };
  }

  private toDestinationDetail(
    contentId: string,
    version: ContentVersionEntity<DestinationSnapshot>,
  ): DestinationDetail {
    return {
      id: contentId,
      slug: version.snapshot.slug,
      locale: version.locale,
      name: version.snapshot.name,
      summary: version.snapshot.summary,
      body: version.snapshot.body,
      highlights: [...version.snapshot.highlights],
      versionNo: version.versionNo,
      publishedAt: version.publishedAt?.toISOString() ?? null,
    };
  }

  private toDestinationSnapshot(input: CreateDestinationDraftInput): DestinationSnapshot {
    return {
      slug: input.slug.trim(),
      locale: input.locale.trim(),
      name: input.name.trim(),
      summary: input.summary.trim(),
      body: input.body.trim(),
      highlights: input.highlights.map((item) => item.trim()),
    };
  }

  private toToolGuideSnapshot(input: CreateToolGuideDraftInput): ToolGuideSnapshot {
    return {
      slug: input.slug.trim(),
      locale: input.locale.trim(),
      title: input.title.trim(),
      summary: input.summary.trim(),
      body: input.body.trim(),
      tags: input.tags.map((item) => item.trim()),
    };
  }

  private getNextVersionNo<TSnapshot extends object>(
    versions: ContentVersionEntity<TSnapshot>[],
  ): number {
    return Math.max(...versions.map((version) => version.versionNo)) + 1;
  }
}
