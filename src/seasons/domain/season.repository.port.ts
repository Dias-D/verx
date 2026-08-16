// Porta de repositório — interface que domain/application dependem. Nenhuma
// implementação aqui, nenhuma referência a Prisma/ORM (só infrastructure/
// conhece o Prisma, ver arquitetura.md).

import { Season } from './season.entity';

export interface SeasonCreateData {
  year: number;
}

export interface SeasonUpdateData {
  year?: number;
}

export interface SeasonRepositoryPort {
  create(data: SeasonCreateData): Promise<Season>;
  findById(id: string): Promise<Season | null>;
  findByYear(year: number): Promise<Season | null>;
  update(id: string, data: SeasonUpdateData): Promise<Season>;
  delete(id: string): Promise<void>;
  findMany(pagination: {
    limit: number;
    offset: number;
  }): Promise<{ data: Season[]; total: number }>;
}

// Token de DI — seasons.module.ts usa isto para ligar a porta ao adapter concreto.
export const SEASON_REPOSITORY = Symbol('SeasonRepositoryPort');
