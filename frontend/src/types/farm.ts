/**
 * Contrato do recurso `farms` do backend (ver
 * verx/src/farms/domain/farm.entity.ts e
 * verx/src/farms/domain/brazilian-state.ts, fonte da verdade). Tipo puro,
 * sem lógica.
 */

export const BRAZILIAN_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export type BrazilianState = (typeof BRAZILIAN_STATES)[number];

export interface Farm {
  id: string;
  name: string;
  city: string;
  state: BrazilianState;
  totalAreaHectares: number;
  arableAreaHectares: number;
  vegetationAreaHectares: number;
  producerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFarmInput {
  name: string;
  city: string;
  state: BrazilianState;
  totalAreaHectares: number;
  arableAreaHectares: number;
  vegetationAreaHectares: number;
  producerId: string;
}

export interface UpdateFarmInput {
  name?: string;
  city?: string;
  state?: BrazilianState;
  totalAreaHectares?: number;
  arableAreaHectares?: number;
  vegetationAreaHectares?: number;
}
