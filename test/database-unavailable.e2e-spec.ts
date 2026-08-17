// E2E do mapeamento de falha de conexão com o banco -> 503 (etapa 6.1,
// ver etapas/06.1-contrato-erros.md passo 2). Derrubar de verdade o
// container Postgres do Testcontainers no meio do teste é frágil/lento (ver
// "Se travar" do arquivo da etapa) — usa a alternativa explicitamente
// prevista: PrismaService substituído por um stub cujo `producer.findMany`
// rejeita com o mesmo tipo de erro que o Prisma lança de verdade quando o
// servidor está inalcançável (`PrismaClientInitializationError`, código
// P1001), exercitando o pipeline HTTP real (controller -> service ->
// adapter -> AllExceptionsFilter) sem depender de infraestrutura instável.

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/main';
import { PrismaService } from '../src/shared/prisma/prisma.service';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

const connectionError = new Prisma.PrismaClientInitializationError(
  "Can't reach database server at postgres:5432",
  '6.19.3',
  'P1001',
);

const prismaServiceStub: Pick<
  PrismaService,
  'onModuleInit' | 'onModuleDestroy'
> & {
  producer: { findMany: jest.Mock; count: jest.Mock };
} = {
  onModuleInit: (): void => undefined,
  onModuleDestroy: (): void => undefined,
  producer: {
    findMany: jest.fn().mockRejectedValue(connectionError),
    count: jest.fn().mockRejectedValue(connectionError),
  },
};

describe('Falha de conexão com o banco (e2e)', () => {
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

  it('GET /producers com o banco inalcançável retorna 503, sem vazar detalhes de conexão', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/producers',
    );

    expect(response.status).toBe(503);
    const body = response.body as ErrorResponseBody;
    expect(body.statusCode).toBe(503);
    expect(body.path).toBe('/api/v1/producers');
    expect(JSON.stringify(body)).not.toContain('postgres:5432');
    expect(body).not.toHaveProperty('stack');
  });
});
