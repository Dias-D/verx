import { createFarm, listFarms, updateFarm } from './farms';
import { apiClient } from './client';
import { farmFixture, farmsPaginatedFixture } from '../mocks/farms';

jest.mock('./client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

describe('api/farms', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('listFarms: GET /farms, com filtro de producerId e paginação', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue(farmsPaginatedFixture);

    const result = await listFarms({ producerId: 'p1', limit: 100 });

    expect(apiClient.get).toHaveBeenCalledWith('/farms?producerId=p1&limit=100');
    expect(result).toEqual(farmsPaginatedFixture);
  });

  it('listFarms sem parâmetros: GET /farms sem query string', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue(farmsPaginatedFixture);

    await listFarms();

    expect(apiClient.get).toHaveBeenCalledWith('/farms');
  });

  it('createFarm: POST /farms com o payload', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue(farmFixture);

    const result = await createFarm({
      name: 'Fazenda Santa Rita',
      city: 'Sorriso',
      state: 'MT',
      totalAreaHectares: 1240,
      arableAreaHectares: 800,
      vegetationAreaHectares: 440,
      producerId: 'p1',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/farms', {
      name: 'Fazenda Santa Rita',
      city: 'Sorriso',
      state: 'MT',
      totalAreaHectares: 1240,
      arableAreaHectares: 800,
      vegetationAreaHectares: 440,
      producerId: 'p1',
    });
    expect(result).toEqual(farmFixture);
  });

  it('updateFarm: PATCH /farms/:id com o payload parcial', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue(farmFixture);

    const result = await updateFarm('f1', { totalAreaHectares: 1300 });

    expect(apiClient.patch).toHaveBeenCalledWith('/farms/f1', { totalAreaHectares: 1300 });
    expect(result).toEqual(farmFixture);
  });
});
