// Indicador customizado de Redis — round-trip set/get via o `Cache` do
// @nestjs/cache-manager (o mesmo usado pelo DashboardCacheManagerAdapter,
// nunca um cliente Redis cru), já que não existe um indicador de
// cache-manager embutido no @nestjs/terminus (mesmo racional do
// PrismaHealthIndicator: indicador próprio quando o embutido não se aplica,
// ver prisma.health-indicator.ts e etapas/06-observabilidade.md passo 4.2).

import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

const HEALTH_CHECK_KEY = 'health:redis:ping';
const HEALTH_CHECK_VALUE = 'ok';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const check = this.healthIndicatorService.check(key);
    try {
      await this.cache.set(HEALTH_CHECK_KEY, HEALTH_CHECK_VALUE, 5_000);
      const value = await this.cache.get<string>(HEALTH_CHECK_KEY);
      if (value !== HEALTH_CHECK_VALUE) {
        return check.down('Redis round-trip mismatch');
      }
      return check.up();
    } catch {
      return check.down('Redis unreachable');
    }
  }
}
