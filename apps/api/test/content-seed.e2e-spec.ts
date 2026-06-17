import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Content seed bootstrap (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.VP_ENABLE_CONTENT_SEED = '1';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    delete process.env.VP_ENABLE_CONTENT_SEED;
    await app.close();
  });

  it('在开启内容种子时，游客端默认能看到目的地和工具列表', async () => {
    const destinationsResponse = await request(app.getHttpServer())
      .get('/destinations')
      .query({ locale: 'zh-CN' })
      .expect(200);

    expect(destinationsResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'beijing-citywalk',
          name: '北京',
        }),
      ]),
    );

    const toolsResponse = await request(app.getHttpServer())
      .get('/tools')
      .query({ locale: 'zh-CN' })
      .expect(200);

    expect(toolsResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'china-visa-checklist',
          title: '中国旅行行前清单',
        }),
      ]),
    );
  });
});
