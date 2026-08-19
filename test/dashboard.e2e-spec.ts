// E2E do módulo Dashboard — Supertest contra a aplicação real, Postgres e
// Redis reais via Testcontainers (nunca sqlite/in-memory nem mock de cache,
// ver praticas.md#testes e 05.1-cache-dashboard.md "Se travar").
//
// Cobre o formato completo do DashboardSnapshot populado via as próprias
// rotas HTTP (producer -> farm -> planted-crop), e o item central do gate da
// sub-etapa 5.1: GET /dashboard nunca recalcula por requisição fora do cold
// start — só o DashboardCacheRefreshScheduler (rodando em bootstrap e depois
// periodicamente, fora do tráfego) chama a agregação de verdade. Isso é
// provado espionando o método real da porta de leitura
// (DASHBOARD_READ_PORT.getSnapshot) que o Prisma adapter implementa, não um
// stand-in — o adapter concreto continua sendo o mesmo usado em produção.
// Também confirma (passo 5.3) que X-Request-Id continua presente mesmo em
// resposta servida do cache.

import { execSync } from 'node:child_process';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { cpf } from 'cpf-cnpj-validator';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DASHBOARD_READ_PORT } from '../src/dashboard/domain/dashboard.read.port';
import type { DashboardReadPort } from '../src/dashboard/domain/dashboard.read.port';
import { configureApp } from '../src/main';

interface DashboardResponseBody {
  totalFarms: number;
  totalHectares: number;
  byState: { state: string; count: number }[];
  byCrop: { crop: string; count: number }[];
  byLandUse: { type: string; hectares: number }[];
  calculatedAt: string;
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

// TTL/intervalo de refresh curtos (segundos) só neste ambiente de teste, pra
// observar o mecanismo de verdade sem o teste demorar os 5 minutos
// configurados por padrão em produção (DASHBOARD_CACHE_TTL_SECONDS).
const CACHE_TTL_SECONDS = 3;

describe('Dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let postgresContainer: StartedPostgreSqlContainer;
  let redisContainer: StartedRedisContainer;
  let getSnapshotSpy: jest.SpiedFunction<DashboardReadPort['getSnapshot']>;
  // Capturado no primeiro teste (cache já aquecido pelo bootstrap) e
  // reutilizado nos testes seguintes pra confirmar que calculatedAt reflete
  // o momento do CÁLCULO (só muda quando o scheduler recalcula de verdade),
  // nunca o momento do fetch (ver decisoes-pendentes.md#1).
  let calculatedAtAfterBootstrap: string;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer(
      'postgres:16-alpine',
    ).start();
    redisContainer = await new RedisContainer('redis:7-alpine').start();
    const databaseUrl = postgresContainer.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;
    process.env.REDIS_URL = redisContainer.getConnectionUrl();
    process.env.DASHBOARD_CACHE_TTL_SECONDS = String(CACHE_TTL_SECONDS);

    execSync('yarn prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const readPort = moduleFixture.get<DashboardReadPort>(DASHBOARD_READ_PORT);
    getSnapshotSpy = jest.spyOn(readPort, 'getSnapshot');

    app = moduleFixture.createNestApplication();
    configureApp(app);
    // app.init() dispara onApplicationBootstrap -> o scheduler já roda o
    // primeiro refresh aqui, então o cache já chega aquecido no primeiro
    // teste (a spy já registra essa primeira chamada).
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await postgresContainer.stop();
    await redisContainer.stop();
  });

