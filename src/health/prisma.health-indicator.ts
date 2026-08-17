// Indicador customizado (SELECT 1 direto via PrismaService), em vez do
// PrismaHealthIndicator embutido do @nestjs/terminus — aquele tenta
// `$runCommandRaw` (API do driver Mongo) antes de cair para SQL, o que não
// se aplica ao client Postgres deste projeto (ver
// etapas/06-observabilidade.md passo 4.2, opção documentada explicitamente
// como alternativa válida).

import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const check = this.healthIndicatorService.check(key);
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return check.up();
    } catch {
      return check.down('Postgres unreachable');
    }
  }
}
