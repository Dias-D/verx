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
  // Horário em que o agregado foi CALCULADO (não o horário do fetch/leitura)
  // — ver decisoes-pendentes.md#1. Gravado só pelo
  // DashboardCacheRefreshScheduler, no momento em que chama a agregação,
  // antes de escrever no cache (infrastructure/cache/dashboard-cache-refresh.scheduler.ts#refresh).
  // Opcional porque a porta de leitura (DashboardReadPort/DashboardPrismaRepository)
  // continua devolvendo só os agregados, sem esse campo — o fallback síncrono
  // de cold start (DashboardService#getSnapshot) não o carimba (nenhuma
  // lógica nova de leitura, decisão explícita).
  calculatedAt?: Date;
}
