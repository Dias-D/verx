// Teste de integração do RedisCacheModule — prova a causa raiz real
// encontrada ao fechar o gate da etapa 5.1: sem um `connectionTimeout`
// configurado, @keyv/redis nunca desiste de conectar (reconnectStrategy
// default faz backoff indefinido, nunca retorna `false`/`Error`), então
// qualquer operação de cache/health contra um Redis inalcançável FICA PRESA
// PARA SEMPRE — não é um erro, é um hang indefinido. Isso travava
// onApplicationBootstrap() do DashboardCacheRefreshScheduler (o primeiro
// refresh roda no bootstrap, awaited antes de "Nest application successfully
// started"), o que por sua vez travava app.init() de QUALQUER suíte e2e que
// não configura seu próprio REDIS_URL de Testcontainers (produtores, farms,
// planted-crops, seasons, crops) — herdando um REDIS_URL de .env que aponta
// pra um Redis que pode não estar rodando. O mesmo hang existiria em
// produção se o Redis caísse durante o boot da aplicação.
//
// A correção (`connectionTimeout` + `throwOnErrors: true`, ambas opções
// oficiais e documentadas de @keyv/redis — nunca um cliente Redis cru, ver
// arquitetura.md#cache-do-dashboard) faz a operação FALHAR RÁPIDO (rejeita)
// em vez de travar. O DashboardCacheRefreshScheduler.refresh() já captura
// esse erro (try/catch existente, ver dashboard-cache-refresh.scheduler.ts)
// e loga sem derrubar o processo — o bootstrap segue adiante normalmente.

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { RedisCacheModule } from './redis-cache.module';

describe('RedisCacheModule (integration) — resiliência contra Redis inalcançável', () => {
  const originalRedisUrl = process.env.REDIS_URL;

  afterEach(() => {
    process.env.REDIS_URL = originalRedisUrl;
  });

  it('operações no CACHE_MANAGER falham rápido (nunca travam) quando o Redis configurado está inalcançável', async () => {
    // Porta local sem nada escutando — simula exatamente o cenário real
    // encontrado (.env com REDIS_URL apontando pra um Redis que não está
    // de pé no momento em que a aplicação sobe).
    process.env.REDIS_URL = 'redis://127.0.0.1:6399';

    const moduleRef = await Test.createTestingModule({
      imports: [RedisCacheModule],
    }).compile();

    const cache = moduleRef.get<Cache>(CACHE_MANAGER);

    const startedAt = Date.now();
    await expect(cache.set('smoke-test-key', 'value')).rejects.toThrow();
    // Sem o connectionTimeout, esse `await` acima nunca resolveria nem
    // rejeitaria — o jest.setTimeout deste `it` (abaixo) é a rede de
    // segurança que faria o teste falhar por timeout, não passar por
    // engano. Aqui também travamos um teto de sanidade bem mais curto que
    // o timeout do teste, provando que a rejeição é rápida de verdade.
    expect(Date.now() - startedAt).toBeLessThan(8_000);

    await moduleRef.close();
  }, 15_000);
});
