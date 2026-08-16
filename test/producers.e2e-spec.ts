// E2E do módulo Producer — Supertest contra a aplicação real, Postgres real
// via Testcontainers (nunca sqlite/in-memory, ver praticas.md#testes).
//
// Este arquivo nasce com um único caso (payload inválido -> 400): é o teste
// do ValidationPipe global adiado explicitamente da etapa 0 (só fazia
// sentido existir quando houvesse um DTO real para exercitar o pipe, ver
// etapas/00-scaffold.md e etapas/01-produtor.md passo 4.2). Ele fica red até
// o módulo Producer estar todo wireado (passos 5-7), e é expandido no passo
// 8 com o fluxo HTTP completo.

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
  name: string;
  document: string;
}

interface PaginatedResponseBody {
  data: ProducerResponseBody[];
  meta: { total: number; page: number; limit: number };
}

describe('Producers (e2e)', () => {
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

  it('POST /producers com payload inválido (documento malformado, name ausente) retorna 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({ document: 'not-a-document' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('POST /producers cria um produtor válido (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({
        name: 'João da Silva',
        document: cpf.generate({ formatted: true }),
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: 'João da Silva' });
    expect(response.body).toHaveProperty('id');
  });

  it('POST /producers com documento já cadastrado retorna 409', async () => {
    const document = cpf.generate({ formatted: true });
    await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({ name: 'Produtor A', document })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({ name: 'Produtor B', document });

    expect(response.status).toBe(409);
  });

  it('GET /producers retorna lista paginada no envelope { data, meta }', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/producers?page=1&limit=5',
    );

    expect(response.status).toBe(200);
    const body = response.body as PaginatedResponseBody;
    expect(body).toHaveProperty('data');
    expect(body.meta).toMatchObject({ page: 1, limit: 5 });
  });

  it('GET /producers/:id retorna 404 quando o produtor não existe', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/producers/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(404);
  });

  it('PATCH /producers/:id atualiza um produtor existente (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({
        name: 'Nome Original',
        document: cpf.generate({ formatted: true }),
      });
    const createdBody = created.body as ProducerResponseBody;

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/producers/${createdBody.id}`)
      .send({ name: 'Nome Atualizado' });

    expect(response.status).toBe(200);
    const body = response.body as ProducerResponseBody;
    expect(body.name).toBe('Nome Atualizado');
  });

  it('DELETE /producers/:id remove um produtor existente (204)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({
        name: 'Para Remover',
        document: cpf.generate({ formatted: true }),
      });
    const createdBody = created.body as ProducerResponseBody;

    const deleteResponse = await request(app.getHttpServer()).delete(
      `/api/v1/producers/${createdBody.id}`,
    );
    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app.getHttpServer()).get(
      `/api/v1/producers/${createdBody.id}`,
    );
    expect(getResponse.status).toBe(404);
  });
});
