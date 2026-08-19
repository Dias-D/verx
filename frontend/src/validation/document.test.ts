import { isValidDocument, normalizeDocument } from './document';

/**
 * Espelha src/producers/application/document.validator.spec.ts do backend —
 * mesma lógica (biblioteca cpf-cnpj-validator), reescrita como app separado
 * (não é possível importar o código do backend direto, ver
 * resources/docs/implementacao/etapas-frontend/02-crud-produtor.md).
 */
describe('normalizeDocument', () => {
  it('remove pontuação (pontos, barra, hífen) e deixa maiúsculo', () => {
    expect(normalizeDocument('295.379.955-93')).toBe('29537995593');
    expect(normalizeDocument('12.345.678/0001-90')).toBe('12345678000190');
    expect(normalizeDocument('00.000.000/e08g-12')).toBe('00000000E08G12');
  });

  it('string vazia devolve string vazia', () => {
    expect(normalizeDocument('')).toBe('');
  });
});

describe('isValidDocument', () => {
  it('aceita um CPF numérico válido (com ou sem pontuação)', () => {
    expect(isValidDocument('295.379.955-93')).toBe(true);
    expect(isValidDocument('29537995593')).toBe(true);
  });

  it('rejeita um CPF com dígito verificador inválido', () => {
    expect(isValidDocument('123.456.789-99')).toBe(false);
  });

  it('aceita um CNPJ numérico válido', () => {
    expect(isValidDocument('11.222.333/0001-81')).toBe(true);
  });

  it('aceita o CNPJ alfanumérico real da Nota Técnica RFB 49/2024', () => {
    expect(isValidDocument('00.000.000/E08G-12')).toBe(true);
  });

  it('rejeita comprimento que não é nem CPF (11) nem CNPJ (14)', () => {
    expect(isValidDocument('123')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(isValidDocument('')).toBe(false);
  });
});
