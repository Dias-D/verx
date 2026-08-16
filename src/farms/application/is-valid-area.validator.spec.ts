// Decorator customizado de class-validator, construído sobre a função pura
// já testada em area-rule.spec.ts — TDD (red primeiro). Valida a regra de
// negócio central do enunciado direto no DTO (a forma), a regra em si
// (dona autoritativa) vive no Service — ver praticas.md.

import { validate } from 'class-validator';
import { IsValidArea } from './is-valid-area.validator';

class DummyDto {
  totalAreaHectares!: number;

  arableAreaHectares!: number;

  @IsValidArea()
  vegetationAreaHectares!: number;
}

describe('IsValidArea', () => {
  it('aceita quando a soma de arable + vegetation é igual ao total', async () => {
    const dto = new DummyDto();
    dto.totalAreaHectares = 100;
    dto.arableAreaHectares = 60;
    dto.vegetationAreaHectares = 40;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejeita quando a soma ultrapassa o total', async () => {
    const dto = new DummyDto();
    dto.totalAreaHectares = 100;
    dto.arableAreaHectares = 60;
    dto.vegetationAreaHectares = 40.01;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isValidArea');
  });

  it('não reporta erro quando algum campo de área ainda não chegou (parcial)', async () => {
    const dto = new DummyDto();
    dto.vegetationAreaHectares = 40;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
