// Adapter — único lugar do módulo que sabe que existe um ORM concreto por
// trás da porta. Implementa a porta, mapeia entre o tipo gerado pelo cliente
// de persistência e a entidade de domínio. Captura a violação de FK (P2003)
// no delete — causada pelo `onDelete: Restrict` de PlantedCrop.seasonId — e
// traduz para o erro de domínio SeasonReferencedError (ver
// implementacao/etapas/04-safra-cultura.md).

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Season } from '../../domain/season.entity';
import { SeasonReferencedError } from '../../domain/season-referenced.error';
import {
  SeasonCreateData,
  SeasonRepositoryPort,
  SeasonUpdateData,
} from '../../domain/season.repository.port';

interface SeasonRecord {
  id: string;
  year: number;
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  );
}

@Injectable()
export class SeasonPrismaRepository implements SeasonRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: SeasonRecord): Season {
    return new Season(record.id, record.year);
  }

  async create(data: SeasonCreateData): Promise<Season> {
    const record = await this.prisma.season.create({ data });
    return this.toDomain(record);
  }

  async findById(id: string): Promise<Season | null> {
    const record = await this.prisma.season.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByYear(year: number): Promise<Season | null> {
    const record = await this.prisma.season.findUnique({ where: { year } });
    return record ? this.toDomain(record) : null;
  }

  async update(id: string, data: SeasonUpdateData): Promise<Season> {
    const record = await this.prisma.season.update({ where: { id }, data });
    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.season.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new SeasonReferencedError(id);
      }
      throw error;
    }
  }

  async findMany(pagination: {
    limit: number;
    offset: number;
  }): Promise<{ data: Season[]; total: number }> {
    const [records, total] = await Promise.all([
      this.prisma.season.findMany({
        take: pagination.limit,
        skip: pagination.offset,
        orderBy: { year: 'asc' },
      }),
      this.prisma.season.count(),
    ]);
    return { data: records.map((record) => this.toDomain(record)), total };
  }
}
