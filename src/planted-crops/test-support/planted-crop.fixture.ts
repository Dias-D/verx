// Fixture reutilizável entre testes unitários e de integração (ver
// praticas.md#testes) — dados mockados via @faker-js/faker.

import { faker } from '@faker-js/faker';
import { PlantedCrop } from '../domain/planted-crop.entity';

export function buildPlantedCrop(
  overrides: Partial<PlantedCrop> = {},
): PlantedCrop {
  const now = new Date();
  return new PlantedCrop(
    overrides.id ?? faker.string.uuid(),
    overrides.farmId ?? faker.string.uuid(),
    overrides.seasonId ?? faker.string.uuid(),
    overrides.cropId ?? faker.string.uuid(),
    overrides.createdAt ?? now,
    overrides.updatedAt ?? now,
  );
}
