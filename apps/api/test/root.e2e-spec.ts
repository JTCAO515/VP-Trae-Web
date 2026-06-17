import request from 'supertest';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import { AppModule } from '../src/app.module';

describe('Root (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / 返回平台信息与入口链接', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        service: 'visepanda-api',
        status: 'ok',
        links: {
          health: '/health',
          docs: '/docs',
          openapiJson: '/docs-json',
          openapiYaml: '/docs-yaml',
        },
      },
      requestId: expect.any(String),
    });
  });
});

