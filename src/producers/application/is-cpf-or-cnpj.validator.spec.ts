// Decorator customizado de class-validator, construído sobre o utilitário
// já testado em document.validator.spec.ts — TDD (red primeiro).

import { validate } from 'class-validator';
import { IsCpfOrCnpj } from './is-cpf-or-cnpj.validator';

class DummyDto {
  @IsCpfOrCnpj()
  document!: string;
}

describe('IsCpfOrCnpj', () => {
  it('aceita um CPF válido', async () => {
    const dto = new DummyDto();
    dto.document = '295.379.955-93';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('aceita um CNPJ alfanumérico válido', async () => {
    const dto = new DummyDto();
    dto.document = '00.000.000/E08G-12';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejeita um documento inválido', async () => {
    const dto = new DummyDto();
    dto.document = 'not-a-document';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isCpfOrCnpj');
  });
});
