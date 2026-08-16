// DTO do corpo de POST /farms/:farmId/planted-crops — aceita um ARRAY de
// associações num único corpo (não uma por vez, ver
// arquitetura.md#design-de-endpoints-rest). A checagem de duplicata dentro
// do próprio lote é responsabilidade do Service (validação em memória,
// antes de tocar o banco), não deste DTO.

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, ValidateNested } from 'class-validator';
import { CreatePlantedCropDto } from './create-planted-crop.dto';

export class CreatePlantedCropBatchDto {
  @ApiProperty({ type: [CreatePlantedCropDto] })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreatePlantedCropDto)
  items: CreatePlantedCropDto[];
}
