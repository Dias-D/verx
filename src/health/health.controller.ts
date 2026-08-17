// Adapter de entrada — controller fino: só delega pro HealthCheckService
// (terminus) com o indicador do Postgres. Nesta etapa (6) só checa Postgres
// — o indicador de Redis entra na etapa 5.1, quando o serviço existir.

import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health-indicator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Healthcheck — conectividade com o banco (Postgres)',
  })
  @ApiOkResponse({ description: 'API e banco de dados saudáveis.' })
  check(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () => this.prismaHealthIndicator.isHealthy('database'),
    ]);
  }
}
