// Fixture reutilizável entre testes unitários e de integração (ver
// praticas.md#testes) — dados mockados via @faker-js/faker.

import { faker } from '@faker-js/faker';
import { cpf } from 'cpf-cnpj-validator';
import { Producer } from '../domain/producer.entity';

export function buildProducer(overrides: Partial<Producer> = {}): Producer {
  const now = new Date();
  return new Producer(
    overrides.id ?? faker.string.uuid(),
    overrides.name ?? faker.person.fullName(),
    overrides.document ?? cpf.generate(),
    overrides.createdAt ?? now,
    overrides.updatedAt ?? now,
  );
}
