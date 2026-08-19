import { BRAZILIAN_STATES } from './farm';
import type { BrazilianState } from './farm';

/**
 * Forma de um rascunho de fazenda dentro do `PropriedadesFieldset`
 * (organismo) — não é o contrato da API (`Farm`/`CreateFarmInput`, ver
 * types/farm.ts): os campos de área são `string` porque vêm direto de
 * `<input>` controlados; convertidos para `number` só na hora de validar/
 * enviar (ver validation/area.ts e store/produtoresSlice.ts). `id` ausente
 * significa fazenda nova (ainda não persistida); presente significa que
 * veio do backend ao abrir a edição de um produtor existente.
 */
export interface FarmDraft {
  id?: string;
  name: string;
  city: string;
  state: BrazilianState;
  totalAreaHectares: string;
  arableAreaHectares: string;
  vegetationAreaHectares: string;
}

export function createEmptyFarmDraft(): FarmDraft {
  return {
    name: '',
    city: '',
    state: BRAZILIAN_STATES[0],
    totalAreaHectares: '',
    arableAreaHectares: '',
    vegetationAreaHectares: '',
  };
}
