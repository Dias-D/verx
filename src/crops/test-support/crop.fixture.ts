// Fixture reutilizável entre testes unitários e de integração (ver
// praticas.md#testes) — dados mockados via @faker-js/faker.

import { faker } from '@faker-js/faker';
import { Crop } from '../domain/crop.entity';

export function buildCrop(overrides: Partial<Crop> = {}): Crop {
  return new Crop(
    overrides.id ?? faker.string.uuid(),
    overrides.name ?? faker.string.uuid(),
  );
}
