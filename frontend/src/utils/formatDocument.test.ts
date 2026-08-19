import { formatDocument } from './formatDocument';

describe('formatDocument', () => {
  it('formata um CPF (11 posições) como ###.###.###-##', () => {
    expect(formatDocument('29537995593')).toBe('295.379.955-93');
  });

  it('formata um CNPJ numérico (14 posições) como ##.###.###/####-##', () => {
    expect(formatDocument('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('formata um CNPJ alfanumérico (14 posições) na mesma máscara posicional', () => {
    expect(formatDocument('00000000E08G12')).toBe('00.000.000/E08G-12');
  });

  it('documento com comprimento inesperado é devolvido como veio', () => {
    expect(formatDocument('123')).toBe('123');
  });
});
