/**
 * Contrato do payload de `GET /dashboard` (ver
 * verx/src/dashboard/domain/dashboard-snapshot.ts, fonte da verdade no
 * backend). Tipo puro, sem lógica — mesmo tratamento do value object
 * espelhado no backend, sem teste dedicado (nada a exercitar).
 */

export type LandUseType = 'arable' | 'vegetation';

export interface DashboardStateCount {
  state: string;
  count: number;
}

export interface DashboardCropCount {
  crop: string;
  count: number;
}

export interface DashboardLandUseHectares {
  type: LandUseType;
  hectares: number;
}

export interface DashboardSnapshot {
  totalFarms: number;
  totalHectares: number;
  byState: DashboardStateCount[];
  byCrop: DashboardCropCount[];
  byLandUse: DashboardLandUseHectares[];
  /**
   * Horário em que o agregado foi CALCULADO (não o horário do fetch) — ISO
   * 8601, serializado pelo NestJS a partir do `Date` do backend.
   *
   * Opcional: o backend só carimba esse campo no caminho normal (cache hit,
   * a esmagadora maioria do tráfego, gravado pelo
   * DashboardCacheRefreshScheduler). Fica ausente na rara janela de
   * cold-start real do cache (Redis indisponível/vazio, fallback síncrono
   * do DashboardService) — ver decisoes-pendentes.md#1. A UI trata a
   * ausência como um estado real, não como erro (ver
   * src/utils/formatDateTime.ts).
   */
  calculatedAt?: string;
}
