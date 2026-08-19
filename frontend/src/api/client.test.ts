import { apiClient, ApiError } from './client';

describe('apiClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('faz GET contra a baseURL configurada e devolve o corpo JSON', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ hello: 'world' }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await apiClient.get<{ hello: string }>('/producers');

    expect(result).toEqual({ hello: 'world' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/producers',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('lança ApiError com a mensagem do corpo quando a resposta não é ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Produtor não encontrado' }),
    }) as unknown as typeof fetch;

    await expect(apiClient.get('/producers/1')).rejects.toBeInstanceOf(ApiError);
    await expect(apiClient.get('/producers/1')).rejects.toMatchObject({
      status: 404,
      message: 'Produtor não encontrado',
    });
  });

  it('devolve undefined em respostas 204 sem corpo', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('não deveria chamar json() em uma resposta 204');
      },
    }) as unknown as typeof fetch;

    const result = await apiClient.delete('/producers/1');

    expect(result).toBeUndefined();
  });

  it('envia POST com o corpo serializado em JSON e o método correto', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: '1' }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    await apiClient.post('/producers', { name: 'Produtor X' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/producers',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Produtor X' }),
      }),
    );
  });
});
