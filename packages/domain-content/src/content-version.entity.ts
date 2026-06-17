import type { ContentReviewState, ContentStatus } from '@visepanda/shared-types';

export type ContentType = 'destination' | 'tool_guide';

export interface ContentVersionEntity<TSnapshot extends object = Record<string, unknown>> {
  id: string;
  contentId: string;
  contentType: ContentType;
  locale: string;
  versionNo: number;
  snapshot: TSnapshot;
  status: ContentStatus;
  reviewState: ContentReviewState;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
