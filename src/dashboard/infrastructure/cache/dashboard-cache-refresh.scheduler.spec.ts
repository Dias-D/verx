// Teste unitário do scheduler — contra FAKES das duas portas (leitura e
// cache), nunca Prisma/Redis diretamente (esse racional é coberto pelos
// testes de integração dos respectivos adapters). Cobre: refresh() busca o
// snapshot via DashboardReadPort e escreve no cache via
// DashboardCachePort.set() com o TTL configurado; onApplicationBootstrap
// roda o refresh uma vez (cache não fica vazio no primeiro request real) e
// registra o job periódico via SchedulerRegistry (@nestjs/schedule),
// dirigido pela mesma env var (nunca hardcoded).

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
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
  const fakeReadPort: jest.Mocked<DashboardReadPort> = {
    getSnapshot: jest.fn(),
  };
  const fakeCachePort: jest.Mocked<DashboardCachePort> = {
    get: jest.fn(),
    set: jest.fn(),
  };
  const fakeSchedulerRegistry = {
    addInterval: jest.fn(),
  } as unknown as jest.Mocked<SchedulerRegistry>;
  const fakeConfigService = {
    get: jest.fn().mockReturnValue(300),
  } as unknown as jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fakeConfigService.get as jest.Mock).mockReturnValue(300);
    const module = await Test.createTestingModule({
      providers: [
        DashboardCacheRefreshScheduler,
        { provide: DASHBOARD_READ_PORT, useValue: fakeReadPort },
        { provide: DASHBOARD_CACHE_PORT, useValue: fakeCachePort },
        { provide: ConfigService, useValue: fakeConfigService },
        { provide: SchedulerRegistry, useValue: fakeSchedulerRegistry },
      ],
    }).compile();
    scheduler = module.get(DashboardCacheRefreshScheduler);
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
});
