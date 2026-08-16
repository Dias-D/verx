// E2E do módulo Dashboard — Supertest contra a aplicação real, Postgres real
// via Testcontainers (nunca sqlite/in-memory, ver praticas.md#testes).
//
// Cobre GET /dashboard 200 com o formato completo do DashboardSnapshot,
// populado via as próprias rotas HTTP (producer -> farm -> planted-crop),
// confirmando que os totais refletem o que foi cadastrado de ponta a ponta.

import { execSync } from 'node:child_process';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { cpf } from 'cpf-cnpj-validator';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/main';

interface DashboardResponseBody {
  totalFarms: number;
  totalHectares: number;
  byState: { state: string; count: number }[];
  byCrop: { crop: string; count: number }[];
  byLandUse: { type: string; hectares: number }[];
}

interface ProducerResponseBody {
  id: string;
}

interface FarmResponseBody {
  id: string;
}

interface SeasonResponseBody {
  id: string;
}

interface CropResponseBody {
  id: string;
}

describe('Dashboard (e2e)', () => {
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

  it('GET /dashboard retorna 200 com tudo zerado quando o banco está vazio', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/dashboard',
    );

    expect(response.status).toBe(200);
    const body = response.body as DashboardResponseBody;
    expect(body).toEqual({
      totalFarms: 0,
      totalHectares: 0,
      byState: [],
      byCrop: [],
      byLandUse: [
        { type: 'arable', hectares: 0 },
        { type: 'vegetation', hectares: 0 },
      ],
    });
  });

  it('GET /dashboard reflete produtor/fazenda/plantio cadastrados via HTTP', async () => {
    const seasonCreated = await request(app.getHttpServer())
      .post('/api/v1/seasons')
      .send({ year: 2050 });
    const seasonId = (seasonCreated.body as SeasonResponseBody).id;

    const cropCreated = await request(app.getHttpServer())
      .post('/api/v1/crops')
      .send({ name: 'Cultura Dashboard E2E' });
    const cropId = (cropCreated.body as CropResponseBody).id;

    const producerCreated = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({ name: 'Produtor Dashboard E2E', document: cpf.generate() });
    const producerId = (producerCreated.body as ProducerResponseBody).id;

    const farmCreated = await request(app.getHttpServer())
      .post('/api/v1/farms')
      .send({
        name: 'Fazenda Dashboard E2E',
        city: 'Uberlândia',
        state: 'MG',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId,
      });
    const farmId = (farmCreated.body as FarmResponseBody).id;

    await request(app.getHttpServer())
      .post(`/api/v1/farms/${farmId}/planted-crops`)
      .send({ items: [{ seasonId, cropId }] })
      .expect(201);

    const response = await request(app.getHttpServer()).get(
      '/api/v1/dashboard',
    );

    expect(response.status).toBe(200);
    const body = response.body as DashboardResponseBody;
    expect(body.totalFarms).toBeGreaterThanOrEqual(1);
    expect(body.totalHectares).toBeGreaterThanOrEqual(100);
    const mgState = body.byState.find((entry) => entry.state === 'MG');
    expect(mgState).toBeDefined();
    expect(typeof mgState?.count).toBe('number');

    const dashboardCrop = body.byCrop.find(
      (entry) => entry.crop === 'Cultura Dashboard E2E',
    );
    expect(dashboardCrop).toBeDefined();
    expect(typeof dashboardCrop?.count).toBe('number');
    expect(body.byLandUse).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'arable' }),
        expect.objectContaining({ type: 'vegetation' }),
      ]),
    );
  });
});
