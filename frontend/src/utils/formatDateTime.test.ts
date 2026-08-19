import { formatCalculatedAt, formatTimeOnly } from './formatDateTime';

describe('formatCalculatedAt', () => {
  it('formata um calculatedAt ISO em horário de Brasília, prefixado', () => {
    expect(formatCalculatedAt('2026-08-19T21:14:00.000Z')).toBe(
      'Dados calculados às 18:14',
    );
  });

  it('retorna um texto de estado de cálculo quando calculatedAt está ausente (cold-start do cache)', () => {
    expect(formatCalculatedAt(undefined)).toBe('Calculando dados...');
  });
});

describe('formatTimeOnly', () => {
  it('devolve só o horário (HH:mm) em fuso de Brasília', () => {
    expect(formatTimeOnly('2026-08-19T21:14:00.000Z')).toBe('18:14');
  });

  it('devolve string vazia quando calculatedAt está ausente ou inválido', () => {
    expect(formatTimeOnly(undefined)).toBe('');
    expect(formatTimeOnly('não é uma data')).toBe('');
  });
});
