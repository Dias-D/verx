// Módulo global que expõe o CACHE_MANAGER (@nestjs/cache-manager) apontando
// pro Redis real (store @keyv/redis+keyv, nunca um cliente Redis cru como
// ioredis, ver arquitetura.md#cache-do-dashboard-stale-while-revalidate-com-refresh-proativo).
// Único lugar que sabe da existência do Redis fora do adapter/indicador que
// o consomem — DashboardCacheManagerAdapter (cache do dashboard) e
// RedisHealthIndicator (GET /health) compartilham a mesma conexão, ao invés
// de cada um montar a sua.
//
// REDIS_URL lida direto de process.env dentro do `useFactory` (não via
// ConfigService.get()) — mesma convenção já usada no resto do projeto (ver
// o comentário equivalente em dashboard-cache-refresh.scheduler.ts):
// ConfigModule.forRoot() roda de forma síncrona/estática já na importação
// do módulo, então ConfigService.get() não reflete um process.env
// sobrescrito depois disso (Testcontainers em testes de
// integração/e2e). O `useFactory` só é chamado por Nest na hora de
// instanciar o provider (depois do override), então ler process.env
// diretamente aqui resolve o valor certo.
//
// REDIS_CONNECTION_TIMEOUT_MS + throwOnErrors: sem isso, @keyv/redis nunca
// desiste de conectar (reconnectStrategy default faz backoff indefinido,
// nunca retorna false/Error) — qualquer operação contra um Redis
// inalcançável FICA PRESA PARA SEMPRE, não falha. Isso travava
// DashboardCacheRefreshScheduler.onApplicationBootstrap() (primeiro refresh,
// awaited antes de "Nest application successfully started"), que por sua
// vez travava app.init() de qualquer suíte e2e que não configura seu
// próprio REDIS_URL de Testcontainers (produtores, farms, planted-crops,
// seasons, crops — herdando um REDIS_URL de .env apontando pra um Redis que
// pode não estar de pé). O mesmo hang existiria em produção se o Redis
// caísse durante o boot. Ver
// src/shared/cache/redis-cache.module.integration-spec.ts (prova o hang sem
// essas opções e a rejeição rápida com elas) e
// 05.1-cache-dashboard.md#se-travar.

import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

const REDIS_CONNECTION_TIMEOUT_MS = 5_000;

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        stores: [
          createKeyv(process.env.REDIS_URL, {
            connectionTimeout: REDIS_CONNECTION_TIMEOUT_MS,
            throwOnErrors: true,
          }),
        ],
      }),
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
