// Teste unitário do Service — contra FAKES das duas portas (leitura e
// cache), nunca Prisma/Redis diretamente (ver praticas.md). Regra de
// negócio do cache stale-while-revalidate mora aqui, não no adapter: lê o
// cache primeiro e devolve direto (nunca recalcula na requisição); só em
// cold start (cache ainda vazio, refresh do scheduler ainda não rodou) cai
// no fallback síncrono via a porta de leitura — decisão registrada em
// arquitetura.md#cache-do-dashboard.

import { Test } from '@nestjs/testing';
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

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DASHBOARD_READ_PORT, useValue: fakeReadPort },
        { provide: DASHBOARD_CACHE_PORT, useValue: fakeCachePort },
      ],
    }).compile();
    service = module.get(DashboardService);
  });

  it('cache hit: devolve o snapshot do cache direto, sem recalcular via a porta de leitura', async () => {
    const cachedSnapshot = buildDashboardSnapshot();
    fakeCachePort.get.mockResolvedValue(cachedSnapshot);

    const result = await service.getSnapshot();

    expect(result).toBe(cachedSnapshot);
    expect(fakeCachePort.get).toHaveBeenCalledTimes(1);
    expect(fakeReadPort.getSnapshot).not.toHaveBeenCalled();
  });

  it('cold start: cache vazio (get devolve null) cai no fallback síncrono via a porta de leitura', async () => {
    const freshSnapshot = buildDashboardSnapshot();
    fakeCachePort.get.mockResolvedValue(null);
    fakeReadPort.getSnapshot.mockResolvedValue(freshSnapshot);

    const result = await service.getSnapshot();

    expect(result).toBe(freshSnapshot);
    expect(fakeReadPort.getSnapshot).toHaveBeenCalledTimes(1);
  });

  it('não lança erro quando o banco está vazio (tudo zerado) — cold start', () => {
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

    return expect(service.getSnapshot()).resolves.toEqual(emptySnapshot);
  });
});
