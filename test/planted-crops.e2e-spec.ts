// E2E do módulo PlantedCrop — Supertest contra a aplicação real, Postgres
// real via Testcontainers (nunca sqlite/in-memory, ver praticas.md#testes).
//
// Nasce (passo 3.2 da etapa 3) só com os casos de payload inválido -> 400
// (array vazio, item malformado) — TDD "outside-in": fica red até o módulo
// PlantedCrop estar todo wireado (passos 4-6), expandido no passo 7 com o
// fluxo HTTP completo (201 lote válido, 404 entidades inexistentes, GET
// paginado, DELETE).

import { execSync } from 'node:child_process';
import { faker } from '@faker-js/faker';
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
import { PrismaService } from '../src/shared/prisma/prisma.service';

interface ProducerResponseBody {
  id: string;
}

interface FarmResponseBody {
  id: string;
}

interface PlantedCropResponseBody {
  id: string;
  farmId: string;
  seasonId: string;
  cropId: string;
}

interface PaginatedPlantedCropResponseBody {
  data: PlantedCropResponseBody[];
  meta: { total: number; page: number; limit: number };
}

describe('PlantedCrops (e2e)', () => {
  let app: INestApplication<App>;
  let container: StartedPostgreSqlContainer;
  let prismaService: PrismaService;

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
    prismaService = app.get(PrismaService);
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  async function createFarm(): Promise<string> {
    const producerResponse = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({ name: 'Produtor PlantedCrop E2E', document: cpf.generate() });
    const producerId = (producerResponse.body as ProducerResponseBody).id;

    const farmResponse = await request(app.getHttpServer())
      .post('/api/v1/farms')
      .send({
        name: 'Fazenda PlantedCrop E2E',
        city: 'Ribeirão Preto',
        state: 'SP',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId,
      });
    return (farmResponse.body as FarmResponseBody).id;
  }

  let seasonYearCounter = 1900;

  async function createSeasonAndCrop(): Promise<{
    seasonId: string;
    cropId: string;
  }> {
    seasonYearCounter += 1;
    const season = await prismaService.season.create({
      data: { year: seasonYearCounter },
    });
    const crop = await prismaService.crop.create({
      data: { name: `Cultura ${faker.string.uuid()}` },
    });
    return { seasonId: season.id, cropId: crop.id };
  }

  it('POST /farms/:farmId/planted-crops com array vazio retorna 400', async () => {
    const farmId = await createFarm();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/farms/${farmId}/planted-crops`)
      .send({ items: [] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('POST /farms/:farmId/planted-crops com item malformado retorna 400', async () => {
    const farmId = await createFarm();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/farms/${farmId}/planted-crops`)
      .send({ items: [{ seasonId: 'não-é-um-uuid', cropId: 'também-não' }] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('POST /farms/:farmId/planted-crops com lote válido cria as associações (201)', async () => {
    const farmId = await createFarm();
    const { seasonId, cropId } = await createSeasonAndCrop();
    const { cropId: secondCropId } = await createSeasonAndCrop();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/farms/${farmId}/planted-crops`)
      .send({
        items: [
          { seasonId, cropId },
          { seasonId, cropId: secondCropId },
        ],
      });

    expect(response.status).toBe(201);
    const body = response.body as PlantedCropResponseBody[];
    expect(body).toHaveLength(2);
    expect(body.every((item) => item.farmId === farmId)).toBe(true);
  });

  it('POST /farms/:farmId/planted-crops com duplicata dentro do lote retorna 400', async () => {
    const farmId = await createFarm();
    const { seasonId, cropId } = await createSeasonAndCrop();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/farms/${farmId}/planted-crops`)
      .send({
        items: [
          { seasonId, cropId },
          { seasonId, cropId },
        ],
      });

    expect(response.status).toBe(400);
  });

  it('POST /farms/:farmId/planted-crops com farmId inexistente retorna 404', async () => {
    const { seasonId, cropId } = await createSeasonAndCrop();

    const response = await request(app.getHttpServer())
      .post('/api/v1/farms/00000000-0000-0000-0000-000000000000/planted-crops')
      .send({ items: [{ seasonId, cropId }] });

    expect(response.status).toBe(404);
  });

  it('POST /farms/:farmId/planted-crops com seasonId inexistente retorna 404', async () => {
    const farmId = await createFarm();
    const { cropId } = await createSeasonAndCrop();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/farms/${farmId}/planted-crops`)
      .send({
        items: [{ seasonId: '00000000-0000-0000-0000-000000000000', cropId }],
      });

    expect(response.status).toBe(404);
  });

  it('POST /farms/:farmId/planted-crops com cropId inexistente retorna 404', async () => {
    const farmId = await createFarm();
    const { seasonId } = await createSeasonAndCrop();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/farms/${farmId}/planted-crops`)
      .send({
        items: [{ seasonId, cropId: '00000000-0000-0000-0000-000000000000' }],
      });

    expect(response.status).toBe(404);
  });

  it('GET /farms/:farmId/planted-crops pagina os resultados de uma farm', async () => {
    const farmId = await createFarm();
    const { seasonId, cropId } = await createSeasonAndCrop();
    const { cropId: secondCropId } = await createSeasonAndCrop();
    const { cropId: thirdCropId } = await createSeasonAndCrop();

    await request(app.getHttpServer())
      .post(`/api/v1/farms/${farmId}/planted-crops`)
      .send({
        items: [
          { seasonId, cropId },
          { seasonId, cropId: secondCropId },
          { seasonId, cropId: thirdCropId },
        ],
      })
      .expect(201);

    const response = await request(app.getHttpServer()).get(
      `/api/v1/farms/${farmId}/planted-crops?page=1&limit=2`,
    );

    expect(response.status).toBe(200);
    const body = response.body as PaginatedPlantedCropResponseBody;
    expect(body.meta).toMatchObject({ total: 3, page: 1, limit: 2 });
    expect(body.data).toHaveLength(2);
    expect(body.data.every((item) => item.farmId === farmId)).toBe(true);
  });

  it('DELETE /farms/:farmId/planted-crops/:id remove uma associação existente (204)', async () => {
    const farmId = await createFarm();
    const { seasonId, cropId } = await createSeasonAndCrop();

    const created = await request(app.getHttpServer())
      .post(`/api/v1/farms/${farmId}/planted-crops`)
      .send({ items: [{ seasonId, cropId }] });
    const createdBody = created.body as PlantedCropResponseBody[];

    const deleteResponse = await request(app.getHttpServer()).delete(
      `/api/v1/farms/${farmId}/planted-crops/${createdBody[0].id}`,
    );
    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app.getHttpServer()).get(
      `/api/v1/farms/${farmId}/planted-crops`,
    );
    const getBody = getResponse.body as PaginatedPlantedCropResponseBody;
    expect(getBody.data.some((item) => item.id === createdBody[0].id)).toBe(
      false,
    );
  });

  // Fechado agora que o endpoint de Season existe (etapa 4,
  // 04-safra-cultura.md) — era deixado `it.todo` porque o SeasonsController
  // ainda não existia quando este e2e nasceu (ver 03-cultura-plantada.md,
  // passo 7.1). O comportamento do `Restrict` em si já era coberto de
  // verdade no teste de integração do adapter desde a etapa 3; isto só
  // fecha o fluxo HTTP fim-a-fim.
  it('DELETE /seasons/:id de uma season referenciada por um planted-crop retorna 409', async () => {
    const farmId = await createFarm();
    const { seasonId, cropId } = await createSeasonAndCrop();

    await request(app.getHttpServer())
      .post(`/api/v1/farms/${farmId}/planted-crops`)
      .send({ items: [{ seasonId, cropId }] })
      .expect(201);

    const response = await request(app.getHttpServer()).delete(
      `/api/v1/seasons/${seasonId}`,
    );

    expect(response.status).toBe(409);
  });
});
