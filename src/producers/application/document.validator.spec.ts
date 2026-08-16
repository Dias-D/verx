// Testes do validador/normalizador de documento (CPF/CNPJ) — TDD (red primeiro).
// Casos de borda obrigatórios: ver praticas.md#validação-de-cpfcnpj.

import { isValidDocument, normalizeDocument } from './document.validator';

describe('document.validator', () => {
  describe('normalizeDocument', () => {
    it('remove a pontuação de um CPF, mantendo só os dígitos', () => {
      expect(normalizeDocument('295.379.955-93')).toBe('29537995593');
    });

    it('remove a pontuação de um CNPJ alfanumérico, mantendo as letras', () => {
      expect(normalizeDocument('12.ABC.345/01DE-35')).toBe('12ABC34501DE35');
    });

    it('normaliza letras minúsculas do CNPJ alfanumérico para maiúsculas', () => {
      expect(normalizeDocument('12.abc.345/01de-35')).toBe('12ABC34501DE35');
    });

    it('retorna string vazia para entrada vazia', () => {
      expect(normalizeDocument('')).toBe('');
    });
  });

  describe('isValidDocument', () => {
    it('aceita um CPF válido', () => {
      expect(isValidDocument('295.379.955-93')).toBe(true);
    });

    it('aceita um CNPJ numérico tradicional válido', () => {
      expect(isValidDocument('54.550.752/0001-55')).toBe(true);
    });

    it('aceita um CNPJ alfanumérico válido (Nota Técnica RFB 49/2024)', () => {
      expect(isValidDocument('00.000.000/E08G-12')).toBe(true);
    });

    it('rejeita um documento em formato inválido', () => {
      expect(isValidDocument('123.456')).toBe(false);
    });

    it('rejeita uma sequência repetida de CPF', () => {
      expect(isValidDocument('111.111.111-11')).toBe(false);
    });

    it('rejeita campo vazio', () => {
      expect(isValidDocument('')).toBe(false);
    });
  });
});
