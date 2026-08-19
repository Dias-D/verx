import {
  createProdutor,
  deleteProdutor,
  getProdutorById,
  listProdutores,
  updateProdutor,
} from './produtores';
import { apiClient } from './client';
import { produtorFixture, produtoresPaginatedFixture } from '../mocks/produtores';

jest.mock('./client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

describe('api/produtores', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('listProdutores: GET /producers, com paginação por query string', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue(produtoresPaginatedFixture);

    const result = await listProdutores({ page: 1, limit: 100 });

    expect(apiClient.get).toHaveBeenCalledWith('/producers?page=1&limit=100');
    expect(result).toEqual(produtoresPaginatedFixture);
  });

  it('listProdutores sem parâmetros: GET /producers sem query string', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue(produtoresPaginatedFixture);

    await listProdutores();

    expect(apiClient.get).toHaveBeenCalledWith('/producers');
  });

  it('getProdutorById: GET /producers/:id', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue(produtorFixture);

    const result = await getProdutorById('p1');

    expect(apiClient.get).toHaveBeenCalledWith('/producers/p1');
    expect(result).toEqual(produtorFixture);
  });

  it('createProdutor: POST /producers com o payload', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue(produtorFixture);

    const result = await createProdutor({ name: 'José', document: '29537995593' });

    expect(apiClient.post).toHaveBeenCalledWith('/producers', {
      name: 'José',
      document: '29537995593',
    });
    expect(result).toEqual(produtorFixture);
  });

  it('updateProdutor: PATCH /producers/:id com o payload parcial', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue(produtorFixture);

    const result = await updateProdutor('p1', { name: 'Novo nome' });

    expect(apiClient.patch).toHaveBeenCalledWith('/producers/p1', { name: 'Novo nome' });
    expect(result).toEqual(produtorFixture);
  });

  it('deleteProdutor: DELETE /producers/:id', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue(undefined);

    await deleteProdutor('p1');

    expect(apiClient.delete).toHaveBeenCalledWith('/producers/p1');
  });
});
