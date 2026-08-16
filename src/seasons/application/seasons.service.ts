// Caso de uso (application) — depende SÓ da porta (injetada por token de
// DI), nunca de detalhes concretos de infraestrutura (persistência)
// diretamente.

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Season } from '../domain/season.entity';
import { SeasonReferencedError } from '../domain/season-referenced.error';
import { SEASON_REPOSITORY } from '../domain/season.repository.port';
import type { SeasonRepositoryPort } from '../domain/season.repository.port';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

@Injectable()
export class SeasonsService {
  constructor(
    @Inject(SEASON_REPOSITORY)
    private readonly repository: SeasonRepositoryPort,
  ) {}

  async create(dto: CreateSeasonDto): Promise<Season> {
    // Regra de negócio: unicidade do year. O DTO só valida a FORMA; só o
    // Service enxerga o estado persistido (ver
    // praticas.md#onde-cada-regra-de-negócio-vive). A defesa final é a
    // constraint única no banco, aplicada pelo adapter de persistência.
    const existing = await this.repository.findByYear(dto.year);
    if (existing) {
      throw new ConflictException('A season with this year already exists');
    }
    return this.repository.create({ year: dto.year });
  }

  async findById(id: string): Promise<Season> {
    const season = await this.repository.findById(id);
    if (!season) {
      throw new NotFoundException(`Season with id ${id} not found`);
    }
    return season;
  }

  async update(id: string, dto: UpdateSeasonDto): Promise<Season> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Season with id ${id} not found`);
    }
    return this.repository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Season with id ${id} not found`);
    }
    try {
      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof SeasonReferencedError) {
        throw new ConflictException(
          'This season is linked to a planted crop and cannot be deleted',
        );
      }
      throw error;
    }
  }

  async findMany(query: {
    page: number;
    limit: number;
  }): Promise<PaginatedResult<Season>> {
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
