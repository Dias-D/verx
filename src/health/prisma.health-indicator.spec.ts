// Indicador customizado (SELECT 1 direto), em vez do PrismaHealthIndicator
// embutido do @nestjs/terminus — aquele tenta `$runCommandRaw` (API do
// driver Mongo) antes de cair para SQL, o que não se aplica ao client
// Postgres deste projeto (ver etapas/06-observabilidade.md passo 4.2).

import { HealthIndicatorService } from '@nestjs/terminus';
import { PrismaService } from '../shared/prisma/prisma.service';
import { PrismaHealthIndicator } from './prisma.health-indicator';

describe('PrismaHealthIndicator', () => {
  let indicator: PrismaHealthIndicator;
  let prismaMock: Pick<PrismaService, '$queryRaw'>;
  let healthIndicatorService: HealthIndicatorService;

  beforeEach(() => {
    prismaMock = { $queryRaw: jest.fn() };
    healthIndicatorService = new HealthIndicatorService();
    indicator = new PrismaHealthIndicator(
      healthIndicatorService,
      prismaMock as PrismaService,
    );
  });

  it('reporta "up" quando o SELECT 1 resolve', async () => {
    (prismaMock.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

    const result = await indicator.isHealthy('database');

    expect(result).toEqual({ database: { status: 'up' } });
  });

  it('reporta "down" quando o Postgres está inacessível, sem lançar (o HealthCheckService decide o 503)', async () => {
    (prismaMock.$queryRaw as jest.Mock).mockRejectedValue(
      new Error('connection refused'),
    );

    const result = await indicator.isHealthy('database');

    expect(result).toMatchObject({ database: { status: 'down' } });
  });
});
