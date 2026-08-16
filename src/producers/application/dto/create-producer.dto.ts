// DTO de criação — valida a FORMA do input na borda (class-validator). A
// unicidade do documento (regra de negócio que depende do estado persistido)
// é responsabilidade do Service, não deste DTO (ver praticas.md).

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { normalizeDocument } from '../document.validator';
import { IsCpfOrCnpj } from '../is-cpf-or-cnpj.validator';

export class CreateProducerDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '295.379.955-93',
    description: 'CPF ou CNPJ (numérico ou alfanumérico, com ou sem pontuação)',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeDocument(value) : value,
  )
  @IsCpfOrCnpj({ message: 'document deve ser um CPF ou CNPJ válido' })
  document: string;
}
