// Caso de uso (application) — depende SÓ das portas (injetadas por token de
// DI), nunca de um detalhe concreto de infraestrutura/ORM/cache
// diretamente. Regra de negócio do cache stale-while-revalidate mora aqui
// (ver arquitetura.md#cache-do-dashboard-stale-while-revalidate-com-refresh-proativo):
// lê o cache primeiro e devolve direto — nunca recalcula na hora da
// requisição — exceto em cold start (cache ainda vazio, o
// DashboardCacheRefreshScheduler ainda não rodou pela primeira vez), caso em
// que cai num fallback síncrono via a porta de leitura.
//
// Log de "cache miss" (nestjs-pino, Logger injetável globalmente via
// LoggerModule — ver shared/logger/logger.module.ts): evento distinto do log
// do scheduler (dashboard-cache-refresh.scheduler.ts#refresh), usado na
// etapa 8 (teste de carga) como prova, via log estruturado, de que a
// agregação real por request só acontece em cold start — nunca em cache
// hit, mesmo sob tráfego concorrente sustentado.

import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
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
    private readonly logger: Logger,
  ) {}

  async getSnapshot(): Promise<DashboardSnapshot> {
    const cached = await this.cachePort.get();
    if (cached) {
      return cached;
    }

    // Cold start: nenhum valor em cache ainda (o refresh agendado ainda não
    // rodou pela primeira vez, ou o cache expirou sem um refresh ainda
    // rodar) — único caso em que calculamos na hora.
    this.logger.log(
      { event: 'dashboard-snapshot-cache-miss' },
      'Dashboard snapshot cache miss — falling back to real aggregation',
    );
    return this.readPort.getSnapshot();
  }
}
