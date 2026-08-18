// Liga as portas (leitura e cache) aos adapters concretos via token de DI —
// único lugar do módulo que faz esse binding. Trocar de agregação/banco ou
// de store de cache = trocar só o `useClass` aqui.
//
// ScheduleModule.forRoot() habilita o SchedulerRegistry usado pelo
// DashboardCacheRefreshScheduler; o CACHE_MANAGER (Redis) vem do
// RedisCacheModule global (ver src/shared/cache/redis-cache.module.ts),
// compartilhado com o RedisHealthIndicator do GET /health — nenhuma conexão
// duplicada.

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisCacheModule } from '../shared/cache/redis-cache.module';
import { DashboardService } from './application/dashboard.service';
import { DASHBOARD_CACHE_PORT } from './domain/dashboard-cache.port';
import { DASHBOARD_READ_PORT } from './domain/dashboard.read.port';
import { DashboardCacheManagerAdapter } from './infrastructure/cache/dashboard-cache-manager.adapter';
import { DashboardCacheRefreshScheduler } from './infrastructure/cache/dashboard-cache-refresh.scheduler';
import { DashboardController } from './infrastructure/http/dashboard.controller';
import { DashboardPrismaRepository } from './infrastructure/persistence/dashboard.prisma-repository';

@Module({
  imports: [ScheduleModule.forRoot(), RedisCacheModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    { provide: DASHBOARD_READ_PORT, useClass: DashboardPrismaRepository },
    { provide: DASHBOARD_CACHE_PORT, useClass: DashboardCacheManagerAdapter },
    DashboardCacheRefreshScheduler,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
