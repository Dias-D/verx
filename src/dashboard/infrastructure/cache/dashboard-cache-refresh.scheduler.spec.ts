// Teste unitário do scheduler — contra FAKES das duas portas (leitura e
// cache), nunca Prisma/Redis diretamente (esse racional é coberto pelos
// testes de integração dos respectivos adapters). Cobre: refresh() busca o
// snapshot via DashboardReadPort e escreve no cache via
// DashboardCachePort.set() com o TTL configurado; onApplicationBootstrap
// roda o refresh uma vez (cache não fica vazio no primeiro request real) e
// registra o job periódico via SchedulerRegistry (@nestjs/schedule),
// dirigido pela mesma env var (nunca hardcoded); falha no refresh nunca
// derruba o processo (fica pra próxima rodada).
//
// TTL lido direto de process.env.DASHBOARD_CACHE_TTL_SECONDS (não via
// ConfigService) — mesma convenção já usada pelo resto do projeto
// (PrismaService/main.ts#PORT, ver praticas.md): ConfigModule.forRoot() roda
// de forma síncrona/estática já na importação do módulo, então
// ConfigService.get() não reflete um process.env sobrescrito depois disso
// (Testcontainers em testes de integração/e2e) — só leitura direta de
// process.env (resolvida na hora em que o provider é de fato instanciado)
// reflete o valor certo nesses cenários.
//
// A segunda describe (logging) cobre o passo 5.2: prova, contra um stream
// real do pino capturado em memória (mesmo padrão de logger-redaction.spec.ts),
// que o log do refresh nunca serializa o snapshot inteiro do dashboard — só
// metadados do evento (duração, sucesso/falha).

