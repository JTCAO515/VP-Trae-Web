import type { ContentReviewState, ContentStatus } from '@visepanda/shared-types';

export interface DestinationEntity {
  id: string;
  slug: string;
  locale: string;
  name: string;
  summary: string;
  body: string;
  highlights: string[];
  status: ContentStatus;
  reviewState: ContentReviewState;
  versionNo: number;
  publishedAt: Date | null;
}
