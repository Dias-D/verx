// Utilitário de validação/normalização de documento (CPF/CNPJ), usado tanto
// pelo decorator @IsCpfOrCnpj() (DTOs) quanto pelo Service. Usa a biblioteca
// cpf-cnpj-validator (suporta CNPJ alfanumérico, Nota Técnica RFB 49/2024) —
// nunca reimplementa o algoritmo Módulo 11 à mão (ver praticas.md).

import { cnpj, cpf } from 'cpf-cnpj-validator';

const PUNCTUATION_PATTERN = /[.\-/]/g;

/**
 * Remove só a formatação (pontos, barra, hífen) de um CPF/CNPJ, mantendo os
 * caracteres alfanuméricos — nunca reduz a dígitos, porque o CNPJ é
 * alfanumérico desde jul/2026 (ver arquitetura.md).
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
