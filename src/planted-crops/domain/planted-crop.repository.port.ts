// Porta de repositório — interface que domain/application dependem. Nenhuma
// implementação aqui, nenhuma referência a ORM (só infrastructure/ conhece
// o detalhe de persistência, ver arquitetura.md).

import { PlantedCrop } from './planted-crop.entity';

export interface PlantedCropCreateItem {
  seasonId: string;
  cropId: string;
}

export interface PlantedCropRepositoryPort {
  // Transacional: ou os N itens do lote são persistidos, ou nenhum é (ver
  // implementacao/etapas/03-cultura-plantada.md, passo 5.1).
  createMany(
    farmId: string,
    items: PlantedCropCreateItem[],
  ): Promise<PlantedCrop[]>;
  findByFarm(
    farmId: string,
    pagination: { limit: number; offset: number },
  ): Promise<{ data: PlantedCrop[]; total: number }>;
  delete(id: string): Promise<void>;
}

// Token de DI — planted-crops.module.ts usa isto para ligar a porta ao adapter concreto.
export const PLANTED_CROP_REPOSITORY = Symbol('PlantedCropRepositoryPort');
