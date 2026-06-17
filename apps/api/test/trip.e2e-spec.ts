import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';

import { AIOrchestratorService } from '@visepanda/domain-ai';

import { AppModule } from '../src/app.module';

type TripServiceContract = {
  deleteTrip(tripId: string, userId: string): { deleted: true };
};

describe('Trip domain and user asset lifecycle (e2e)', () => {
  let app: INestApplication;
  let aiService: AIOrchestratorService & {
    getInvocationLog(logId: string): unknown;
    countInvocationLogs(): number;
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    aiService = app.get(AIOrchestratorService) as AIOrchestratorService & {
      getInvocationLog(logId: string): unknown;
      countInvocationLogs(): number;
    };
  });

  afterEach(async () => {
    await app.close();
  });

  it('定义 trips/trip_days/trip_items/trip_snapshots/favorites/generation_records 初始化迁移', () => {
    const migrationPath = resolve(__dirname, '../../../infra/migrations/004_trip_init.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TABLE trips');
    expect(sql).toContain('CREATE TABLE trip_days');
    expect(sql).toContain('CREATE TABLE trip_items');
    expect(sql).toContain('CREATE TABLE trip_snapshots');
    expect(sql).toContain('CREATE TABLE favorites');
    expect(sql).toContain('CREATE TABLE generation_records');
  });

  it('POST /trips 可将 AI 结果保存为 Trip，GET /trips 与 GET /trips/:id 只返回当前用户资产，并支持生成 snapshot', async () => {
    const owner = await registerUser(app, 'owner-trip@example.com', 'Owner Trip');

    const aiPlanResponse = await request(app.getHttpServer())
      .post('/ai/tasks/plan-trip')
      .send({
        destination: '东京',
        days: 3,
        interests: ['美食', '亲子'],
        locale: 'zh-CN',
      })
      .expect(200);

    const tripCreateResponse = await request(app.getHttpServer())
      .post('/trips')
      .set('authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: '东京亲子三日游',
        destination: '东京',
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        favorite: true,
        source: {
          type: 'task',
          invocationLogId: aiPlanResponse.body.data.logId,
          taskType: 'trip_planning',
        },
        aiSummary: aiPlanResponse.body.data.answer,
        days: [
          {
            dayNumber: 1,
            title: '浅草与晴空塔',
            items: [
              {
                type: 'sightseeing',
                title: '浅草寺',
                startTime: '09:00',
                endTime: '11:00',
                notes: '适合亲子慢逛',
              },
            ],
          },
          {
            dayNumber: 2,
            title: '上野与秋叶原',
            items: [
              {
                type: 'food',
                title: '阿美横町午餐',
                startTime: '12:00',
                endTime: '13:30',
                notes: '尝试东京本地小吃',
              },
            ],
          },
        ],
      })
      .expect(201);

    expect(tripCreateResponse.body).toEqual({
      success: true,
      data: {
        id: expect.any(String),
        title: '东京亲子三日游',
        destination: '东京',
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        status: 'draft',
        aiSummary: expect.stringContaining('东京'),
        isFavorite: true,
        snapshotCount: 0,
        latestSnapshotId: null,
        days: [
          {
            id: expect.any(String),
            dayNumber: 1,
            title: '浅草与晴空塔',
            items: [
              {
                id: expect.any(String),
                type: 'sightseeing',
                title: '浅草寺',
                startTime: '09:00',
                endTime: '11:00',
                notes: '适合亲子慢逛',
              },
            ],
          },
          {
            id: expect.any(String),
            dayNumber: 2,
            title: '上野与秋叶原',
            items: [
              {
                id: expect.any(String),
                type: 'food',
                title: '阿美横町午餐',
                startTime: '12:00',
                endTime: '13:30',
                notes: '尝试东京本地小吃',
              },
            ],
          },
        ],
        generationRecord: {
          id: expect.any(String),
          sourceType: 'task',
          invocationLogId: aiPlanResponse.body.data.logId,
          taskType: 'trip_planning',
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
      requestId: expect.any(String),
    });

    const tripId = tripCreateResponse.body.data.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/trips')
      .set('authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(listResponse.body).toEqual({
      success: true,
      data: [
        {
          id: tripId,
          title: '东京亲子三日游',
          destination: '东京',
          startDate: '2026-11-01',
          endDate: '2026-11-03',
          status: 'draft',
          dayCount: 2,
          isFavorite: true,
          updatedAt: expect.any(String),
        },
      ],
      requestId: expect.any(String),
    });

    const detailResponse = await request(app.getHttpServer())
      .get(`/trips/${tripId}`)
      .set('authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(detailResponse.body.data).toEqual({
      id: tripId,
      title: '东京亲子三日游',
      destination: '东京',
      startDate: '2026-11-01',
      endDate: '2026-11-03',
      status: 'draft',
      aiSummary: expect.stringContaining('东京'),
      isFavorite: true,
      snapshotCount: 0,
      latestSnapshotId: null,
      days: [
        {
          id: expect.any(String),
          dayNumber: 1,
          title: '浅草与晴空塔',
          items: [
            {
              id: expect.any(String),
              type: 'sightseeing',
              title: '浅草寺',
              startTime: '09:00',
              endTime: '11:00',
              notes: '适合亲子慢逛',
            },
          ],
        },
        {
          id: expect.any(String),
          dayNumber: 2,
          title: '上野与秋叶原',
          items: [
            {
              id: expect.any(String),
              type: 'food',
              title: '阿美横町午餐',
              startTime: '12:00',
              endTime: '13:30',
              notes: '尝试东京本地小吃',
            },
          ],
        },
      ],
      generationRecord: {
        id: expect.any(String),
        sourceType: 'task',
        invocationLogId: aiPlanResponse.body.data.logId,
        taskType: 'trip_planning',
      },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const snapshotResponse = await request(app.getHttpServer())
      .post(`/trips/${tripId}/snapshot`)
      .set('authorization', `Bearer ${owner.accessToken}`)
      .send({ reason: '首次落库快照' })
      .expect(201);

    expect(snapshotResponse.body).toEqual({
      success: true,
      data: {
        id: expect.any(String),
        tripId,
        version: 1,
        reason: '首次落库快照',
        createdAt: expect.any(String),
      },
      requestId: expect.any(String),
    });

    const detailAfterSnapshot = await request(app.getHttpServer())
      .get(`/trips/${tripId}`)
      .set('authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(detailAfterSnapshot.body.data.snapshotCount).toBe(1);
    expect(detailAfterSnapshot.body.data.latestSnapshotId).toBe(snapshotResponse.body.data.id);
  });

  it('用户只能读取自己的 Trip', async () => {
    const owner = await registerUser(app, 'owner-private@example.com', 'Owner Private');
    const stranger = await registerUser(app, 'stranger-private@example.com', 'Stranger Private');

    const createResponse = await request(app.getHttpServer())
      .post('/trips')
      .set('authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: '大阪慢游',
        destination: '大阪',
        startDate: '2026-12-01',
        endDate: '2026-12-02',
        source: {
          type: 'chat',
          invocationLogId: 'log_manual_chat',
          taskType: 'chat_travel_advice',
        },
        aiSummary: '适合亲子与购物的 2 日慢游。',
        days: [
          {
            dayNumber: 1,
            title: '梅田与心斋桥',
            items: [
              {
                type: 'shopping',
                title: '梅田商圈',
                startTime: '10:00',
                endTime: '12:00',
                notes: '上午购物',
              },
            ],
          },
        ],
      })
      .expect(201);

    const tripId = createResponse.body.data.id as string;

    const ownerList = await request(app.getHttpServer())
      .get('/trips')
      .set('authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(ownerList.body.data).toHaveLength(1);

    await request(app.getHttpServer())
      .get('/trips')
      .set('authorization', `Bearer ${stranger.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toEqual([]);
      });

    const strangerDetail = await request(app.getHttpServer())
      .get(`/trips/${tripId}`)
      .set('authorization', `Bearer ${stranger.accessToken}`)
      .expect(404);

    expect(strangerDetail.body.success).toBe(false);
    expect(strangerDetail.body.error).toEqual({
      code: 'NOT_FOUND',
      message: 'Trip not found',
    });
  });

  it('删除 Trip 不影响 invocation log', async () => {
    const owner = await registerUser(app, 'delete-trip@example.com', 'Delete Trip');

    const aiPlanResponse = await request(app.getHttpServer())
      .post('/ai/tasks/plan-trip')
      .send({
        destination: '京都',
        days: 2,
        interests: ['寺庙', '散步'],
        locale: 'zh-CN',
      })
      .expect(200);

    const tripCreateResponse = await request(app.getHttpServer())
      .post('/trips')
      .set('authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: '京都两日游',
        destination: '京都',
        startDate: '2026-10-08',
        endDate: '2026-10-09',
        source: {
          type: 'task',
          invocationLogId: aiPlanResponse.body.data.logId,
          taskType: 'trip_planning',
        },
        aiSummary: aiPlanResponse.body.data.answer,
        days: [
          {
            dayNumber: 1,
            title: '清水寺与祇园',
            items: [
              {
                type: 'walking',
                title: '清水寺参观',
                startTime: '09:00',
                endTime: '11:30',
                notes: '避开高峰',
              },
            ],
          },
        ],
      })
      .expect(201);

    const tripId = tripCreateResponse.body.data.id as string;
    const logId = aiPlanResponse.body.data.logId as string;
    const beforeDeleteCount = aiService.countInvocationLogs();
    const tripService = app.get<TripServiceContract>('TripService');

    expect(aiService.getInvocationLog(logId)).toBeDefined();

    expect(tripService.deleteTrip(tripId, owner.userId)).toEqual({ deleted: true });
    expect(aiService.countInvocationLogs()).toBe(beforeDeleteCount);
    expect(aiService.getInvocationLog(logId)).toBeDefined();

    const deletedTripResponse = await request(app.getHttpServer())
      .get(`/trips/${tripId}`)
      .set('authorization', `Bearer ${owner.accessToken}`)
      .expect(404);

    expect(deletedTripResponse.body.error).toEqual({
      code: 'NOT_FOUND',
      message: 'Trip not found',
    });
  });
});

async function registerUser(app: INestApplication, email: string, displayName: string) {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password: 'Secret123!',
      displayName,
    })
    .expect(201);

  return {
    accessToken: response.body.data.accessToken as string,
    userId: response.body.data.user.id as string,
  };
}
