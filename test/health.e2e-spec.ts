// E2E do HealthModule — Postgres e Redis reais via Testcontainers (nunca
// stub aqui: o próprio propósito deste teste é provar que os indicadores
// realmente falam com o banco/cache), ver etapas/06-observabilidade.md passo
// 4.3 e 05.1-cache-dashboard.md passo 5.1.
//
// Derrubar o Postgres/Redis no meio do teste para provar o cenário "down"
// foi avaliado e descartado por instabilidade/lentidão de teste (o "Se
// travar" da etapa já prevê isso como limitação conhecida) — o
// comportamento "down" já está coberto de verdade nos unitários de
// src/health/prisma.health-indicator.spec.ts e
// src/health/redis.health-indicator.spec.ts (mock rejeitando a
// query/round-trip), então não é uma lacuna de cobertura real.

import { execSync } from 'node:child_process';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/main';

interface HealthResponseBody {
  status: string;
  info?: Record<string, { status: string }>;
  details?: Record<string, { status: string }>;
}

describe('Health (e2e)', () => {
  let app: INestApplication<App>;
  let postgresContainer: StartedPostgreSqlContainer;
  let redisContainer: StartedRedisContainer;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer(
      'postgres:16-alpine',
    ).start();
    redisContainer = await new RedisContainer('redis:7-alpine').start();
    const databaseUrl = postgresContainer.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;
    process.env.REDIS_URL = redisContainer.getConnectionUrl();

    execSync('yarn prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await postgresContainer.stop();
    await redisContainer.stop();
  });

  it('GET /health retorna 200 com Postgres e Redis reportados "up"', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect(response.status).toBe(200);
    const body = response.body as HealthResponseBody;
    expect(body.status).toBe('ok');
    expect(body.details?.database).toEqual({ status: 'up' });
    expect(body.details?.redis).toEqual({ status: 'up' });
  });

  it('GET /health está listado no Swagger (/docs-json)', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json');

    expect(response.status).toBe(200);
    const document = response.body as { paths: Record<string, unknown> };
    expect(document.paths).toHaveProperty('/api/v1/health');
  });
});
