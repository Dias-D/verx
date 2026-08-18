// Controller fino: delega pro HealthCheckService (terminus), passando os
// indicadores de Postgres e Redis (desde a etapa 5.1). O e2e
// (test/health.e2e-spec.ts) cobre o fluxo real contra Postgres/Redis de
// verdade via Testcontainers.

import { Test } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health-indicator';
import { RedisHealthIndicator } from './redis.health-indicator';

describe('HealthController', () => {
  let controller: HealthController;
  const healthCheckServiceMock = { check: jest.fn() };
  const prismaIndicatorMock = { isHealthy: jest.fn() };
  const redisIndicatorMock = { isHealthy: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckServiceMock },
        { provide: PrismaHealthIndicator, useValue: prismaIndicatorMock },
        { provide: RedisHealthIndicator, useValue: redisIndicatorMock },
      ],
    }).compile();
    controller = module.get(HealthController);
  });

  it('delega para HealthCheckService.check com os indicadores de Postgres e Redis', async () => {
    const expected = { status: 'ok', info: {}, error: {}, details: {} };
    healthCheckServiceMock.check.mockImplementation(
      async (indicators: Array<() => unknown>) => {
        await Promise.all(indicators.map((indicator) => indicator()));
        return expected;
      },
    );
    prismaIndicatorMock.isHealthy.mockResolvedValue({
      database: { status: 'up' },
    });
    redisIndicatorMock.isHealthy.mockResolvedValue({
      redis: { status: 'up' },
    });

    const result = await controller.check();

    expect(result).toBe(expected);
    expect(healthCheckServiceMock.check).toHaveBeenCalledTimes(1);
    expect(prismaIndicatorMock.isHealthy).toHaveBeenCalledWith('database');
    expect(redisIndicatorMock.isHealthy).toHaveBeenCalledWith('redis');
  });
});
