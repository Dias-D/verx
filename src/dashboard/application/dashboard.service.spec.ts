// Teste unitário do Service — contra FAKES das duas portas (leitura e
// cache), nunca Prisma/Redis diretamente (o service não conhece detalhe de
// infraestrutura nenhum, só as portas, ver praticas.md). Regra de negócio do
// cache stale-while-revalidate mora aqui, não no adapter (ver
// arquitetura.md#cache-do-dashboard-stale-while-revalidate-com-refresh-proativo):
// lê o cache primeiro e devolve direto — nunca recalcula na hora da
// requisição — exceto em cold start (cache ainda vazio, o
// DashboardCacheRefreshScheduler ainda não rodou pela primeira vez), caso em
// que cai num fallback síncrono via a porta de leitura.
//
// Log de "cache miss" (evento distinto do log do scheduler,
// dashboard-cache-refresh.scheduler.ts) — instrumentação simples usada na
// etapa 8 (teste de carga) para provar via log estruturado que a agregação
// real (fallback síncrono) não é chamada mais vezes do que o esperado sob
// tráfego sustentado: só deve acontecer em cold start, nunca em cache hit.

import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import {
  DASHBOARD_CACHE_PORT,
  DashboardCachePort,
} from '../domain/dashboard-cache.port';
import {
  DASHBOARD_READ_PORT,
  DashboardReadPort,
} from '../domain/dashboard.read.port';
import { buildDashboardSnapshot } from '../test-support/dashboard-snapshot.fixture';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const fakeReadPort: jest.Mocked<DashboardReadPort> = {
    getSnapshot: jest.fn(),
  };
  const fakeCachePort: jest.Mocked<DashboardCachePort> = {
    get: jest.fn(),
    set: jest.fn(),
  };
  const fakeLogger: jest.Mocked<Pick<Logger, 'log' | 'error'>> = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DASHBOARD_READ_PORT, useValue: fakeReadPort },
        { provide: DASHBOARD_CACHE_PORT, useValue: fakeCachePort },
        { provide: Logger, useValue: fakeLogger },
      ],
    }).compile();
    service = module.get(DashboardService);
  });

  it('cache hit: devolve o snapshot do cache direto, sem recalcular via a porta de leitura, e sem logar cache miss', async () => {
    const cachedSnapshot = buildDashboardSnapshot();
    fakeCachePort.get.mockResolvedValue(cachedSnapshot);

    const result = await service.getSnapshot();

    expect(result).toBe(cachedSnapshot);
    expect(fakeCachePort.get).toHaveBeenCalledTimes(1);
    expect(fakeReadPort.getSnapshot).not.toHaveBeenCalled();
    expect(fakeLogger.log).not.toHaveBeenCalled();
  });

  it('cold start: cache vazio (get devolve null) cai no fallback síncrono via a porta de leitura, e loga o evento de cache miss', async () => {
    const freshSnapshot = buildDashboardSnapshot();
    fakeCachePort.get.mockResolvedValue(null);
    fakeReadPort.getSnapshot.mockResolvedValue(freshSnapshot);

    const result = await service.getSnapshot();

    expect(result).toBe(freshSnapshot);
    expect(fakeReadPort.getSnapshot).toHaveBeenCalledTimes(1);
    expect(fakeLogger.log).toHaveBeenCalledTimes(1);
    const [payload] = fakeLogger.log.mock.calls[0] as [Record<string, unknown>];
    expect(payload).toMatchObject({ event: 'dashboard-snapshot-cache-miss' });
  });

  it('não lança erro quando o banco está vazio (tudo zerado) — cold start', async () => {
    const emptySnapshot = buildDashboardSnapshot({
      totalFarms: 0,
      totalHectares: 0,
      byState: [],
      byCrop: [],
      byLandUse: [
        { type: 'arable', hectares: 0 },
        { type: 'vegetation', hectares: 0 },
      ],
    });
    fakeCachePort.get.mockResolvedValue(null);
    fakeReadPort.getSnapshot.mockResolvedValue(emptySnapshot);

    await expect(service.getSnapshot()).resolves.toEqual(emptySnapshot);
  });
});
