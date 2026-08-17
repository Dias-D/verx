// Controller fino: delega pro HealthCheckService (terminus), passando o
// indicador do Postgres. O e2e (test/health.e2e-spec.ts) cobre o fluxo real
// contra um Postgres de verdade via Testcontainers.

import { Test } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health-indicator';

describe('HealthController', () => {
  let controller: HealthController;
  const healthCheckServiceMock = { check: jest.fn() };
  const prismaIndicatorMock = { isHealthy: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckServiceMock },
        { provide: PrismaHealthIndicator, useValue: prismaIndicatorMock },
      ],
    }).compile();
    controller = module.get(HealthController);
  });

  it('delega para HealthCheckService.check com o indicador do Postgres', async () => {
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

    const result = await controller.check();

    expect(result).toBe(expected);
    expect(healthCheckServiceMock.check).toHaveBeenCalledTimes(1);
    expect(prismaIndicatorMock.isHealthy).toHaveBeenCalledWith('database');
  });
});
