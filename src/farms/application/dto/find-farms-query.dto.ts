// Query params de GET /farms — paginação (herdada de PaginationQueryDto)
// combinada com os filtros producerId/state/city, todos opcionais e
// combináveis (ver arquitetura.md#design-de-endpoints-rest).
//
// Precisa ser UMA classe real (não uma interseção de dois tipos) para que o
// ValidationPipe global consiga resolver o metatype em tempo de execução e
// aplicar os decorators de transform (@Type) do PaginationQueryDto — uma
// interseção de tipos é apagada pelo TypeScript e não gera uma classe real.

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { BRAZILIAN_STATES } from '../../domain/brazilian-state';
import type { BrazilianState } from '../../domain/brazilian-state';

export class FindFarmsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra pelo id do producer dono da farm',
  })
  @IsOptional()
  @IsUUID()
  producerId?: string;

  @ApiPropertyOptional({ enum: BRAZILIAN_STATES })
  @IsOptional()
  @IsIn(BRAZILIAN_STATES, {
    message: 'state deve ser uma UF brasileira válida',
  })
  state?: BrazilianState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;
}
