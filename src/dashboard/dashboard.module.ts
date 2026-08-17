// Liga as portas de leitura/cache aos adapters concretos via token de DI —
// único lugar do módulo que faz esse binding. Trocar de agregação/banco ou
// de store de cache = trocar só o `useClass`/`useFactory` aqui.
//
// CacheModule aponta pro Redis real via REDIS_URL (createKeyv, o mesmo
// caminho @keyv/redis+keyv usado no teste de integração do adapter — nunca
// um cliente Redis cru). ScheduleModule habilita o SchedulerRegistry usado
// pelo DashboardCacheRefreshScheduler.
//
// REDIS_URL lida direto de process.env dentro do `useFactory` (não via
// ConfigService.get()) — mesma convenção do resto do projeto (ver o
// comentário equivalente em dashboard-cache-refresh.scheduler.ts):
// `ConfigModule.forRoot()` roda de forma síncrona/estática já na importação
// do módulo, então `ConfigService.get()` não reflete um `process.env`
// sobrescrito depois disso (Testcontainers em testes). O `useFactory` em si
// só é chamado por Nest na hora de instanciar o provider (depois do
// override), então ler `process.env` diretamente aqui resolve o valor
// certo.

import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { createKeyv } from '@keyv/redis';
import { DashboardService } from './application/dashboard.service';
import { DASHBOARD_CACHE_PORT } from './domain/dashboard-cache.port';
import { DASHBOARD_READ_PORT } from './domain/dashboard.read.port';
import { DashboardCacheManagerAdapter } from './infrastructure/cache/dashboard-cache-manager.adapter';
import { DashboardCacheRefreshScheduler } from './infrastructure/cache/dashboard-cache-refresh.scheduler';
import { DashboardController } from './infrastructure/http/dashboard.controller';
import { DashboardPrismaRepository } from './infrastructure/persistence/dashboard.prisma-repository';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      useFactory: () => ({
        stores: [createKeyv(process.env.REDIS_URL)],
      }),
    }),
  ],
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