import { Writable } from 'node:stream';
import { Test } from '@nestjs/testing';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { Logger, LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import {
  DASHBOARD_CACHE_PORT,
  DashboardCachePort,
} from '../../domain/dashboard-cache.port';
import {
  DASHBOARD_READ_PORT,
  DashboardReadPort,
} from '../../domain/dashboard.read.port';
import { buildDashboardSnapshot } from '../../test-support/dashboard-snapshot.fixture';
import { DashboardCacheRefreshScheduler } from './dashboard-cache-refresh.scheduler';

describe('DashboardCacheRefreshScheduler', () => {
  let scheduler: DashboardCacheRefreshScheduler;
  const originalTtlEnv = process.env.DASHBOARD_CACHE_TTL_SECONDS;
  const fakeReadPort: jest.Mocked<DashboardReadPort> = {
    getSnapshot: jest.fn(),
  };
  const fakeCachePort: jest.Mocked<DashboardCachePort> = {
    get: jest.fn(),
    set: jest.fn(),
  };
  const fakeSchedulerRegistry = {
    addInterval: jest.fn(),
    deleteInterval: jest.fn(),
    doesExist: jest.fn(),
  } as unknown as jest.Mocked<SchedulerRegistry>;
  const fakeLogger: jest.Mocked<Pick<Logger, 'log' | 'error'>> = {
    log: jest.fn(),
    error: jest.fn(),
  };

  async function buildScheduler(): Promise<DashboardCacheRefreshScheduler> {
    const module = await Test.createTestingModule({
      providers: [
        DashboardCacheRefreshScheduler,
        { provide: DASHBOARD_READ_PORT, useValue: fakeReadPort },
        { provide: DASHBOARD_CACHE_PORT, useValue: fakeCachePort },
        { provide: SchedulerRegistry, useValue: fakeSchedulerRegistry },
        { provide: Logger, useValue: fakeLogger },
      ],
    }).compile();
    return module.get(DashboardCacheRefreshScheduler);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.DASHBOARD_CACHE_TTL_SECONDS = '300';
    scheduler = await buildScheduler();
  });

  afterAll(() => {
    process.env.DASHBOARD_CACHE_TTL_SECONDS = originalTtlEnv;
  });

  it('refresh() busca o snapshot via DashboardReadPort e escreve no cache via DashboardCachePort.set() com o TTL configurado', async () => {
    const snapshot = buildDashboardSnapshot();
    fakeReadPort.getSnapshot.mockResolvedValue(snapshot);

    await scheduler.refresh();

    expect(fakeReadPort.getSnapshot).toHaveBeenCalledTimes(1);
    expect(fakeCachePort.set).toHaveBeenCalledWith(snapshot, 300);
  });

  it('roda uma vez em onApplicationBootstrap, para não haver cache vazio no primeiro request real', async () => {
    const snapshot = buildDashboardSnapshot();
    fakeReadPort.getSnapshot.mockResolvedValue(snapshot);

    await scheduler.onApplicationBootstrap();

    expect(fakeCachePort.set).toHaveBeenCalledWith(snapshot, 300);

    const [, intervalHandle] = fakeSchedulerRegistry.addInterval.mock
      .calls[0] as [string, NodeJS.Timeout];
    clearInterval(intervalHandle);
  });

  it('registra o job periódico no SchedulerRegistry, com o nome do refresh do dashboard', async () => {
    fakeReadPort.getSnapshot.mockResolvedValue(buildDashboardSnapshot());

    await scheduler.onApplicationBootstrap();

    expect(fakeSchedulerRegistry.addInterval).toHaveBeenCalledTimes(1);
    expect(fakeSchedulerRegistry.addInterval).toHaveBeenCalledWith(
      'dashboard-cache-refresh',
      expect.anything(),
    );

    const [, intervalHandle] = fakeSchedulerRegistry.addInterval.mock
      .calls[0] as [string, NodeJS.Timeout];
    clearInterval(intervalHandle);
  });

  it('onModuleDestroy limpa o interval registrado (deleteInterval do SchedulerRegistry), sem manter o processo vivo depois do app.close()', async () => {
    fakeReadPort.getSnapshot.mockResolvedValue(buildDashboardSnapshot());
    fakeSchedulerRegistry.doesExist.mockReturnValue(true);

    await scheduler.onApplicationBootstrap();
    scheduler.onModuleDestroy();

    expect(fakeSchedulerRegistry.doesExist).toHaveBeenCalledWith(
      'interval',
      'dashboard-cache-refresh',
    );
    expect(fakeSchedulerRegistry.deleteInterval).toHaveBeenCalledWith(
      'dashboard-cache-refresh',
    );

    // fakeSchedulerRegistry.deleteInterval é um jest.fn() sem implementação
    // real — não limpa de fato o setInterval nativo criado por
    // onApplicationBootstrap(). Em produção quem faz isso é o
    // SchedulerRegistry real (clearInterval de verdade, ver
    // node_modules/@nestjs/schedule/dist/scheduler.registry.js), então aqui
    // (unitário, com a porta mockada) o teste limpa manualmente pra não
    // vazar um timer real de 300s pro processo do Jest — mesmo padrão já
    // usado nos dois testes acima que chamam onApplicationBootstrap().
    const [, intervalHandle] = fakeSchedulerRegistry.addInterval.mock
      .calls[0] as [string, NodeJS.Timeout];
    clearInterval(intervalHandle);
  });

  it('onModuleDestroy não explode se o refresh nunca chegou a rodar em bootstrap (nenhum interval registrado)', () => {
    fakeSchedulerRegistry.doesExist.mockReturnValue(false);

    expect(() => scheduler.onModuleDestroy()).not.toThrow();

    expect(fakeSchedulerRegistry.deleteInterval).not.toHaveBeenCalled();
  });

  it('usa o default 300 quando DASHBOARD_CACHE_TTL_SECONDS não está definida', async () => {
    delete process.env.DASHBOARD_CACHE_TTL_SECONDS;
    const schedulerWithoutEnv = await buildScheduler();
    const snapshot = buildDashboardSnapshot();
    fakeReadPort.getSnapshot.mockResolvedValue(snapshot);

    await schedulerWithoutEnv.refresh();

    expect(fakeCachePort.set).toHaveBeenCalledWith(snapshot, 300);
  });

  it('loga sucesso (com metadados de duração) quando o refresh completa', async () => {
    fakeReadPort.getSnapshot.mockResolvedValue(buildDashboardSnapshot());

    await scheduler.refresh();

    expect(fakeLogger.log).toHaveBeenCalledTimes(1);
    const [payload] = fakeLogger.log.mock.calls[0] as [Record<string, unknown>];
    expect(payload).toMatchObject({ success: true });
    expect(typeof payload.durationMs).toBe('number');
  });

  it('nunca derruba o processo quando o refresh falha — loga o erro e segue (próxima rodada tenta de novo)', async () => {
    const failure = new Error('Redis unreachable');
    fakeReadPort.getSnapshot.mockRejectedValue(failure);

    await expect(scheduler.refresh()).resolves.toBeUndefined();

    expect(fakeLogger.error).toHaveBeenCalledTimes(1);
    const [payload] = fakeLogger.error.mock.calls[0] as [
      Record<string, unknown>,
    ];
    expect(payload).toMatchObject({ success: false, err: failure });
  });
});

