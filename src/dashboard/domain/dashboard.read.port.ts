// Porta de leitura — a porta já devolve o formato final (DashboardSnapshot);
// só o adapter concreto (infrastructure/persistence) sabe que existe
// Prisma/SQL por trás da agregação (ver arquitetura.md e
// implementacao/etapas/05-dashboard.md). Nenhuma implementação aqui, nenhuma
// referência a ORM (o hook guard-hexagonal-boundary.py bloqueia isso
// automaticamente se acontecer).

import { DashboardSnapshot } from './dashboard-snapshot';

export interface DashboardReadPort {
  getSnapshot(): Promise<DashboardSnapshot>;
}

// Token de DI — dashboard.module.ts usa isto para ligar a porta ao adapter concreto.
export const DASHBOARD_READ_PORT = Symbol('DashboardReadPort');
