// Caso de uso (application) — depende SÓ da porta (injetada por token de
// DI), nunca de detalhes concretos de infraestrutura (persistência)
// diretamente.

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { validateAreas } from './area-rule';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { Farm } from '../domain/farm.entity';
import { FARM_REPOSITORY, FarmFilters } from '../domain/farm.repository.port';
import type { FarmRepositoryPort } from '../domain/farm.repository.port';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

const AREA_ERROR_MESSAGE =
  'a soma de arableAreaHectares e vegetationAreaHectares não pode ultrapassar totalAreaHectares';

@Injectable()
export class FarmsService {
  constructor(
    @Inject(FARM_REPOSITORY)
    private readonly repository: FarmRepositoryPort,
  ) {}

  async create(dto: CreateFarmDto): Promise<Farm> {
    // Regra de negócio central do enunciado: dona autoritativa é o Service,
    // não só o DTO (ver praticas.md#onde-cada-regra-de-negócio-vive). A
    // existência do producerId não é checada aqui — é resolvida pela
    // constraint de FK do banco, traduzida pelo adapter em
    // ProducerNotFoundError (ver arquitetura.md).
    if (
      !validateAreas(
        dto.totalAreaHectares,
        dto.arableAreaHectares,
        dto.vegetationAreaHectares,
      )
    ) {
      throw new BadRequestException(AREA_ERROR_MESSAGE);
    }
    return this.repository.create({
      name: dto.name,
      city: dto.city,
      state: dto.state,
      totalAreaHectares: dto.totalAreaHectares,
      arableAreaHectares: dto.arableAreaHectares,
      vegetationAreaHectares: dto.vegetationAreaHectares,
      producerId: dto.producerId,
    });
  }

  async findById(id: string): Promise<Farm> {
    const farm = await this.repository.findById(id);
    if (!farm) {
      throw new NotFoundException(`Farm with id ${id} not found`);
    }
    return farm;
  }

  async update(id: string, dto: UpdateFarmDto): Promise<Farm> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Farm with id ${id} not found`);
    }

    // O DTO sozinho não enxerga o que já está no banco — mescla o estado
    // persistido com o payload parcial do PATCH antes de revalidar a regra
    // de área (ver praticas.md#onde-cada-regra-de-negócio-vive).
    const merged = {
      totalAreaHectares: dto.totalAreaHectares ?? existing.totalAreaHectares,
      arableAreaHectares: dto.arableAreaHectares ?? existing.arableAreaHectares,
      vegetationAreaHectares:
        dto.vegetationAreaHectares ?? existing.vegetationAreaHectares,
    };
    if (
      !validateAreas(
        merged.totalAreaHectares,
        merged.arableAreaHectares,
        merged.vegetationAreaHectares,
      )
    ) {
      throw new BadRequestException(AREA_ERROR_MESSAGE);
    }

    return this.repository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Farm with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async findMany(
    filters: FarmFilters,
    query: { page: number; limit: number },
  ): Promise<PaginatedResult<Farm>> {
    const offset = (query.page - 1) * query.limit;
    const { data, total } = await this.repository.findMany(filters, {
      limit: query.limit,
      offset,
    });
    return {
      data,
      meta: { total, page: query.page, limit: query.limit },
    };
  }
}
