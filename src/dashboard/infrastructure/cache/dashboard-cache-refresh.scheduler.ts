// Scheduler — mantém o cache do dashboard fresco por fora do tráfego (nunca
// disparado por requisição, ver arquitetura.md#cache-do-dashboard): busca o
// snapshot via a mesma DashboardReadPort já usada pelo DashboardService (no
// fallback de cold start) e escreve no cache via DashboardCachePort.set().
// Roda uma vez no bootstrap da aplicação (onApplicationBootstrap) para não
// deixar o cache vazio no primeiro request real, e depois periodicamente via
// @nestjs/schedule (SchedulerRegistry), no intervalo configurado por
// DASHBOARD_CACHE_TTL_SECONDS — nunca hardcoded, a mesma env var que define
// o TTL do valor em cache também define a cadência do refresh.
//
// TTL lido direto de process.env (não via ConfigService.get()) — mesma
// convenção já usada em outros pontos do projeto (PrismaService lendo
// DATABASE_URL via prisma/schema.prisma#env(), main.ts lendo PORT, ver
// praticas.md): ConfigModule.forRoot() roda de forma síncrona/estática já na
// importação do módulo, capturando um snapshot de process.env àquele
// momento — em testes que sobrescrevem process.env em runtime
// (Testcontainers, ver *.integration-spec.ts/*.e2e-spec.ts), esse snapshot
// fica desatualizado e ConfigService.get() devolveria o valor antigo.
// Leitura direta de process.env dentro do construtor (resolvida só quando o
// provider é de fato instanciado, depois do override) reflete o valor real
// usado.
//
// Logging estruturado via nestjs-pino (nunca console.log/console.error, ver
// 05.1-cache-dashboard.md passo 5.2): início/fim de cada refresh, com
// duração e sucesso/falha — nunca o snapshot inteiro (mesmo não carregando
// CPF/CNPJ, só metadados do evento vão pro log). Falha no refresh nunca
// derruba o processo: fica registrada e a próxima rodada tenta de novo; o
// DashboardService cobre o intervalo com o fallback síncrono de cold start.

import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { DASHBOARD_CACHE_PORT } from '../../domain/dashboard-cache.port';
import type { DashboardCachePort } from '../../domain/dashboard-cache.port';
import { DASHBOARD_READ_PORT } from '../../domain/dashboard.read.port';
import type { DashboardReadPort } from '../../domain/dashboard.read.port';
import type { DashboardSnapshot } from '../../domain/dashboard-snapshot';

const DASHBOARD_CACHE_REFRESH_INTERVAL_NAME = 'dashboard-cache-refresh';
const DEFAULT_TTL_SECONDS = 300;

@Injectable()
export class DashboardCacheRefreshScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly ttlSeconds: number;

  constructor(
    @Inject(DASHBOARD_READ_PORT)
    private readonly readPort: DashboardReadPort,
    @Inject(DASHBOARD_CACHE_PORT)
    private readonly cachePort: DashboardCachePort,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly logger: Logger,
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

  // Sem isso, o setInterval registrado em onApplicationBootstrap sobrevive a
  // app.close() (Nest não limpa timers próprios automaticamente) — mantém o
  // event loop vivo indefinidamente, o que segura o processo/worker aberto
  // depois do teste (ou do processo real) terminar. Descoberto via um teste
  // e2e real: rodar a suíte completa fazia 5 suítes SEM relação com
  // Dashboard/Redis estourarem timeout de beforeAll (120s) ao tentar subir
  // seus próprios containers Postgres via Testcontainers — o worker do Jest
  // que já tinha executado a suíte do Dashboard nunca ficava ocioso de
  // verdade por causa deste interval solto, disputando recursos com as
  // próximas suítes escaladas nesse mesmo worker.
  onModuleDestroy(): void {
    if (
      this.schedulerRegistry.doesExist(
        'interval',
        DASHBOARD_CACHE_REFRESH_INTERVAL_NAME,
      )
    ) {
      this.schedulerRegistry.deleteInterval(
        DASHBOARD_CACHE_REFRESH_INTERVAL_NAME,
      );
    }
  }

  async refresh(): Promise<void> {
    const startedAt = Date.now();
    try {
      const snapshot = await this.readPort.getSnapshot();
      // calculatedAt marca o momento do CÁLCULO (agora, logo depois da
      // agregação real), não o momento em que um cliente eventualmente vai
      // ler esse valor do cache — ver decisoes-pendentes.md#1.
      const snapshotWithCalculatedAt: DashboardSnapshot = {
        ...snapshot,
        calculatedAt: new Date(),
      };
      await this.cachePort.set(snapshotWithCalculatedAt, this.ttlSeconds);
      this.logger.log(
        {
          event: DASHBOARD_CACHE_REFRESH_INTERVAL_NAME,
          success: true,
          durationMs: Date.now() - startedAt,
        },
        'Dashboard cache refreshed',
      );
    } catch (error: unknown) {
      this.logger.error(
        {
          event: DASHBOARD_CACHE_REFRESH_INTERVAL_NAME,
          success: false,
          durationMs: Date.now() - startedAt,
          err: error,
        },
        'Dashboard cache refresh failed',
      );
    }
  }
}
