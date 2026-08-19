// Espelha src/producers/application/document.validator.ts do backend — não
// é possível importar o código do backend direto (app separado), então esta
// é uma reescrita própria em TypeScript, usando a MESMA biblioteca
// (cpf-cnpj-validator, cobre CPF, CNPJ numérico e o CNPJ alfanumérico real da
// Nota Técnica RFB 49/2024) para nunca reimplementar o algoritmo Módulo 11 à
// mão (ver resources/docs/implementacao/etapas-frontend/02-crud-produtor.md).

import { cnpj, cpf } from 'cpf-cnpj-validator';

const PUNCTUATION_PATTERN = /[.\-/]/g;

/**
 * Remove só a formatação (pontos, barra, hífen) de um CPF/CNPJ, mantendo os
 * caracteres alfanuméricos — nunca reduz a dígitos, porque o CNPJ é
 * alfanumérico desde a Nota Técnica RFB 49/2024.
 */
export function normalizeDocument(rawDocument: string): string {
  if (!rawDocument) {
    return '';
  }
  return rawDocument.replace(PUNCTUATION_PATTERN, '').toUpperCase();
}

/**
 * Valida um documento como CPF (11 posições) ou CNPJ (14 posições, numérico
 * ou alfanumérico) após normalização.
 */
export function isValidDocument(rawDocument: string): boolean {
  if (!rawDocument) {
    return false;
  }

  const normalized = normalizeDocument(rawDocument);

  if (normalized.length === 11) {
    return cpf.isValid(normalized, true);
  }

  if (normalized.length === 14) {
    return cnpj.isValid(normalized, true);
  }

  return false;
}
