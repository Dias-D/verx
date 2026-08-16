// Regra de negócio central do enunciado — soma de área agricultável + área
// de vegetação não pode ultrapassar a área total. Função pura, testada
// isoladamente antes de ser usada pelo DTO (validador customizado) e pelo
// Service (revalidação no PATCH), ver praticas.md#onde-cada-regra-de-negócio-vive.

import { validateAreas } from './area-rule';

describe('validateAreas', () => {
  it('permite quando a soma de arable + vegetation é igual ao total', () => {
    expect(validateAreas(100, 60, 40)).toBe(true);
  });

  it('permite quando a soma de arable + vegetation é menor que o total', () => {
    expect(validateAreas(100, 50, 30)).toBe(true);
  });

  it('rejeita quando a soma ultrapassa o total em um centavo', () => {
    expect(validateAreas(100, 60, 40.01)).toBe(false);
  });

  it('rejeita área total negativa', () => {
    expect(validateAreas(-1, 0, 0)).toBe(false);
  });

  it('rejeita área agricultável negativa', () => {
    expect(validateAreas(100, -1, 50)).toBe(false);
  });

  it('rejeita área de vegetação negativa', () => {
    expect(validateAreas(100, 50, -1)).toBe(false);
  });
});
