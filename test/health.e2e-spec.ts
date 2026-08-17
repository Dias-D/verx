// E2E do HealthModule — Postgres real via Testcontainers (nunca stub aqui:
// o próprio propósito deste teste é provar que o indicador realmente fala
// com o banco), ver etapas/06-observabilidade.md passo 4.3.
//
// Derrubar o Postgres no meio do teste para provar o cenário "down" foi
// avaliado e descartado por instabilidade/lentidão de teste (o "Se travar"
// da etapa já prevê isso como limitação conhecida) — o comportamento "down"
// já está coberto de verdade no unitário de src/health/prisma.health-indicator.spec.ts
// (mock rejeitando a query), então não é uma lacuna de cobertura real.

import { execSync } from 'node:child_process';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
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
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    const databaseUrl = container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;

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
    await container.stop();
  });

  it('GET /health retorna 200 com o Postgres reportado "up"', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect(response.status).toBe(200);
    const body = response.body as HealthResponseBody;
    expect(body.status).toBe('ok');
    expect(body.details?.database).toEqual({ status: 'up' });
  });

  it('GET /health está listado no Swagger (/docs-json)', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json');

    expect(response.status).toBe(200);
    const document = response.body as { paths: Record<string, unknown> };
    expect(document.paths).toHaveProperty('/api/v1/health');
  });
});
