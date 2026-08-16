// DTO de criação — valida a FORMA do input na borda (class-validator). A
// regra de negócio central (soma de área) é validada aqui via @IsValidArea
// para o caso comum de create (os três campos chegam juntos), mas o Service
// é a dona autoritativa da regra (revalida no PATCH mesclando com o estado
// persistido) — ver praticas.md#onde-cada-regra-de-negócio-vive.

import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BRAZILIAN_STATES } from '../../domain/brazilian-state';
import type { BrazilianState } from '../../domain/brazilian-state';
import { IsValidArea } from '../is-valid-area.validator';

export class CreateFarmDto {
  @ApiProperty({ example: 'Fazenda Boa Vista' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Ribeirão Preto' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ enum: BRAZILIAN_STATES, example: 'SP' })
  @IsIn(BRAZILIAN_STATES, {
    message: 'state deve ser uma UF brasileira válida',
  })
  state: BrazilianState;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  totalAreaHectares: number;

  @ApiProperty({ example: 60 })
  @IsNumber()
  @Min(0)
  arableAreaHectares: number;

  @ApiProperty({ example: 40 })
  @IsNumber()
  @Min(0)
  @IsValidArea({
    message:
      'a soma de arableAreaHectares e vegetationAreaHectares não pode ultrapassar totalAreaHectares',
  })
  vegetationAreaHectares: number;

  @ApiProperty({ example: '2f4b6c1a-1234-4d1b-8b1a-0f0f0f0f0f0f' })
  @IsUUID()
  producerId: string;
}
