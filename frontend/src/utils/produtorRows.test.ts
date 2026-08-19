import { computeProdutorRows } from './produtorRows';
import type { Produtor } from '../types/produtor';
import type { Farm } from '../types/farm';

const produtores: Produtor[] = [
  {
    id: 'p1',
    name: 'José Aparecido Silva',
    document: '29537995593',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p2',
    name: 'Maria Fernandes Costa',
    document: '11222333000181',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const farms: Farm[] = [
  {
    id: 'f1',
    name: 'Fazenda Santa Rita',
    city: 'Sorriso',
    state: 'MT',
    totalAreaHectares: 1000,
    arableAreaHectares: 600,
    vegetationAreaHectares: 400,
    producerId: 'p1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'f2',
    name: 'Fazenda Boa Vista',
    city: 'Sinop',
    state: 'MT',
    totalAreaHectares: 240,
    arableAreaHectares: 200,
    vegetationAreaHectares: 40,
    producerId: 'p1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('computeProdutorRows', () => {
  it('agrupa fazendas por produtor, somando área total e contando fazendas', () => {
    const rows = computeProdutorRows(produtores, farms);

    expect(rows).toEqual([
      {
        id: 'p1',
        name: 'José Aparecido Silva',
        document: '295.379.955-93',
        farmsCount: 2,
        totalAreaHectares: 1240,
      },
      {
        id: 'p2',
        name: 'Maria Fernandes Costa',
        document: '11.222.333/0001-81',
        farmsCount: 0,
        totalAreaHectares: 0,
      },
    ]);
  });

  it('lista de produtores vazia devolve lista de linhas vazia', () => {
    expect(computeProdutorRows([], farms)).toEqual([]);
  });
});
