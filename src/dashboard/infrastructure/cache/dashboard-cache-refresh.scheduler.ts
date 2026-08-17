// Scheduler — mantém o cache do dashboard fresco por fora do tráfego (nunca
// disparado por requisição, ver arquitetura.md#cache-do-dashboard): busca o
// snapshot via a mesma DashboardReadPort já usada pelo DashboardService e
// escreve no cache via DashboardCachePort.set(). Roda uma vez no bootstrap
// da aplicação (onApplicationBootstrap) para não deixar o cache vazio no
// primeiro request real, e depois periodicamente via @nestjs/schedule
// (SchedulerRegistry), no intervalo configurado por
// DASHBOARD_CACHE_TTL_SECONDS — nunca hardcoded, a mesma env var que define
// o TTL do valor em cache também define a cadência do refresh.
//
// TTL lido direto de process.env (não via ConfigService.get()) — mesma
// convenção já usada em outros pontos do projeto (PrismaService lendo
// DATABASE_URL, main.ts lendo PORT, ver praticas.md): ConfigModule.forRoot é
// um método estático que roda de forma síncrona já na importação do módulo,
// capturando um snapshot de process.env àquele momento — em testes que
// sobrescrevem process.env em runtime (Testcontainers, ver
// *.integration-spec.ts/*.e2e-spec.ts), esse snapshot fica desatualizado e
// ConfigService.get() devolve o valor antigo. Leitura direta de
// `process.env` dentro do construtor (resolvida só quando o provider é de
// fato instanciado, depois do override) reflete o valor real usado.

import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { DASHBOARD_CACHE_PORT } from '../../domain/dashboard-cache.port';
import type { DashboardCachePort } from '../../domain/dashboard-cache.port';
import { DASHBOARD_READ_PORT } from '../../domain/dashboard.read.port';
import type { DashboardReadPort } from '../../domain/dashboard.read.port';

const DASHBOARD_CACHE_REFRESH_INTERVAL_NAME = 'dashboard-cache-refresh';
const DEFAULT_TTL_SECONDS = 300;

@Injectable()
export class DashboardCacheRefreshScheduler implements OnApplicationBootstrap {
  private readonly ttlSeconds: number;

  constructor(
    @Inject(DASHBOARD_READ_PORT)
    private readonly readPort: DashboardReadPort,
    @Inject(DASHBOARD_CACHE_PORT)
    private readonly cachePort: DashboardCachePort,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    const configuredTtl = Number(process.env.DASHBOARD_CACHE_TTL_SECONDS);
    this.ttlSeconds =
      Number.isFinite(configuredTtl) && configuredTtl > 0
        ? configuredTtl
        : DEFAULT_TTL_SECONDS;
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
