import { validateAreas } from './area';

/**
 * Espelha src/farms/application/area-rule.spec.ts do backend — mesma regra
 * (soma de área agricultável + vegetação não pode ultrapassar a área
 * total), reescrita como app separado.
 */
describe('validateAreas', () => {
  it('aceita quando a soma é igual à área total', () => {
    expect(validateAreas(1000, 600, 400)).toBe(true);
  });

  it('aceita quando a soma é menor que a área total', () => {
    expect(validateAreas(1000, 500, 300)).toBe(true);
  });

  it('rejeita quando a soma ultrapassa a área total', () => {
    expect(validateAreas(1000, 700, 500)).toBe(false);
  });

  it('rejeita qualquer área negativa', () => {
    expect(validateAreas(-1, 10, 10)).toBe(false);
    expect(validateAreas(100, -10, 10)).toBe(false);
    expect(validateAreas(100, 10, -10)).toBe(false);
  });
});
