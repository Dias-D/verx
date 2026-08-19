import { apiClient } from './client';
import type { CreateFarmInput, Farm, UpdateFarmInput } from '../types/farm';
import type { PaginatedResponse } from '../types/pagination';

/**
 * Único ponto do frontend que sabe os paths `/farms` — usado pelo
 * `produtoresSlice` para orquestrar o "fieldset de propriedades" dentro do
 * formulário de produtor (ver PropriedadesFieldset). Só as três operações
 * que a etapa F2 precisa (list/create/update) — `getById`/`delete` de farm
 * isolada ficam para a etapa F3 (CRUD de propriedade tem tela própria), ver
 * resources/docs/implementacao/etapas-frontend/02-crud-produtor.md.
 */

export interface ListFarmsParams {
  producerId?: string;
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

export function listFarms(params?: ListFarmsParams): Promise<PaginatedResponse<Farm>> {
  return apiClient.get<PaginatedResponse<Farm>>(`/farms${toQueryString(params)}`);
}

export function createFarm(input: CreateFarmInput): Promise<Farm> {
  return apiClient.post<Farm>('/farms', input);
}

export function updateFarm(id: string, input: UpdateFarmInput): Promise<Farm> {
  return apiClient.patch<Farm>(`/farms/${id}`, input);
}
