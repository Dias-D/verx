import type { Produtor } from '../types/produtor';
import type { PaginatedResponse } from '../types/pagination';

/**
 * Fixture de cenário para desenvolvimento sem backend e para os testes que
 * mockam `api/produtores.ts` (nunca o `fetch` global, ver
 * frontend-teste-brain-ag.md#6-testes). Mesmos nomes de exemplo do wireframe
 * congelado (crud-produtor.html).
 */
export const produtorFixture: Produtor = {
  id: 'p1',
  name: 'José Aparecido Silva',
  document: '29537995593',
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-01T12:00:00.000Z',
};

export const produtoresListFixture: Produtor[] = [
  produtorFixture,
  {
    id: 'p2',
    name: 'Agropecuária Vale Verde Ltda',
    document: '12345678000190',
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z',
  },
  {
    id: 'p3',
    name: 'Maria Fernandes Costa',
    document: '98765432100',
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z',
  },
];

export const produtoresPaginatedFixture: PaginatedResponse<Produtor> = {
  data: produtoresListFixture,
  meta: { total: produtoresListFixture.length, page: 1, limit: 100 },
};

export const emptyProdutoresPaginatedFixture: PaginatedResponse<Produtor> = {
  data: [],
  meta: { total: 0, page: 1, limit: 100 },
};
