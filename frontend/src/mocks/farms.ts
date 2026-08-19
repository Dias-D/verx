import type { Farm } from '../types/farm';
import type { PaginatedResponse } from '../types/pagination';

/**
 * Fixture de cenário para desenvolvimento sem backend e para os testes que
 * mockam `api/farms.ts` — mesmos nomes de exemplo do wireframe congelado
 * (crud-produtor.html).
 */
export const farmFixture: Farm = {
  id: 'f1',
  name: 'Fazenda Santa Rita',
  city: 'Sorriso',
  state: 'MT',
  totalAreaHectares: 1240,
  arableAreaHectares: 800,
  vegetationAreaHectares: 440,
  producerId: 'p1',
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-01T12:00:00.000Z',
};

export const farmsListFixture: Farm[] = [
  farmFixture,
  {
    id: 'f2',
    name: 'Fazenda Boa Esperança',
    city: 'Sinop',
    state: 'MT',
    totalAreaHectares: 8900,
    arableAreaHectares: 5000,
    vegetationAreaHectares: 3900,
    producerId: 'p2',
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z',
  },
  {
    id: 'f3',
    name: 'Fazenda Três Marias',
    city: 'Ribeirão Preto',
    state: 'SP',
    totalAreaHectares: 340,
    arableAreaHectares: 240,
    vegetationAreaHectares: 100,
    producerId: 'p3',
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z',
  },
];

export const farmsPaginatedFixture: PaginatedResponse<Farm> = {
  data: farmsListFixture,
  meta: { total: farmsListFixture.length, page: 1, limit: 100 },
};
