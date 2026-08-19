import { API_URL } from '../config/env';

/**
 * Erro lançado por qualquer chamada de `apiClient` cuja resposta HTTP não
 * seja 2xx. `status` e `body` ficam disponíveis para quem consumir decidir
 * como exibir (ex.: formulário de produtor mostrando `message` do backend).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Erro ${response.status} ao chamar ${path}`;
    let body: unknown;
    try {
      body = await response.json();
      if (body && typeof body === 'object' && 'message' in body) {
        const bodyMessage = (body as { message: unknown }).message;
        if (typeof bodyMessage === 'string') {
          message = bodyMessage;
        }
      }
    } catch {
      // resposta de erro sem corpo JSON — mantém a mensagem padrão acima
    }
    throw new ApiError(response.status, message, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * Único lugar do frontend que fala fetch. Toda chamada HTTP passa por aqui —
 * as funções tipadas por endpoint (`api/dashboard.ts`, `api/produtores.ts`,
 * criadas nas etapas seguintes) chamam `apiClient`, nunca `fetch` direto.
 */
export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
