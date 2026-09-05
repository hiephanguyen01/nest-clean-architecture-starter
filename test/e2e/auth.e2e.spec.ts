import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (!TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is required for e2e tests');
}

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: TEST_DATABASE_URL,
  JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-characters',
  JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-characters',
  REFRESH_TOKEN_HASH_SECRET: 'test-refresh-hash-secret-at-least-32-characters',
  JWT_ACCESS_EXPIRES_IN_SECONDS: '900',
  JWT_REFRESH_EXPIRES_IN_SECONDS: '604800',
  CORS_ORIGINS: 'http://localhost:3000',
  SWAGGER_ENABLED: 'false',
  LOG_LEVEL: 'silent',
});

let app: INestApplication;
let prisma: PrismaService;

beforeAll(async () => {
  const { AppModule } = await import('../../src/app.module.js');
  const { configureApp } = await import('../../src/bootstrap/configure-app.js');
  const { PrismaService: PrismaServiceToken } =
    await import('../../src/infrastructure/database/prisma.service.js');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app as NestExpressApplication);
  await app.init();
  prisma = app.get(PrismaServiceToken);
});

beforeEach(async () => {
  await prisma.refreshSession.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await app.close();
});

async function register(email = 'user@example.com') {
  return request(app.getHttpServer()).post('/auth/register').send({
    email,
    password: 'CorrectHorseBatteryStaple!',
    name: 'Alice',
  });
}

describe('Auth API', () => {
  it('registers, logs in and returns the current user', async () => {
    const registered = await register();
    expect(registered.status).toBe(201);
    expect(registered.body.data.email).toBe('user@example.com');
    expect(registered.body.data.role).toBe('USER');
    const persistedUser = await prisma.user.findUnique({
      where: { id: registered.body.data.id as string },
    });
    expect(persistedUser?.passwordHash).not.toBe('CorrectHorseBatteryStaple!');

    const loggedIn = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'USER@example.com',
      password: 'CorrectHorseBatteryStaple!',
    });
    expect(loggedIn.status).toBe(200);
    const persistedSession = await prisma.refreshSession.findFirst({
      where: { userId: registered.body.data.id as string },
    });
    expect(persistedSession?.tokenHash).not.toBe(loggedIn.body.data.tokens.refreshToken);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loggedIn.body.data.tokens.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe('user@example.com');
  });

  it('rotates refresh tokens and rejects reuse after rotation/logout', async () => {
    await register();
    const loggedIn = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'user@example.com',
      password: 'CorrectHorseBatteryStaple!',
    });
    const oldRefresh = loggedIn.body.data.tokens.refreshToken as string;

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(refreshed.status).toBe(200);
    const rotatedRefresh = refreshed.body.data.refreshToken as string;
    expect(rotatedRefresh).not.toBe(oldRefresh);

    const reused = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(reused.status).toBe(401);
    expect(reused.body.code).toBe('INVALID_REFRESH_TOKEN');

    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: rotatedRefresh });
    expect(logout.status).toBe(200);

    const afterLogout = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: rotatedRefresh });
    expect(afterLogout.status).toBe(401);
  });

  it('enforces authentication and ADMIN RBAC on the users endpoint', async () => {
    const registered = await register();
    const userId = registered.body.data.id as string;
    const userLogin = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'user@example.com',
      password: 'CorrectHorseBatteryStaple!',
    });
    const userAccess = userLogin.body.data.tokens.accessToken as string;

    expect((await request(app.getHttpServer()).get(`/users/${userId}`)).status).toBe(401);
    expect(
      (
        await request(app.getHttpServer())
          .get(`/users/${userId}`)
          .set('Authorization', `Bearer ${userAccess}`)
      ).status,
    ).toBe(403);

    await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
    const adminLogin = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'user@example.com',
      password: 'CorrectHorseBatteryStaple!',
    });
    const adminAccess = adminLogin.body.data.tokens.accessToken as string;

    const allowed = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${adminAccess}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.id).toBe(userId);
  });

  it('rejects public attempts to self-register as ADMIN or inject unknown fields', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'attacker@example.com',
      password: 'CorrectHorseBatteryStaple!',
      name: 'Mallory',
      role: 'ADMIN',
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
