// Adapter de entrada — controller fino: só HTTP + delegação pro Service.
// Nenhuma regra de negócio aqui. Endpoint único e composto (KISS — ver
// arquitetura.md#design-de-endpoints-rest) em vez de quatro granulares.

import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DashboardSnapshot } from '../../domain/dashboard-snapshot';
import { DashboardService } from '../../application/dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @ApiOkResponse({
    description:
      'Total de fazendas, total de hectares e os três gráficos de pizza (por estado, por cultura, por uso do solo).',
  })
  getSnapshot(): Promise<DashboardSnapshot> {
    return this.service.getSnapshot();
  }
}
