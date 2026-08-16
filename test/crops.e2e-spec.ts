// E2E do módulo Crop — Supertest contra a aplicação real, Postgres real via
// Testcontainers (nunca sqlite/in-memory, ver praticas.md#testes).
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

interface CropResponseBody {
  id: string;
  name: string;
}

interface PaginatedCropResponseBody {
  data: CropResponseBody[];
  meta: { total: number; page: number; limit: number };
}

interface ProducerResponseBody {
  id: string;
}

interface FarmResponseBody {
  id: string;
}

describe('Crops (e2e)', () => {
  let app: INestApplication<App>;
  let container: StartedPostgreSqlContainer;
  let nameCounter = 0;

  function nextName(): string {
    nameCounter += 1;
    return `Cultura E2E ${nameCounter}`;
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

  it('POST /crops com payload inválido retorna 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/crops')
      .send({ name: '' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('POST /crops cria um crop válido (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/crops')
      .send({ name: nextName() });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
  });

  it('POST /crops com name já cadastrado retorna 409', async () => {
    const name = nextName();
    await request(app.getHttpServer())
      .post('/api/v1/crops')
      .send({ name })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/crops')
      .send({ name });

    expect(response.status).toBe(409);
  });

  it('GET /crops retorna lista paginada no envelope { data, meta }', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/crops?page=1&limit=5',
    );

    expect(response.status).toBe(200);
    const body = response.body as PaginatedCropResponseBody;
    expect(body).toHaveProperty('data');
    expect(body.meta).toMatchObject({ page: 1, limit: 5 });
  });

  it('GET /crops/:id retorna 404 quando o crop não existe', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/crops/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(404);
  });

  it('PATCH /crops/:id atualiza um crop existente (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/crops')
      .send({ name: nextName() });
    const createdBody = created.body as CropResponseBody;
    const newName = nextName();

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/crops/${createdBody.id}`)
      .send({ name: newName });

    expect(response.status).toBe(200);
    const body = response.body as CropResponseBody;
    expect(body.name).toBe(newName);
  });

  it('DELETE /crops/:id remove um crop sem vínculo (204)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/crops')
      .send({ name: nextName() });
    const createdBody = created.body as CropResponseBody;

    const deleteResponse = await request(app.getHttpServer()).delete(
      `/api/v1/crops/${createdBody.id}`,
    );
    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app.getHttpServer()).get(
      `/api/v1/crops/${createdBody.id}`,
    );
    expect(getResponse.status).toBe(404);
  });

  it('DELETE /crops/:id de um crop referenciado por um planted-crop retorna 409', async () => {
    const cropCreated = await request(app.getHttpServer())
      .post('/api/v1/crops')
      .send({ name: nextName() });
    const cropId = (cropCreated.body as CropResponseBody).id;

    const seasonCreated = await request(app.getHttpServer())
      .post('/api/v1/seasons')
      .send({ year: 1900 + nameCounter });
    const seasonId = (seasonCreated.body as { id: string }).id;

    const producerCreated = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({ name: 'Produtor Crop E2E', document: cpf.generate() });
    const producerId = (producerCreated.body as ProducerResponseBody).id;

    const farmCreated = await request(app.getHttpServer())
      .post('/api/v1/farms')
      .send({
        name: 'Fazenda Crop E2E',
        city: 'Uberaba',
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
      `/api/v1/crops/${cropId}`,
    );

    expect(response.status).toBe(409);

    const getResponse = await request(app.getHttpServer()).get(
      `/api/v1/crops/${cropId}`,
    );
    expect(getResponse.status).toBe(200);
  });
});
