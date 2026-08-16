// DTO de criação — valida a FORMA do input na borda (class-validator). A
// unicidade do year (regra de negócio que depende do estado persistido) é
// responsabilidade do Service, não deste DTO (ver praticas.md).

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class CreateSeasonDto {
  @ApiProperty({ example: 2021, minimum: 1900, maximum: 2100 })
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;
}
