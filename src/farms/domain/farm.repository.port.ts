// Porta de repositório — interface que domain/application dependem. Nenhuma
// implementação aqui, nenhuma referência a ORM (só infrastructure/ conhece
// o detalhe de persistência, ver arquitetura.md).

import { BrazilianState } from './brazilian-state';
import { Farm } from './farm.entity';

export interface FarmCreateData {
  name: string;
  city: string;
  state: BrazilianState;
  totalAreaHectares: number;
  arableAreaHectares: number;
  vegetationAreaHectares: number;
  producerId: string;
}

export interface FarmUpdateData {
  name?: string;
  city?: string;
  state?: BrazilianState;
  totalAreaHectares?: number;
  arableAreaHectares?: number;
  vegetationAreaHectares?: number;
}

export interface FarmFilters {
  producerId?: string;
  state?: BrazilianState;
  city?: string;
}

export interface FarmRepositoryPort {
  create(data: FarmCreateData): Promise<Farm>;
  findById(id: string): Promise<Farm | null>;
  update(id: string, data: FarmUpdateData): Promise<Farm>;
  delete(id: string): Promise<void>;
  findMany(
    filters: FarmFilters,
    pagination: { limit: number; offset: number },
  ): Promise<{ data: Farm[]; total: number }>;
}

// Token de DI — farms.module.ts usa isto para ligar a porta ao adapter concreto.
export const FARM_REPOSITORY = Symbol('FarmRepositoryPort');
