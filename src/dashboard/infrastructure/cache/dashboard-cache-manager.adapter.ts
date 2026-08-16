// Adapter — único lugar do módulo que sabe que existe Redis por trás da
// DashboardCachePort. Usa o `Cache` do @nestjs/cache-manager (store real:
// @keyv/redis + keyv, montado em dashboard.module.ts), nunca um cliente
// Redis cru (ioredis) — ver arquitetura.md#cache-do-dashboard.

import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { DashboardCachePort } from '../../domain/dashboard-cache.port';
import { DashboardSnapshot } from '../../domain/dashboard-snapshot';

// Chave única — só existe um snapshot de dashboard em cache por vez.
const DASHBOARD_SNAPSHOT_CACHE_KEY = 'dashboard:snapshot';

@Injectable()
export class DashboardCacheManagerAdapter implements DashboardCachePort {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get(): Promise<DashboardSnapshot | null> {
    const value = await this.cache.get<DashboardSnapshot>(
      DASHBOARD_SNAPSHOT_CACHE_KEY,
    );
    return value ?? null;
  }

  async set(data: DashboardSnapshot, ttlSeconds: number): Promise<void> {
    await this.cache.set(DASHBOARD_SNAPSHOT_CACHE_KEY, data, ttlSeconds * 1000);
  }
}
