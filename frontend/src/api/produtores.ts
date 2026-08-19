import { apiClient } from './client';
import type { CreateProdutorInput, Produtor, UpdateProdutorInput } from '../types/produtor';
import type { PaginatedResponse } from '../types/pagination';

/**
 * Único ponto do frontend que sabe os paths `/producers` — o
 * `produtoresSlice` (via thunk) e os testes que exercitam essas operações
 * mockam este módulo, nunca `api/client.ts` nem `fetch` diretamente.
 */

export interface ListProdutoresParams {
  page?: number;
  limit?: number;
}

function toQueryString(params?: object): string {
  if (!params) {
    return '';
  }
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export function listProdutores(
  params?: ListProdutoresParams,
): Promise<PaginatedResponse<Produtor>> {
  return apiClient.get<PaginatedResponse<Produtor>>(`/producers${toQueryString(params)}`);
}

export function getProdutorById(id: string): Promise<Produtor> {
  return apiClient.get<Produtor>(`/producers/${id}`);
}

export function createProdutor(input: CreateProdutorInput): Promise<Produtor> {
  return apiClient.post<Produtor>('/producers', input);
}

export function updateProdutor(id: string, input: UpdateProdutorInput): Promise<Produtor> {
  return apiClient.patch<Produtor>(`/producers/${id}`, input);
}

export function deleteProdutor(id: string): Promise<void> {
  return apiClient.delete<void>(`/producers/${id}`);
}