describe('DashboardCacheRefreshScheduler logging (sem vazar dado de negócio)', () => {
  it('loga só metadados do evento (duração, sucesso), nunca o snapshot inteiro do dashboard', async () => {
    const chunks: Buffer[] = [];
    const captureStream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    const moduleRef = await Test.createTestingModule({
      imports: [PinoLoggerModule.forRoot({ pinoHttp: [{}, captureStream] })],
      providers: [
        DashboardCacheRefreshScheduler,
        {
          provide: DASHBOARD_READ_PORT,
          useValue: {
            getSnapshot: jest.fn().mockResolvedValue(
              buildDashboardSnapshot({
                byCrop: [{ crop: 'Segredo Sensível Da Cultura', count: 1 }],
              }),
            ),
          },
        },
        {
          provide: DASHBOARD_CACHE_PORT,
          useValue: {
            get: jest.fn(),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: SchedulerRegistry, useValue: { addInterval: jest.fn() } },
      ],
    }).compile();

    const scheduler = moduleRef.get(DashboardCacheRefreshScheduler);
    await scheduler.refresh();

    const output = Buffer.concat(chunks).toString('utf8');
    expect(output).not.toContain('Segredo Sensível Da Cultura');
    expect(output).toContain('success');
  });
});

// DIAGNÓSTICO — investigação da causa raiz do timeout de beforeAll (120s) em
// 5 suítes e2e sem relação com Dashboard/Redis (ver 05.1-cache-dashboard.md).
// Usa o SchedulerRegistry REAL (via ScheduleModule.forRoot()), não o fake
// manual usado nas describes acima — só assim é possível provar que
// app.close() de verdade (o mesmo caminho que os e2e usam) dispara
// onModuleDestroy e limpa o setInterval nativo de verdade, e não só um mock
// de deleteInterval que nunca chegaria a chamar clearInterval().
describe('DashboardCacheRefreshScheduler (lifecycle real via SchedulerRegistry de verdade)', () => {
  it('app.close() real (via NestJS lifecycle) remove o interval do SchedulerRegistry — nunca deixa um timer nativo vivo depois de fechar a aplicação', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot()],
      providers: [
        DashboardCacheRefreshScheduler,
        {
          provide: DASHBOARD_READ_PORT,
          useValue: {
            getSnapshot: jest.fn().mockResolvedValue(buildDashboardSnapshot()),
          },
        },
        {
          provide: DASHBOARD_CACHE_PORT,
          useValue: {
            get: jest.fn(),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init(); // dispara onApplicationBootstrap de verdade

    const schedulerRegistry = app.get(SchedulerRegistry);
    expect(schedulerRegistry.getIntervals()).toContain(
      'dashboard-cache-refresh',
    );

    await app.close(); // deve disparar onModuleDestroy de verdade

    expect(schedulerRegistry.getIntervals()).not.toContain(
      'dashboard-cache-refresh',
    );
  });
});
