// Porta de repositório — interface que domain/application dependem. Nenhuma
// implementação aqui, nenhuma referência a Prisma/ORM (só infrastructure/
// conhece o Prisma, ver arquitetura.md).

import { Crop } from './crop.entity';

export interface CropCreateData {
  name: string;
}

export interface CropUpdateData {
  name?: string;
}

export interface CropRepositoryPort {
  create(data: CropCreateData): Promise<Crop>;
  findById(id: string): Promise<Crop | null>;
  findByName(name: string): Promise<Crop | null>;
  update(id: string, data: CropUpdateData): Promise<Crop>;
  delete(id: string): Promise<void>;
  findMany(pagination: {
    limit: number;
    offset: number;
  }): Promise<{ data: Crop[]; total: number }>;
}

// Token de DI — crops.module.ts usa isto para ligar a porta ao adapter concreto.
export const CROP_REPOSITORY = Symbol('CropRepositoryPort');
