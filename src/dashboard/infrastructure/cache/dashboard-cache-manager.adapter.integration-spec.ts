// Adapter — teste de integração contra Redis real via Testcontainers (nunca
// um mock de cache, ver praticas.md#testes e 05.1-cache-dashboard.md "Se
// travar"): set seguido de get devolve o mesmo snapshot; get de chave
// ausente devolve null; TTL expira de verdade (TTL curto, em segundos).
//
// Único lugar que sabe que existe Redis por trás da DashboardCachePort — a
// instância de Cache é montada aqui exatamente como o dashboard.module.ts
// monta em produção (createCache + createKeyv apontando pro Redis real, via
// @nestjs/cache-manager/cache-manager/@keyv/redis, nunca um cliente Redis
// cru como ioredis).

import { createKeyv } from '@keyv/redis';
import { Cache, createCache } from 'cache-manager';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { buildDashboardSnapshot } from '../../test-support/dashboard-snapshot.fixture';
import { DashboardCacheManagerAdapter } from './dashboard-cache-manager.adapter';

describe('DashboardCacheManagerAdapter (integration)', () => {
  let container: StartedRedisContainer;
  let cache: Cache;
  let adapter: DashboardCacheManagerAdapter;

  beforeAll(async () => {
    container = await new RedisContainer('redis:7-alpine').start();
    cache = createCache({
      stores: [createKeyv(container.getConnectionUrl())],
    });
    adapter = new DashboardCacheManagerAdapter(cache);
  }, 120_000);

  afterAll(async () => {
    await cache.disconnect();
    await container.stop();
  });

  afterEach(async () => {
    await cache.clear();
  });

  it('get de chave inexistente devolve null', async () => {
    const result = await adapter.get();

    expect(result).toBeNull();
  });

  it('set seguido de get devolve o mesmo snapshot', async () => {
    const snapshot = buildDashboardSnapshot();

    await adapter.set(snapshot, 60);
    const result = await adapter.get();

    expect(result).toEqual(snapshot);
  });

  it('TTL expira de verdade', async () => {
    const snapshot = buildDashboardSnapshot();

    await adapter.set(snapshot, 1);
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    const result = await adapter.get();

    expect(result).toBeNull();
  }, 10_000);
});
