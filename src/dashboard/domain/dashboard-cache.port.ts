// Porta de cache — mesmo racional da porta de leitura (ver
// dashboard.read.port.ts): infraestrutura trocável, o domínio/aplicação só
// conhece esta interface, nunca o Redis/cache-manager por trás dela (só o
// adapter concreto em infrastructure/cache sabe disso; o hook
// guard-hexagonal-boundary.py bloqueia qualquer referência a Prisma aqui,
// e o mesmo princípio vale por analogia para qualquer detalhe de
// infraestrutura concreto, incluindo Redis).
//
// get() devolve null quando não há valor em cache (chave ausente ou TTL
// expirado) — nunca lança erro nesse caso, é um estado esperado (cold start
// ou intervalo entre expirar e o próximo refresh do scheduler).

import { DashboardSnapshot } from './dashboard-snapshot';

export interface DashboardCachePort {
  get(): Promise<DashboardSnapshot | null>;
  set(data: DashboardSnapshot, ttlSeconds: number): Promise<void>;
}

// Token de DI — dashboard.module.ts usa isto para ligar a porta ao adapter concreto.
export const DASHBOARD_CACHE_PORT = Symbol('DashboardCachePort');