  it('GET /dashboard retorna 200 com tudo zerado quando o banco está vazio (cache já aquecido pelo bootstrap)', async () => {
    expect(getSnapshotSpy).toHaveBeenCalledTimes(1);

    const response = await request(app.getHttpServer()).get(
      '/api/v1/dashboard',
    );

    expect(response.status).toBe(200);
    const body = response.body as DashboardResponseBody;
    expect(body).toMatchObject({
      totalFarms: 0,
      totalHectares: 0,
      byState: [],
      byCrop: [],
      byLandUse: [
        { type: 'arable', hectares: 0 },
        { type: 'vegetation', hectares: 0 },
      ],
    });
    // Gravado pelo DashboardCacheRefreshScheduler no bootstrap
    // (onApplicationBootstrap), não pela própria requisição — ver
    // decisoes-pendentes.md#1. Serializado como string ISO 8601 no JSON,
    // como qualquer Date num payload HTTP (checado à parte do toMatchObject
    // acima porque o valor em si é dinâmico, não fixo).
    expect(typeof body.calculatedAt).toBe('string');
    expect(Number.isNaN(Date.parse(body.calculatedAt))).toBe(false);
    // A própria requisição não deve ter disparado nenhum recálculo.
    expect(getSnapshotSpy).toHaveBeenCalledTimes(1);

    calculatedAtAfterBootstrap = body.calculatedAt;
  });

  it('GET /dashboard inclui X-Request-Id mesmo servido do cache', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/dashboard',
    );

    expect(response.status).toBe(200);
    const requestId = response.headers['x-request-id'];
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(0);
  });

  it('GET /dashboard não recalcula em requisições repetidas dentro da janela de TTL', async () => {
    const callsBefore = getSnapshotSpy.mock.calls.length;

    const first = await request(app.getHttpServer())
      .get('/api/v1/dashboard')
      .expect(200);
    const second = await request(app.getHttpServer())
      .get('/api/v1/dashboard')
      .expect(200);
    const third = await request(app.getHttpServer())
      .get('/api/v1/dashboard')
      .expect(200);

    expect(getSnapshotSpy.mock.calls.length).toBe(callsBefore);
    // calculatedAt é o horário do CÁLCULO, não do fetch — requisições
    // repetidas servidas do mesmo cache devem devolver o mesmo valor, mesmo
    // que os fetches em si aconteçam em instantes diferentes.
    const firstBody = first.body as DashboardResponseBody;
    const secondBody = second.body as DashboardResponseBody;
    const thirdBody = third.body as DashboardResponseBody;
    expect(firstBody.calculatedAt).toBe(calculatedAtAfterBootstrap);
    expect(secondBody.calculatedAt).toBe(calculatedAtAfterBootstrap);
    expect(thirdBody.calculatedAt).toBe(calculatedAtAfterBootstrap);
  });

  it('GET /dashboard reflete dados cadastrados via HTTP só depois que o refresh agendado roda (TTL expirado), sem que a própria requisição recalcule', async () => {
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

    // Logo após cadastrar, o cache ainda está com o valor antigo (não
    // recalcula por requisição) — só espera o refresh agendado rodar de
    // novo, fora do tráfego, dentro da janela de TTL configurada.
    await new Promise((resolve) =>
      setTimeout(resolve, (CACHE_TTL_SECONDS + 1) * 1000),
    );

    const callsBeforeRequest = getSnapshotSpy.mock.calls.length;
    expect(callsBeforeRequest).toBeGreaterThan(1); // o scheduler já rodou de novo em background

    const response = await request(app.getHttpServer()).get(
      '/api/v1/dashboard',
    );

    // A própria requisição não chamou a agregação de novo.
    expect(getSnapshotSpy.mock.calls.length).toBe(callsBeforeRequest);

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
    // calculatedAt avançou porque o scheduler recalculou de verdade nesse
    // meio-tempo — confirma que o campo segue o momento do CÁLCULO, não do
    // fetch (ver decisoes-pendentes.md#1).
    expect(Date.parse(body.calculatedAt)).toBeGreaterThan(
      Date.parse(calculatedAtAfterBootstrap),
    );
    expect(body.byLandUse).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'arable' }),
        expect.objectContaining({ type: 'vegetation' }),
      ]),
    );
  }, 15_000);
});
