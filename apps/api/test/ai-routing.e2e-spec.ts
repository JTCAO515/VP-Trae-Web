import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('AI orchestration and multi-model routing (e2e)', () => {
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

  it('定义 model_providers/model_profiles/task_types/route_policies/prompt_templates/invocation_logs 初始化迁移', () => {
    const migrationPath = resolve(__dirname, '../../../infra/migrations/003_ai_init.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TABLE model_providers');
    expect(sql).toContain('CREATE TABLE model_profiles');
    expect(sql).toContain('CREATE TABLE task_types');
    expect(sql).toContain('CREATE TABLE route_policies');
    expect(sql).toContain('CREATE TABLE prompt_templates');
    expect(sql).toContain('CREATE TABLE invocation_logs');
  });

  it('POST /ai/chat 为通用旅行问答命中 chat 模型并返回模板版本与日志标识', async () => {
    const response = await request(app.getHttpServer())
      .post('/ai/chat')
      .send({
        message: '东京 11 月适合穿什么衣服？',
        locale: 'zh-CN',
      })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        answer: expect.stringContaining('东京 11 月适合穿什么衣服'),
        taskType: 'chat_travel_advice',
        model: 'openai:gpt-4.1-mini',
        provider: 'mock-openai',
        routePolicy: 'chat_travel_advice.default',
        promptTemplateVersion: 'travel-chat@v1',
        logId: expect.any(String),
        fallbackUsed: false,
        attemptCount: 1,
      },
      requestId: expect.any(String),
    });
  });

  it('POST /ai/tasks/plan-trip 为行程规划命中 trip planning 模型', async () => {
    const response = await request(app.getHttpServer())
      .post('/ai/tasks/plan-trip')
      .send({
        destination: '东京',
        days: 3,
        interests: ['美食', '亲子'],
        locale: 'zh-CN',
      })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        answer: expect.stringContaining('东京'),
        taskType: 'trip_planning',
        model: 'google:gemini-2.5-pro',
        provider: 'mock-google',
        routePolicy: 'trip_planning.default',
        promptTemplateVersion: 'trip-plan@v1',
        logId: expect.any(String),
        fallbackUsed: false,
        attemptCount: 1,
      },
      requestId: expect.any(String),
    });
  });

  it('主模型失败时走降级链并记录尝试次数', async () => {
    const response = await request(app.getHttpServer())
      .post('/ai/tasks/plan-trip')
      .send({
        destination: '故障演练城市',
        days: 2,
        interests: ['测试'],
        locale: 'zh-CN',
      })
      .expect(200);

    expect(response.body.data).toEqual({
      answer: expect.stringContaining('故障演练城市'),
      taskType: 'trip_planning',
      model: 'anthropic:claude-3-5-haiku',
      provider: 'mock-anthropic',
      routePolicy: 'trip_planning.default',
      promptTemplateVersion: 'trip-plan@v1',
      logId: expect.any(String),
      fallbackUsed: true,
      attemptCount: 2,
    });
  });

  it('提示词版本切换后返回已生效的版本号', async () => {
    const response = await request(app.getHttpServer())
      .post('/ai/chat')
      .send({
        message: '比较东京和大阪的亲子旅行节奏',
        locale: 'zh-CN',
        promptTemplateVersion: 'travel-chat@v2',
      })
      .expect(200);

    expect(response.body.data).toEqual({
      answer: expect.stringContaining('travel-chat@v2'),
      taskType: 'chat_travel_advice',
      model: 'openai:gpt-4.1-mini',
      provider: 'mock-openai',
      routePolicy: 'chat_travel_advice.default',
      promptTemplateVersion: 'travel-chat@v2',
      logId: expect.any(String),
      fallbackUsed: false,
      attemptCount: 1,
    });
  });

  it('GET /ai/models 与 GET /ai/routes 返回模型配置与任务路由', async () => {
    const modelsResponse = await request(app.getHttpServer()).get('/ai/models').expect(200);

    expect(modelsResponse.body).toEqual({
      success: true,
      data: [
        {
          id: 'model-chat-primary',
          provider: 'mock-openai',
          model: 'openai:gpt-4.1-mini',
          capabilities: ['chat', 'reasoning'],
          priority: 100,
          status: 'active',
        },
        {
          id: 'model-trip-primary',
          provider: 'mock-google',
          model: 'google:gemini-2.5-pro',
          capabilities: ['planning', 'reasoning'],
          priority: 90,
          status: 'active',
        },
        {
          id: 'model-trip-fallback',
          provider: 'mock-anthropic',
          model: 'anthropic:claude-3-5-haiku',
          capabilities: ['planning', 'fallback'],
          priority: 80,
          status: 'active',
        },
      ],
      requestId: expect.any(String),
    });

    const routesResponse = await request(app.getHttpServer()).get('/ai/routes').expect(200);

    expect(routesResponse.body).toEqual({
      success: true,
      data: [
        {
          taskType: 'chat_travel_advice',
          routePolicy: 'chat_travel_advice.default',
          primaryModelId: 'model-chat-primary',
          fallbackModelIds: [],
          promptTemplateVersion: 'travel-chat@v1',
        },
        {
          taskType: 'trip_planning',
          routePolicy: 'trip_planning.default',
          primaryModelId: 'model-trip-primary',
          fallbackModelIds: ['model-trip-fallback'],
          promptTemplateVersion: 'trip-plan@v1',
        },
      ],
      requestId: expect.any(String),
    });
  });
});
