// Fixture reutilizável entre testes unitários e de integração (ver
// praticas.md#testes) — dados mockados via @faker-js/faker.

import { faker } from '@faker-js/faker';
import { DashboardSnapshot } from '../domain/dashboard-snapshot';

export function buildDashboardSnapshot(
  overrides: Partial<DashboardSnapshot> = {},
): DashboardSnapshot {
  return {
    totalFarms: overrides.totalFarms ?? faker.number.int({ min: 1, max: 100 }),
    totalHectares:
      overrides.totalHectares ??
      faker.number.float({ min: 100, max: 10_000, fractionDigits: 2 }),
    byState: overrides.byState ?? [
      { state: 'SP', count: 3 },
      { state: 'MG', count: 2 },
    ],
    byCrop: overrides.byCrop ?? [
      { crop: 'Soja', count: 4 },
      { crop: 'Milho', count: 1 },
    ],
    byLandUse: overrides.byLandUse ?? [
      { type: 'arable', hectares: 600 },
      { type: 'vegetation', hectares: 400 },
    ],
  };
}
