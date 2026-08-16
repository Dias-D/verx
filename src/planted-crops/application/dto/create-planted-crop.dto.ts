// DTO de item — valida a FORMA do input na borda (class-validator). A
// checagem de existência de seasonId/cropId (regra que depende do estado
// persistido) é responsabilidade do Service/adapter, não deste DTO (ver
// praticas.md#onde-cada-regra-de-negócio-vive).

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePlantedCropDto {
  @ApiProperty({ example: '2f4b6c1a-1234-4d1b-8b1a-0f0f0f0f0f0f' })
  @IsUUID()
  seasonId: string;

  @ApiProperty({ example: '3a5c7d2b-2345-4e2c-9c2b-1a1a1a1a1a1a' })
  @IsUUID()
  cropId: string;
}
