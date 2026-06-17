import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type {
  ContentRepository,
  DestinationRecord,
  DestinationSnapshot,
  ToolGuideRecord,
  ToolGuideSnapshot,
} from './content.repository';
import type { ContentVersionEntity } from './content-version.entity';

@Injectable()
export class InMemoryContentRepository implements ContentRepository {
  private readonly destinations = new Map<string, DestinationRecord>();
  private readonly toolGuides = new Map<string, ToolGuideRecord>();

  constructor() {
    if (process.env.VP_ENABLE_CONTENT_SEED === '1' || process.env.NODE_ENV !== 'test') {
      this.seedPublishedContent();
    }
  }

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

  private seedPublishedContent() {
    if (this.destinations.size || this.toolGuides.size) {
      return;
    }

    const now = new Date('2026-06-17T09:00:00.000Z');

    this.saveDestination(
      this.createPublishedDestination({
        slug: 'beijing-citywalk',
        locale: 'zh-CN',
        name: '北京',
        summary: '适合第一次来中国旅行的经典城市，历史景点与城市漫游都很集中。',
        body:
          '建议把故宫、景山、什刹海和国子监拆成 2 到 3 天慢慢走。第一次来北京时，可以把中轴线文化景点和胡同 Citywalk 分开安排，体验会更好。',
        highlights: ['故宫与景山', '鼓楼与什刹海', '国子监街区'],
        now,
      }),
    );

    this.saveDestination(
      this.createPublishedDestination({
        slug: 'shanghai-weekend',
        locale: 'zh-CN',
        name: '上海',
        summary: '适合周末短途和城市感受型旅行，外滩、法租界和博物馆线路很好串联。',
        body:
          '如果只有两天，可以把外滩与南京东路放在第一天，把武康路、安福路和美术馆线路放在第二天。下雨时可切换到商场、展览和咖啡馆路线。',
        highlights: ['外滩夜景', '法租界散步', '展览与咖啡馆'],
        now,
      }),
    );

    this.saveToolGuide(
      this.createPublishedToolGuide({
        slug: 'china-visa-checklist',
        locale: 'zh-CN',
        title: '中国旅行行前清单',
        summary: '把签证、证件、支付、网络和常用 App 一次准备好，避免临出发前手忙脚乱。',
        body:
          '建议出发前确认护照有效期、签证材料、酒店订单、机票行程单和紧急联系人。到达中国后常见的第一批事项包括开通数据漫游、准备移动支付和安装地图与翻译工具。',
        tags: ['签证', '证件', '支付', '网络'],
        now,
      }),
    );

    this.saveToolGuide(
      this.createPublishedToolGuide({
        slug: 'china-high-speed-rail',
        locale: 'zh-CN',
        title: '高铁出行基础指南',
        summary: '适合第一次在中国坐高铁的人，重点了解实名制、进站节奏和换乘预留时间。',
        body:
          '高铁普遍需要实名制进站，建议至少提前 40 分钟到站。大站中转时要预留更多时间，尤其是跨站层和节假日高峰。随身行李建议控制在自己能快速搬运的范围内。',
        tags: ['高铁', '交通', '换乘'],
        now,
      }),
    );
  }

  private createPublishedDestination(input: DestinationSnapshot & { now: Date }): DestinationRecord {
    const contentId = randomUUID();
    const version = this.createPublishedVersion<DestinationSnapshot>({
      contentId,
      contentType: 'destination',
      locale: input.locale,
      snapshot: {
        slug: input.slug,
        locale: input.locale,
        name: input.name,
        summary: input.summary,
        body: input.body,
        highlights: [...input.highlights],
      },
      now: input.now,
    });

    return {
      id: contentId,
      createdAt: input.now,
      updatedAt: input.now,
      activeVersionNo: 1,
      publishedVersionNo: 1,
      versions: [version],
    };
  }

  private createPublishedToolGuide(input: ToolGuideSnapshot & { now: Date }): ToolGuideRecord {
    const contentId = randomUUID();
    const version = this.createPublishedVersion<ToolGuideSnapshot>({
      contentId,
      contentType: 'tool_guide',
      locale: input.locale,
      snapshot: {
        slug: input.slug,
        locale: input.locale,
        title: input.title,
        summary: input.summary,
        body: input.body,
        tags: [...input.tags],
      },
      now: input.now,
    });

    return {
      id: contentId,
      createdAt: input.now,
      updatedAt: input.now,
      activeVersionNo: 1,
      publishedVersionNo: 1,
      versions: [version],
    };
  }

  private createPublishedVersion<TSnapshot extends object>(input: {
    contentId: string;
    contentType: 'destination' | 'tool_guide';
    locale: string;
    snapshot: TSnapshot;
    now: Date;
  }): ContentVersionEntity<TSnapshot> {
    return {
      id: randomUUID(),
      contentId: input.contentId,
      contentType: input.contentType,
      locale: input.locale,
      versionNo: 1,
      snapshot: input.snapshot,
      status: 'published',
      reviewState: 'approved',
      publishedAt: input.now,
      createdAt: input.now,
      updatedAt: input.now,
    };
  }
}
