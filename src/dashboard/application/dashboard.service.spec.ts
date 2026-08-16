// Teste unitário do Service — contra um FAKE da porta de leitura, nunca o
// Prisma diretamente (o service não conhece o Prisma, só a porta, ver
// praticas.md). Não há regra de negócio própria aqui: é passagem direta do
// snapshot que a porta devolve; o domínio existe pela consistência
// estrutural com os outros módulos (ver 05-dashboard.md).

import { Test } from '@nestjs/testing';
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

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DASHBOARD_READ_PORT, useValue: fakeReadPort },
      ],
    }).compile();
    service = module.get(DashboardService);
  });

  it('devolve exatamente o snapshot que a porta retorna (passagem direta)', async () => {
    const snapshot = buildDashboardSnapshot();
    fakeReadPort.getSnapshot.mockResolvedValue(snapshot);

    const result = await service.getSnapshot();

    expect(result).toBe(snapshot);
    expect(fakeReadPort.getSnapshot).toHaveBeenCalledTimes(1);
  });

  it('não lança erro quando o banco está vazio (tudo zerado)', async () => {
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
    fakeReadPort.getSnapshot.mockResolvedValue(emptySnapshot);

    await expect(service.getSnapshot()).resolves.toEqual(emptySnapshot);
  });
});
