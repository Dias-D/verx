// DTO de criação — valida a FORMA do input na borda (class-validator). A
// unicidade do name (regra de negócio que depende do estado persistido) é
// responsabilidade do Service, não deste DTO (ver praticas.md).

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCropDto {
  @ApiProperty({ example: 'Soja' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
