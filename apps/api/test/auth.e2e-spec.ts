import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';

import { AuthService } from '@visepanda/domain-auth';

import { AppModule } from '../src/app.module';

describe('Auth account lifecycle (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    authService = app.get(AuthService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('定义 users/roles/user_roles/sessions/profiles 初始化迁移', () => {
    const migrationPath = resolve(__dirname, '../../../infra/migrations/001_auth_init.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TABLE users');
    expect(sql).toContain('CREATE TABLE roles');
    expect(sql).toContain('CREATE TABLE user_roles');
    expect(sql).toContain('CREATE TABLE sessions');
    expect(sql).toContain('CREATE TABLE profiles');
  });

  it('POST /auth/register 注册成功并返回首个会话', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'traveler@example.com',
        password: 'Secret123!',
        displayName: 'Traveler One',
      })
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      data: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 60 * 60,
        sessionId: expect.any(String),
        user: {
          id: expect.any(String),
          email: 'traveler@example.com',
          role: 'traveler',
          status: 'active',
        },
      },
      requestId: expect.any(String),
    });
  });

  it('POST /auth/register 重复邮箱注册失败', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'duplicate@example.com',
      password: 'Secret123!',
      displayName: 'Duplicate User',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'duplicate@example.com',
        password: 'Secret123!',
        displayName: 'Duplicate User',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toEqual({
      code: 'BAD_REQUEST',
      message: 'Email already registered',
    });
  });

  it('POST /auth/login 登录成功并返回新会话', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'login@example.com',
      password: 'Secret123!',
      displayName: 'Login User',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login@example.com',
        password: 'Secret123!',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      expiresIn: 60 * 60,
      sessionId: expect.any(String),
      user: {
        id: expect.any(String),
        email: 'login@example.com',
        role: 'traveler',
        status: 'active',
      },
    });
  });

  it('POST /auth/login 禁用用户不能登录', async () => {
    const registered = await authService.register({
      email: 'disabled@example.com',
      password: 'Secret123!',
      displayName: 'Disabled User',
    });

    await authService.updateUserStatus(registered.user.id, 'disabled');

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'disabled@example.com',
        password: 'Secret123!',
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toEqual({
      code: 'UNAUTHORIZED',
      message: 'User is disabled',
    });
  });

  it('POST /auth/logout 后会话校验失败', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'session@example.com',
        password: 'Secret123!',
        displayName: 'Session User',
      })
      .expect(201);

    const accessToken = registerResponse.body.data.accessToken as string;

    const verifyResponse = await request(app.getHttpServer())
      .get('/auth/session')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(verifyResponse.body.data).toEqual({
      isValid: true,
      sessionId: expect.any(String),
      user: {
        id: expect.any(String),
        email: 'session@example.com',
        role: 'traveler',
        status: 'active',
      },
    });

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200);

    const expiredResponse = await request(app.getHttpServer())
      .get('/auth/session')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(401);

    expect(expiredResponse.body.success).toBe(false);
    expect(expiredResponse.body.error).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Session is invalid',
    });
  });

  it('邮箱验证占位接口支持 token 生成、校验与状态迁移', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'verify@example.com',
      password: 'Secret123!',
      displayName: 'Verify User',
    });

    const requestTokenResponse = await request(app.getHttpServer())
      .post('/auth/email-verification/request')
      .send({
        email: 'verify@example.com',
      })
      .expect(201);

    expect(requestTokenResponse.body.data).toEqual({
      purpose: 'email_verification',
      token: expect.any(String),
      tokenStatus: 'pending',
    });

    const confirmResponse = await request(app.getHttpServer())
      .post('/auth/email-verification/confirm')
      .send({
        token: requestTokenResponse.body.data.token,
      })
      .expect(200);

    expect(confirmResponse.body.data).toEqual({
      verified: true,
      tokenStatus: 'used',
    });
  });

  it('重置密码占位接口支持 token 生成、校验并更新密码', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'reset@example.com',
      password: 'OldSecret123!',
      displayName: 'Reset User',
    });

    const tokenResponse = await request(app.getHttpServer())
      .post('/auth/password-reset/request')
      .send({
        email: 'reset@example.com',
      })
      .expect(201);

    expect(tokenResponse.body.data).toEqual({
      purpose: 'password_reset',
      token: expect.any(String),
      tokenStatus: 'pending',
    });

    const confirmResponse = await request(app.getHttpServer())
      .post('/auth/password-reset/confirm')
      .send({
        token: tokenResponse.body.data.token,
        newPassword: 'NewSecret123!',
      })
      .expect(200);

    expect(confirmResponse.body.data).toEqual({
      passwordReset: true,
      tokenStatus: 'used',
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'reset@example.com',
        password: 'OldSecret123!',
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'reset@example.com',
        password: 'NewSecret123!',
      })
      .expect(200);
  });
});
