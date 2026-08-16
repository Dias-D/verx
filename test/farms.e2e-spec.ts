// E2E do módulo Farm — Supertest contra a aplicação real, Postgres real via
// Testcontainers (nunca sqlite/in-memory, ver praticas.md#testes).
//
// Nasceu (passo 4.2 da etapa 2) só com os casos de payload inválido -> 400
// (área inválida, UF fora do enum), red até o módulo Farm estar todo
// wireado (passos 5-7). Expandido aqui (passo 8) com o fluxo HTTP completo:
// 201/400/404 em POST, GET filtrado+paginado, PATCH revalidando área, DELETE.

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

interface ProducerResponseBody {
  id: string;
}

interface FarmResponseBody {
  id: string;
  name: string;
  city: string;
  state: string;
  totalAreaHectares: number;
  arableAreaHectares: number;
  vegetationAreaHectares: number;
  producerId: string;
}

interface PaginatedFarmResponseBody {
  data: FarmResponseBody[];
  meta: { total: number; page: number; limit: number };
}

describe('Farms (e2e)', () => {
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

  async function createProducer(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({ name: 'Produtor Farm E2E', document: cpf.generate() });
    return (response.body as ProducerResponseBody).id;
  }

  it('POST /farms com área inválida (soma acima do total) retorna 400', async () => {
    const producerId = await createProducer();

    const response = await request(app.getHttpServer())
      .post('/api/v1/farms')
      .send({
        name: 'Fazenda Inválida',
        city: 'Ribeirão Preto',
        state: 'SP',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40.01,
        producerId,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('POST /farms com UF fora do enum retorna 400', async () => {
    const producerId = await createProducer();

    const response = await request(app.getHttpServer())
      .post('/api/v1/farms')
      .send({
        name: 'Fazenda UF Inválida',
        city: 'Cidade Inexistente',
        state: 'ZZ',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('POST /farms com payload válido cria uma farm (201)', async () => {
    const producerId = await createProducer();

    const response = await request(app.getHttpServer())
      .post('/api/v1/farms')
      .send({
        name: 'Fazenda Boa Vista',
        city: 'Ribeirão Preto',
        state: 'SP',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId,
      });

    expect(response.status).toBe(201);
    const body = response.body as FarmResponseBody;
    expect(body).toMatchObject({ name: 'Fazenda Boa Vista', producerId });
    expect(body).toHaveProperty('id');
  });

  it('POST /farms com producerId inexistente retorna 404', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/farms')
      .send({
        name: 'Fazenda Órfã',
        city: 'Cidade X',
        state: 'SP',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId: '00000000-0000-0000-0000-000000000000',
      });

    expect(response.status).toBe(404);
  });

  it('GET /farms filtra por producerId/state/city e pagina os resultados', async () => {
    const producerId = await createProducer();

    for (let i = 0; i < 3; i += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/farms')
        .send({
          name: `Fazenda Campinas ${i}`,
          city: 'Campinas',
          state: 'SP',
          totalAreaHectares: 100,
          arableAreaHectares: 60,
          vegetationAreaHectares: 40,
          producerId,
        })
        .expect(201);
    }
    await request(app.getHttpServer())
      .post('/api/v1/farms')
      .send({
        name: 'Fazenda Outra Cidade',
        city: 'Uberlândia',
        state: 'MG',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId,
      })
      .expect(201);

    const response = await request(app.getHttpServer()).get(
      `/api/v1/farms?producerId=${producerId}&state=SP&city=Campinas&page=1&limit=2`,
    );

    expect(response.status).toBe(200);
    const body = response.body as PaginatedFarmResponseBody;
    expect(body.meta).toMatchObject({ total: 3, page: 1, limit: 2 });
    expect(body.data).toHaveLength(2);
    expect(
      body.data.every(
        (farm) =>
          farm.producerId === producerId &&
          farm.state === 'SP' &&
          farm.city === 'Campinas',
      ),
    ).toBe(true);
  });

  it('GET /farms/:id retorna 404 quando a farm não existe', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/farms/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(404);
  });

  it('PATCH /farms/:id revalida a área mesclando com o estado persistido (200 e 400)', async () => {
    const producerId = await createProducer();
    const created = await request(app.getHttpServer())
      .post('/api/v1/farms')
      .send({
        name: 'Fazenda Original',
        city: 'Cidade Original',
        state: 'RJ',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId,
      });
    const createdBody = created.body as FarmResponseBody;

    const validUpdate = await request(app.getHttpServer())
      .patch(`/api/v1/farms/${createdBody.id}`)
      .send({ arableAreaHectares: 70, vegetationAreaHectares: 30 });
    expect(validUpdate.status).toBe(200);
    const validBody = validUpdate.body as FarmResponseBody;
    expect(validBody.arableAreaHectares).toBe(70);

    // Só arableAreaHectares muda no payload; sem mesclar com o estado
    // persistido (vegetation=30, total=100), 90+30 ultrapassaria o total.
    const invalidUpdate = await request(app.getHttpServer())
      .patch(`/api/v1/farms/${createdBody.id}`)
      .send({ arableAreaHectares: 90 });
    expect(invalidUpdate.status).toBe(400);
  });

  it('DELETE /farms/:id remove uma farm existente (204)', async () => {
    const producerId = await createProducer();
    const created = await request(app.getHttpServer())
      .post('/api/v1/farms')
      .send({
        name: 'Fazenda Para Remover',
        city: 'Cidade Y',
        state: 'BA',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId,
      });
    const createdBody = created.body as FarmResponseBody;

    const deleteResponse = await request(app.getHttpServer()).delete(
      `/api/v1/farms/${createdBody.id}`,
    );
    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app.getHttpServer()).get(
      `/api/v1/farms/${createdBody.id}`,
    );
    expect(getResponse.status).toBe(404);
  });
});
