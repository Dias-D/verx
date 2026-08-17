// E2E de correlação por requisição — confirma que toda resposta HTTP
// inclui X-Request-Id (gerado se o client não mandar, propagado se mandar),
// ver etapas/06-observabilidade.md passo 2. Não precisa de Postgres real
// (PrismaService stubado, mesmo padrão de test/app.e2e-spec.ts) porque o
// comportamento testado é do middleware de correlação, não de persistência.
//
// Alvo das requisições: uma rota inexistente (não uma rota real da API nem
// `/docs`). Rota real evitaria precisar do Postgres; `/docs` foi descartado
// porque o Swagger UI é montado como middleware Express direto (fora do
// pipeline de rotas do Nest) e responde antes do middleware de correlação
// rodar, deixando o teste falso-negativo. Uma rota inexistente ainda passa
// pelo middleware global do Nest (aplicado a `*`) antes de cair no 404
// padrão — e prova, de quebra, que até respostas de erro carregam o
// X-Request-Id, que é exatamente o cenário em que ele mais importa.

import { randomUUID } from 'node:crypto';
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

describe('Correlation id (X-Request-Id) (e2e)', () => {
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

  it('gera um X-Request-Id quando o client não envia nenhum', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/does-not-exist',
    );

    const requestId = response.headers['x-request-id'];
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(0);
  });

  it('propaga o X-Request-Id enviado pelo client, em vez de gerar um novo', async () => {
    const incomingId = randomUUID();

    const response = await request(app.getHttpServer())
      .get('/api/v1/does-not-exist')
      .set('X-Request-Id', incomingId);

    expect(response.headers['x-request-id']).toBe(incomingId);
  });

  it('gera ids diferentes para requisições diferentes sem header', async () => {
    const first = await request(app.getHttpServer()).get(
      '/api/v1/does-not-exist',
    );
    const second = await request(app.getHttpServer()).get(
      '/api/v1/does-not-exist',
    );

    expect(first.headers['x-request-id']).not.toBe(
      second.headers['x-request-id'],
    );
  });
});
