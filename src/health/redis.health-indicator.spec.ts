// Indicador customizado de Redis — round-trip set/get via o `Cache` do
// @nestjs/cache-manager (o mesmo usado pelo DashboardCacheManagerAdapter,
// nunca um cliente Redis cru como ioredis, ver
// 05.1-cache-dashboard.md#escopo). Mesmo padrão do PrismaHealthIndicator
// (indicador próprio em vez de um indicador embutido do terminus): não
// existe indicador de cache-manager embutido no @nestjs/terminus.

import { HealthIndicatorService } from '@nestjs/terminus';
import type { Cache } from '@nestjs/cache-manager';
import { RedisHealthIndicator } from './redis.health-indicator';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let cacheMock: Pick<Cache, 'set' | 'get'>;
  let healthIndicatorService: HealthIndicatorService;

  beforeEach(() => {
    cacheMock = { set: jest.fn(), get: jest.fn() };
    healthIndicatorService = new HealthIndicatorService();
    indicator = new RedisHealthIndicator(
      healthIndicatorService,
      cacheMock as Cache,
    );
  });

  it('reporta "up" quando o round-trip set/get no Redis funciona', async () => {
    (cacheMock.set as jest.Mock).mockResolvedValue(undefined);
    (cacheMock.get as jest.Mock).mockResolvedValue('ok');

    const result = await indicator.isHealthy('redis');

    expect(result).toEqual({ redis: { status: 'up' } });
    expect(cacheMock.set).toHaveBeenCalled();
    expect(cacheMock.get).toHaveBeenCalled();
  });

  it('reporta "down" quando o Redis está inacessível, sem lançar (o HealthCheckService decide o 503)', async () => {
    (cacheMock.set as jest.Mock).mockRejectedValue(
      new Error('connect ECONNREFUSED'),
    );

    const result = await indicator.isHealthy('redis');

    expect(result).toMatchObject({ redis: { status: 'down' } });
  });

  it('reporta "down" quando o valor lido de volta não confere (round-trip corrompido)', async () => {
    (cacheMock.set as jest.Mock).mockResolvedValue(undefined);
    (cacheMock.get as jest.Mock).mockResolvedValue('unexpected-value');

    const result = await indicator.isHealthy('redis');

    expect(result).toMatchObject({ redis: { status: 'down' } });
  });
});
