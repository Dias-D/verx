// Caso de uso (application) — depende SÓ da porta (injetada por token de
// DI), nunca de detalhes concretos de infraestrutura (persistência)
// diretamente.

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Crop } from '../domain/crop.entity';
import { CropReferencedError } from '../domain/crop-referenced.error';
import { CROP_REPOSITORY } from '../domain/crop.repository.port';
import type { CropRepositoryPort } from '../domain/crop.repository.port';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

@Injectable()
export class CropsService {
  constructor(
    @Inject(CROP_REPOSITORY)
    private readonly repository: CropRepositoryPort,
  ) {}

  async create(dto: CreateCropDto): Promise<Crop> {
    // Regra de negócio: unicidade do name. O DTO só valida a FORMA; só o
    // Service enxerga o estado persistido (ver
    // praticas.md#onde-cada-regra-de-negócio-vive). A defesa final é a
    // constraint única no banco, aplicada pelo adapter de persistência.
    const existing = await this.repository.findByName(dto.name);
    if (existing) {
      throw new ConflictException('A crop with this name already exists');
    }
    return this.repository.create({ name: dto.name });
  }

  async findById(id: string): Promise<Crop> {
    const crop = await this.repository.findById(id);
    if (!crop) {
      throw new NotFoundException(`Crop with id ${id} not found`);
    }
    return crop;
  }

  async update(id: string, dto: UpdateCropDto): Promise<Crop> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Crop with id ${id} not found`);
    }
    return this.repository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Crop with id ${id} not found`);
    }
    try {
      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof CropReferencedError) {
        throw new ConflictException(
          'This crop is linked to a planted crop and cannot be deleted',
        );
      }
      throw error;
    }
  }

  async findMany(query: {
    page: number;
    limit: number;
  }): Promise<PaginatedResult<Crop>> {
    const offset = (query.page - 1) * query.limit;
    const { data, total } = await this.repository.findMany({
      limit: query.limit,
      offset,
    });
    return {
      data,
      meta: { total, page: query.page, limit: query.limit },
    };
  }
}
