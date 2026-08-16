// Value object puro — formato de retorno do dashboard. Sem dependência de
// Prisma/SQL aqui: só a camada de infrastructure (o adapter) sabe que existe
// agregação no banco por trás disso (ver arquitetura.md#modelo-de-dados e
// implementacao/etapas/05-dashboard.md).

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
}
