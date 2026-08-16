// Caso de uso (application) — depende SÓ da porta (injetada por token de
// DI), nunca de detalhes concretos de infraestrutura (persistência)
// diretamente.

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PlantedCrop } from '../domain/planted-crop.entity';
import {
  PLANTED_CROP_REPOSITORY,
  PlantedCropCreateItem,
} from '../domain/planted-crop.repository.port';
import type { PlantedCropRepositoryPort } from '../domain/planted-crop.repository.port';
import { CreatePlantedCropBatchDto } from './dto/create-planted-crop-batch.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

@Injectable()
export class PlantedCropsService {
  constructor(
    @Inject(PLANTED_CROP_REPOSITORY)
    private readonly repository: PlantedCropRepositoryPort,
  ) {}

  async createMany(
    farmId: string,
    dto: CreatePlantedCropBatchDto,
  ): Promise<PlantedCrop[]> {
    // Regra de negócio: duplicata dentro do próprio lote é rejeitada em
    // memória, antes de abrir qualquer transação (ver
    // praticas.md#onde-cada-regra-de-negócio-vive). farmId/seasonId/cropId
    // inexistentes não são checados aqui — são resolvidos pelas constraints
    // de FK do banco, traduzidas pelo adapter em erros de domínio
    // propagados até o controller (ver
    // implementacao/etapas/03-cultura-plantada.md).
    this.assertNoDuplicatesInBatch(dto.items);
    return this.repository.createMany(farmId, dto.items);
  }

  async findByFarm(
    farmId: string,
    query: { page: number; limit: number },
  ): Promise<PaginatedResult<PlantedCrop>> {
    const offset = (query.page - 1) * query.limit;
    const { data, total } = await this.repository.findByFarm(farmId, {
      limit: query.limit,
      offset,
    });
    return {
      data,
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private assertNoDuplicatesInBatch(items: PlantedCropCreateItem[]): void {
    const seen = new Set<string>();
    for (const item of items) {
      const key = `${item.seasonId}:${item.cropId}`;
      if (seen.has(key)) {
        throw new BadRequestException(
          `o item seasonId=${item.seasonId}, cropId=${item.cropId} está duplicado no lote enviado`,
        );
      }
      seen.add(key);
    }
  }
}
