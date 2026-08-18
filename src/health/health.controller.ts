// Adapter de entrada — controller fino: só delega pro HealthCheckService
// (terminus) com os indicadores de Postgres e Redis (desde a etapa 5.1).

import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health-indicator';
import { RedisHealthIndicator } from './redis.health-indicator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
    private readonly redisHealthIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary:
      'Healthcheck — conectividade com o banco (Postgres) e o cache (Redis)',
  })
  @ApiOkResponse({ description: 'API, banco de dados e cache saudáveis.' })
  check(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () => this.prismaHealthIndicator.isHealthy('database'),
      () => this.redisHealthIndicator.isHealthy('redis'),
    ]);
  }
}
