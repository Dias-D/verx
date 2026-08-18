// Adapter — único lugar do módulo que sabe que existe Redis por trás da
// DashboardCachePort. Usa o `Cache` do @nestjs/cache-manager (store real:
// @keyv/redis + keyv, montado em dashboard.module.ts), nunca um cliente
// Redis cru (ioredis) — ver arquitetura.md#cache-do-dashboard.
//
// Logging estruturado via nestjs-pino (nunca console.log/console.error, ver
// 05.1-cache-dashboard.md passo 5.2): só metadados de evento (chave lógica,
// sucesso/falha) — o snapshot do dashboard não carrega CPF/CNPJ, mas mesmo
// assim nunca é logado por inteiro aqui, só o resultado da operação.

import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { Logger } from 'nestjs-pino';
import { DashboardCachePort } from '../../domain/dashboard-cache.port';
import { DashboardSnapshot } from '../../domain/dashboard-snapshot';

// Chave única — só existe um snapshot de dashboard em cache por vez.
const DASHBOARD_SNAPSHOT_CACHE_KEY = 'dashboard:snapshot';

@Injectable()
export class DashboardCacheManagerAdapter implements DashboardCachePort {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly logger?: Logger,
  ) {}

  async get(): Promise<DashboardSnapshot | null> {
    try {
      const value = await this.cache.get<DashboardSnapshot>(
        DASHBOARD_SNAPSHOT_CACHE_KEY,
      );
      return value ?? null;
    } catch (error: unknown) {
      this.logger?.error(
        { err: error, key: DASHBOARD_SNAPSHOT_CACHE_KEY },
        'Dashboard cache read failed',
      );
      throw error;
    }
  }

  async set(data: DashboardSnapshot, ttlSeconds: number): Promise<void> {
    try {
      await this.cache.set(
        DASHBOARD_SNAPSHOT_CACHE_KEY,
        data,
        ttlSeconds * 1000,
      );
    } catch (error: unknown) {
      this.logger?.error(
        { err: error, key: DASHBOARD_SNAPSHOT_CACHE_KEY, ttlSeconds },
        'Dashboard cache write failed',
      );
      throw error;
    }
  }
}
