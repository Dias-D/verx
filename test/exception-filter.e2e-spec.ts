// E2E do exception filter global — confirma o FORMATO padronizado do corpo
// de erro (statusCode, message, timestamp, path), sem stack trace nem
// detalhes internos vazando na resposta, ver etapas/06-observabilidade.md
// passo 3. PrismaService stubado (mesmo padrão de test/app.e2e-spec.ts) —
// os dois cenários aqui (rota inexistente, payload inválido do
// ValidationPipe) não dependem de persistência real.

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/main';
import { PrismaService } from '../src/shared/prisma/prisma.service';

const prismaServiceStub: Pick<
  PrismaService,
  'onModuleInit' | 'onModuleDestroy'
> = {
  onModuleInit: (): void => undefined,
  onModuleDestroy: (): void => undefined,
};

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

describe('Exception filter (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaServiceStub)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('formata um 404 (rota inexistente) no envelope padronizado, sem stack trace', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/does-not-exist',
    );

    expect(response.status).toBe(404);
    const body = response.body as ErrorResponseBody;
    expect(body).toMatchObject({
      statusCode: 404,
      path: '/api/v1/does-not-exist',
    });
    expect(typeof body.timestamp).toBe('string');
    expect(body).not.toHaveProperty('stack');
  });

  it('formata um 400 do ValidationPipe (payload inválido) no mesmo envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .send({});

    expect(response.status).toBe(400);
    const body = response.body as ErrorResponseBody;
    expect(body.statusCode).toBe(400);
    expect(body.path).toBe('/api/v1/producers');
    expect(typeof body.timestamp).toBe('string');
    expect(
      Array.isArray(body.message) || typeof body.message === 'string',
    ).toBe(true);
    expect(body).not.toHaveProperty('stack');
  });
});
