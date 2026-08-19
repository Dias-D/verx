import type { FarmDraft } from '../types/farmDraft';

/**
 * Uma fazenda é considerada "em branco" quando nenhum campo foi preenchido —
 * o usuário nunca tentou criá-la (ver o subtítulo do wireframe congelado:
 * "Cadastre o produtor e, opcionalmente, suas propriedades"). Fazendas em
 * branco são ignoradas na validação e no envio (ver store/produtoresSlice.ts).
 */
export function isBlankFarmDraft(draft: FarmDraft): boolean {
  return (
    draft.name.trim() === '' &&
    draft.city.trim() === '' &&
    draft.totalAreaHectares.trim() === '' &&
    draft.arableAreaHectares.trim() === '' &&
    draft.vegetationAreaHectares.trim() === ''
  );
}
