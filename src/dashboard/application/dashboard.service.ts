// Caso de uso (application) — depende SÓ das portas (injetadas por token de
// DI), nunca de um detalhe concreto de infraestrutura/ORM/cache
// diretamente. Regra de negócio do cache stale-while-revalidate mora aqui
// (ver arquitetura.md#cache-do-dashboard): lê o cache primeiro e devolve
// direto — nunca recalcula na hora da requisição, exceto em cold start
// (cache ainda vazio, o DashboardCacheRefreshScheduler ainda não rodou pela
// primeira vez), caso em que cai num fallback síncrono via a porta de
// leitura.

import { Inject, Injectable } from '@nestjs/common';
import { DASHBOARD_CACHE_PORT } from '../domain/dashboard-cache.port';
import type { DashboardCachePort } from '../domain/dashboard-cache.port';
import { DashboardSnapshot } from '../domain/dashboard-snapshot';
import { DASHBOARD_READ_PORT } from '../domain/dashboard.read.port';
import type { DashboardReadPort } from '../domain/dashboard.read.port';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DASHBOARD_READ_PORT)
    private readonly readPort: DashboardReadPort,
    @Inject(DASHBOARD_CACHE_PORT)
    private readonly cachePort: DashboardCachePort,
  ) {}

  async getSnapshot(): Promise<DashboardSnapshot> {
    const cached = await this.cachePort.get();
    if (cached) {
      return cached;
    }

    // Cold start: nenhum valor em cache ainda (o refresh agendado ainda não
    // rodou pela primeira vez) — único caso em que calculamos na hora.
    return this.readPort.getSnapshot();
  }
}
