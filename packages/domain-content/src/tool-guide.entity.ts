import type { ContentReviewState, ContentStatus } from '@visepanda/shared-types';

export interface ToolGuideEntity {
  id: string;
  slug: string;
  locale: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  status: ContentStatus;
  reviewState: ContentReviewState;
  versionNo: number;
  publishedAt: Date | null;
}
