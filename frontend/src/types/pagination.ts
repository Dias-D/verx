/**
 * Envelope de toda listagem paginada do backend (ver
 * arquitetura.md#design-de-endpoints-rest) — `{ data, meta }`. Genérico,
 * compartilhado por qualquer recurso paginado (produtores, fazendas...).
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
