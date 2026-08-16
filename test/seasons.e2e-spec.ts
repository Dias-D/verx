// E2E do módulo Season — Supertest contra a aplicação real, Postgres real
// via Testcontainers (nunca sqlite/in-memory, ver praticas.md#testes).
//
// Cobre POST 201/409, GET paginado, PATCH, DELETE livre (204) e DELETE
// restrito por vínculo em PlantedCrop (409) — o efeito de API do
// `onDelete: Restrict` do schema (ver 04-safra-cultura.md, "Decisão a
// registrar").

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

interface SeasonResponseBody {
  id: string;
  year: number;
}

interface PaginatedSeasonResponseBody {
  data: SeasonResponseBody[];
  meta: { total: number; page: number; limit: number };
}

interface ProducerResponseBody {
  id: string;
}

interface FarmResponseBody {
  id: string;
}

describe('Seasons (e2e)', () => {
  let app: INestApplication<App>;
  let container: StartedPostgreSqlContainer;
  let yearCounter = 1900;

  function nextYear(): number {
    yearCounter += 1;
    return yearCounter;
  }

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

  it('POST /seasons com payload inválido retorna 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/seasons')
      .send({ year: 'não é um número' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('POST /seasons cria uma season válida (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/seasons')
      .send({ year: nextYear() });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('year');
  });

  it('POST /seasons com year já cadastrado retorna 409', async () => {
    const year = nextYear();
    await request(app.getHttpServer())
      .post('/api/v1/seasons')
      .send({ year })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/seasons')
      .send({ year });

    expect(response.status).toBe(409);
  });

  it('GET /seasons retorna lista paginada no envelope { data, meta }', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/seasons?page=1&limit=5',
    );

    expect(response.status).toBe(200);
    const body = response.body as PaginatedSeasonResponseBody;
    expect(body).toHaveProperty('data');
    expect(body.meta).toMatchObject({ page: 1, limit: 5 });
  });

  it('GET /seasons/:id retorna 404 quando a season não existe', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/seasons/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(404);
  });

  it('PATCH /seasons/:id atualiza uma season existente (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/seasons')
      .send({ year: nextYear() });
    const createdBody = created.body as SeasonResponseBody;
    const newYear = nextYear();

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/seasons/${createdBody.id}`)
      .send({ year: newYear });

    expect(response.status).toBe(200);
    const body = response.body as SeasonResponseBody;
    expect(body.year).toBe(newYear);
  });

  it('DELETE /seasons/:id remove uma season sem vínculo (204)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/seasons')
      .send({ year: nextYear() });
    const createdBody = created.body as SeasonResponseBody;

    const deleteResponse = await request(app.getHttpServer()).delete(
      `/api/v1/seasons/${createdBody.id}`,
    );
    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app.getHttpServer()).get(
      `/api/v1/seasons/${createdBody.id}`,
    );
    expect(getResponse.status).toBe(404);
  });

  it('DELETE /seasons/:id de uma season referenciada por um planted-crop retorna 409', async () => {
    const seasonCreated = await request(app.getHttpServer())
      .post('/api/v1/seasons')
      .send({ year: nextYear() });
    const seasonId = (seasonCreated.body as SeasonResponseBody).id;

    const cropCreated = await request(app.getHttpServer())
      .post('/api/v1/crops')
      .send({ name: `Cultura Season E2E ${seasonId}` });
    const cropId = (cropCreated.body as { id: string }).id;

    const producerCreated = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({ name: 'Produtor Season E2E', document: cpf.generate() });
    const producerId = (producerCreated.body as ProducerResponseBody).id;

    const farmCreated = await request(app.getHttpServer())
      .post('/api/v1/farms')
      .send({
        name: 'Fazenda Season E2E',
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

    const response = await request(app.getHttpServer()).delete(
      `/api/v1/seasons/${seasonId}`,
    );

    expect(response.status).toBe(409);

    const getResponse = await request(app.getHttpServer()).get(
      `/api/v1/seasons/${seasonId}`,
    );
    expect(getResponse.status).toBe(200);
  });
});
