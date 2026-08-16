// Controller fino — só HTTP + delegação. Teste unitário com o Service
// mockado (o teste HTTP completo fica em test/dashboard.e2e-spec.ts).

import { Test } from '@nestjs/testing';
import { DashboardService } from '../../application/dashboard.service';
import { buildDashboardSnapshot } from '../../test-support/dashboard-snapshot.fixture';
import { DashboardController } from './dashboard.controller';

describe('DashboardController', () => {
  let controller: DashboardController;
  const serviceMock = {
    getSnapshot: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: serviceMock }],
    }).compile();
    controller = module.get(DashboardController);
  });

  it('delega ao service e devolve o snapshot', async () => {
    const snapshot = buildDashboardSnapshot();
    serviceMock.getSnapshot.mockResolvedValue(snapshot);

    await expect(controller.getSnapshot()).resolves.toBe(snapshot);
    expect(serviceMock.getSnapshot).toHaveBeenCalledTimes(1);
  });
});
