import { isBlankFarmDraft } from './isBlankFarmDraft';
import { createEmptyFarmDraft } from '../types/farmDraft';

describe('isBlankFarmDraft', () => {
  it('um FarmDraft recém-criado (nenhum campo preenchido) é considerado em branco', () => {
    expect(isBlankFarmDraft(createEmptyFarmDraft())).toBe(true);
  });

  it('deixa de ser em branco assim que qualquer campo é preenchido', () => {
    expect(isBlankFarmDraft({ ...createEmptyFarmDraft(), name: 'Fazenda Santa Rita' })).toBe(
      false,
    );
    expect(isBlankFarmDraft({ ...createEmptyFarmDraft(), city: 'Sorriso' })).toBe(false);
    expect(
      isBlankFarmDraft({ ...createEmptyFarmDraft(), totalAreaHectares: '100' }),
    ).toBe(false);
  });

  it('ignora espaços em branco puros como se estivesse vazio', () => {
    expect(isBlankFarmDraft({ ...createEmptyFarmDraft(), name: '   ' })).toBe(true);
  });
});
