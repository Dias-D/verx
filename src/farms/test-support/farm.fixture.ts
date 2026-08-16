// Fixture reutilizável entre testes unitários e de integração (ver
// praticas.md#testes) — dados mockados via @faker-js/faker.

import { faker } from '@faker-js/faker';
import { BRAZILIAN_STATES } from '../domain/brazilian-state';
import { Farm } from '../domain/farm.entity';

export function buildFarm(overrides: Partial<Farm> = {}): Farm {
  const now = new Date();
  const arableAreaHectares = overrides.arableAreaHectares ?? 60;
  const vegetationAreaHectares = overrides.vegetationAreaHectares ?? 40;
  return new Farm(
    overrides.id ?? faker.string.uuid(),
    overrides.name ?? faker.company.name(),
    overrides.city ?? faker.location.city(),
    overrides.state ?? faker.helpers.arrayElement(BRAZILIAN_STATES),
    overrides.totalAreaHectares ?? arableAreaHectares + vegetationAreaHectares,
    arableAreaHectares,
    vegetationAreaHectares,
    overrides.producerId ?? faker.string.uuid(),
    overrides.createdAt ?? now,
    overrides.updatedAt ?? now,
  );
}
