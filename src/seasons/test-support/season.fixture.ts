// Fixture reutilizável entre testes unitários e de integração (ver
// praticas.md#testes) — dados mockados via @faker-js/faker.

import { faker } from '@faker-js/faker';
import { Season } from '../domain/season.entity';

export function buildSeason(overrides: Partial<Season> = {}): Season {
  return new Season(
    overrides.id ?? faker.string.uuid(),
    overrides.year ?? faker.number.int({ min: 1900, max: 2100 }),
  );
}
