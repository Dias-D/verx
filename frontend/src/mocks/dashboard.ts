import type { DashboardSnapshot } from '../types/dashboard';

/**
 * Fixture de cenário para desenvolvimento sem backend e para os testes que
 * mockam `api/dashboard.ts` (nunca o `fetch` global, ver
 * frontend-teste-brain-ag.md#6-testes). Números redondos, mas plausíveis —
 * espelham o formato que o wireframe congelado usa como exemplo.
 */
export const dashboardSnapshotFixture: DashboardSnapshot = {
  totalFarms: 128,
  totalHectares: 342_500,
  byState: [
    { state: 'MT', count: 46 },
    { state: 'GO', count: 36 },
    { state: 'PR', count: 24 },
    { state: 'SP', count: 22 },
  ],
  byCrop: [
    { crop: 'Soja', count: 56 },
    { crop: 'Milho', count: 36 },
    { crop: 'Café', count: 24 },
    { crop: 'Algodão', count: 12 },
  ],
  byLandUse: [
    { type: 'arable', hectares: 219_200 },
    { type: 'vegetation', hectares: 123_300 },
  ],
  calculatedAt: '2026-08-19T21:14:00.000Z',
};

/**
 * Mesma fixture, sem `calculatedAt` — cobre a janela rara de cold-start do
 * cache no backend (ver types/dashboard.ts), em que o campo vem ausente.
 */
export const dashboardSnapshotWithoutCalculatedAtFixture: DashboardSnapshot = {
  ...dashboardSnapshotFixture,
  calculatedAt: undefined,
};
