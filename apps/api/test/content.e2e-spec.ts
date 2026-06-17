import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Content publishing workflow (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('定义 destinations/pois/guide_blocks/tool_guides/topics/assets/content_versions 初始化迁移', () => {
    const migrationPath = resolve(__dirname, '../../../infra/migrations/002_content_init.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TABLE destinations');
    expect(sql).toContain('CREATE TABLE pois');
    expect(sql).toContain('CREATE TABLE guide_blocks');
    expect(sql).toContain('CREATE TABLE tool_guides');
    expect(sql).toContain('CREATE TABLE topics');
    expect(sql).toContain('CREATE TABLE assets');
    expect(sql).toContain('CREATE TABLE content_versions');
  });

  it('支持目的地草稿、审核、发布、二次发布与回滚，并暴露游客端查询接口', async () => {
    const draftResponse = await request(app.getHttpServer())
      .post('/content/destinations/drafts')
      .send({
        slug: 'tokyo',
        locale: 'zh-CN',
        name: '东京',
        summary: '首版摘要',
        body: '首版正文',
        highlights: ['涩谷', '浅草'],
      })
      .expect(201);

    expect(draftResponse.body).toEqual({
      success: true,
      data: {
        id: expect.any(String),
        slug: 'tokyo',
        locale: 'zh-CN',
        name: '东京',
        summary: '首版摘要',
        body: '首版正文',
        highlights: ['涩谷', '浅草'],
        status: 'draft',
        reviewState: 'draft',
        versionNo: 1,
        publishedAt: null,
      },
      requestId: expect.any(String),
    });

    const destinationId = draftResponse.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/content/destinations/${destinationId}/review`)
      .send({ reviewState: 'approved' })
      .expect(200);

    const firstPublishResponse = await request(app.getHttpServer())
      .post(`/content/destinations/${destinationId}/publish`)
      .expect(200);

    expect(firstPublishResponse.body.data).toEqual({
      id: destinationId,
      slug: 'tokyo',
      locale: 'zh-CN',
      name: '东京',
      summary: '首版摘要',
      body: '首版正文',
      highlights: ['涩谷', '浅草'],
      status: 'published',
      reviewState: 'approved',
      versionNo: 1,
      publishedAt: expect.any(String),
    });

    const publicListResponse = await request(app.getHttpServer())
      .get('/destinations')
      .query({ locale: 'zh-CN' })
      .expect(200);

    expect(publicListResponse.body.data).toEqual([
      {
        id: destinationId,
        slug: 'tokyo',
        name: '东京',
        summary: '首版摘要',
        locale: 'zh-CN',
      },
    ]);

    const publicDetailAfterFirstPublish = await request(app.getHttpServer())
      .get(`/destinations/${destinationId}`)
      .query({ locale: 'zh-CN' })
      .expect(200);

    expect(publicDetailAfterFirstPublish.body.data).toEqual({
      id: destinationId,
      slug: 'tokyo',
      locale: 'zh-CN',
      name: '东京',
      summary: '首版摘要',
      body: '首版正文',
      highlights: ['涩谷', '浅草'],
      versionNo: 1,
      publishedAt: expect.any(String),
    });

    const secondDraftResponse = await request(app.getHttpServer())
      .patch(`/content/destinations/${destinationId}/draft`)
      .send({
        summary: '第二版摘要',
        body: '第二版正文',
        highlights: ['涩谷Sky', '东京塔'],
      })
      .expect(200);

    expect(secondDraftResponse.body.data).toEqual({
      id: destinationId,
      slug: 'tokyo',
      locale: 'zh-CN',
      name: '东京',
      summary: '第二版摘要',
      body: '第二版正文',
      highlights: ['涩谷Sky', '东京塔'],
      status: 'draft',
      reviewState: 'draft',
      versionNo: 2,
      publishedAt: null,
    });

    await request(app.getHttpServer())
      .post(`/content/destinations/${destinationId}/review`)
      .send({ reviewState: 'approved' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/content/destinations/${destinationId}/publish`)
      .expect(200);

    const rollbackResponse = await request(app.getHttpServer())
      .post(`/content/destinations/${destinationId}/rollback`)
      .send({ versionNo: 1 })
      .expect(200);

    expect(rollbackResponse.body.data).toEqual({
      id: destinationId,
      slug: 'tokyo',
      locale: 'zh-CN',
      name: '东京',
      summary: '首版摘要',
      body: '首版正文',
      highlights: ['涩谷', '浅草'],
      status: 'published',
      reviewState: 'approved',
      versionNo: 3,
      publishedAt: expect.any(String),
    });

    const publicDetailAfterRollback = await request(app.getHttpServer())
      .get(`/destinations/${destinationId}`)
      .query({ locale: 'zh-CN' })
      .expect(200);

    expect(publicDetailAfterRollback.body.data).toEqual({
      id: destinationId,
      slug: 'tokyo',
      locale: 'zh-CN',
      name: '东京',
      summary: '首版摘要',
      body: '首版正文',
      highlights: ['涩谷', '浅草'],
      versionNo: 3,
      publishedAt: expect.any(String),
    });
  });

  it('支持工具内容草稿、审核、发布，并暴露 GET /tools 与 GET /tools/:id', async () => {
    const draftResponse = await request(app.getHttpServer())
      .post('/content/tools/drafts')
      .send({
        slug: 'visa-checklist',
        locale: 'zh-CN',
        title: '签证清单',
        summary: '办理签证前的材料准备清单',
        body: '护照、照片、行程单',
        tags: ['签证', '材料'],
      })
      .expect(201);

    const toolId = draftResponse.body.data.id as string;

    expect(draftResponse.body.data).toEqual({
      id: expect.any(String),
      slug: 'visa-checklist',
      locale: 'zh-CN',
      title: '签证清单',
      summary: '办理签证前的材料准备清单',
      body: '护照、照片、行程单',
      tags: ['签证', '材料'],
      status: 'draft',
      reviewState: 'draft',
      versionNo: 1,
      publishedAt: null,
    });

    await request(app.getHttpServer())
      .post(`/content/tools/${toolId}/review`)
      .send({ reviewState: 'approved' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/content/tools/${toolId}/publish`)
      .expect(200);

    const listResponse = await request(app.getHttpServer())
      .get('/tools')
      .query({ locale: 'zh-CN' })
      .expect(200);

    expect(listResponse.body.data).toEqual([
      {
        id: toolId,
        slug: 'visa-checklist',
        title: '签证清单',
        summary: '办理签证前的材料准备清单',
        locale: 'zh-CN',
      },
    ]);

    const detailResponse = await request(app.getHttpServer())
      .get(`/tools/${toolId}`)
      .query({ locale: 'zh-CN' })
      .expect(200);

    expect(detailResponse.body.data).toEqual({
      id: toolId,
      slug: 'visa-checklist',
      locale: 'zh-CN',
      title: '签证清单',
      summary: '办理签证前的材料准备清单',
      body: '护照、照片、行程单',
      tags: ['签证', '材料'],
      versionNo: 1,
      publishedAt: expect.any(String),
    });
  });
});
