// Scheduler — mantém o cache do dashboard fresco por fora do tráfego (nunca
// disparado por requisição, ver arquitetura.md#cache-do-dashboard): busca o
// snapshot via a mesma DashboardReadPort já usada pelo DashboardService e
// escreve no cache via DashboardCachePort.set(). Roda uma vez no bootstrap
// da aplicação (onApplicationBootstrap) para não deixar o cache vazio no
// primeiro request real, e depois periodicamente via @nestjs/schedule
// (SchedulerRegistry), no intervalo configurado por
// DASHBOARD_CACHE_TTL_SECONDS — nunca hardcoded, a mesma env var que define
// o TTL do valor em cache também define a cadência do refresh.

import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { DASHBOARD_CACHE_PORT } from '../../domain/dashboard-cache.port';
import type { DashboardCachePort } from '../../domain/dashboard-cache.port';
import { DASHBOARD_READ_PORT } from '../../domain/dashboard.read.port';
import type { DashboardReadPort } from '../../domain/dashboard.read.port';

const DASHBOARD_CACHE_REFRESH_INTERVAL_NAME = 'dashboard-cache-refresh';

@Injectable()
export class DashboardCacheRefreshScheduler implements OnApplicationBootstrap {
  private readonly ttlSeconds: number;

  constructor(
    @Inject(DASHBOARD_READ_PORT)
    private readonly readPort: DashboardReadPort,
    @Inject(DASHBOARD_CACHE_PORT)
    private readonly cachePort: DashboardCachePort,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.ttlSeconds = this.configService.get<number>(
      'DASHBOARD_CACHE_TTL_SECONDS',
      300,
    );
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.refresh();

    const interval = setInterval(() => {
      void this.refresh();
    }, this.ttlSeconds * 1000);
    this.schedulerRegistry.addInterval(
      DASHBOARD_CACHE_REFRESH_INTERVAL_NAME,
      interval,
    );
  }

  async refresh(): Promise<void> {
    const snapshot = await this.readPort.getSnapshot();
    await this.cachePort.set(snapshot, this.ttlSeconds);
  }
}
