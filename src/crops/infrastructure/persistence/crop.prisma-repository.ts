// Adapter — único lugar do módulo que sabe que existe um ORM concreto por
// trás da porta. Implementa a porta, mapeia entre o tipo gerado pelo cliente
// de persistência e a entidade de domínio. Captura a violação de FK (P2003)
// no delete — causada pelo `onDelete: Restrict` de PlantedCrop.cropId — e
// traduz para o erro de domínio CropReferencedError (ver
// implementacao/etapas/04-safra-cultura.md).

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Crop } from '../../domain/crop.entity';
import { CropReferencedError } from '../../domain/crop-referenced.error';
import {
  CropCreateData,
  CropRepositoryPort,
  CropUpdateData,
} from '../../domain/crop.repository.port';

interface CropRecord {
  id: string;
  name: string;
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  );
}

@Injectable()
export class CropPrismaRepository implements CropRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: CropRecord): Crop {
    return new Crop(record.id, record.name);
  }

  async create(data: CropCreateData): Promise<Crop> {
    const record = await this.prisma.crop.create({ data });
    return this.toDomain(record);
  }

  async findById(id: string): Promise<Crop | null> {
    const record = await this.prisma.crop.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByName(name: string): Promise<Crop | null> {
    const record = await this.prisma.crop.findUnique({ where: { name } });
    return record ? this.toDomain(record) : null;
  }

  async update(id: string, data: CropUpdateData): Promise<Crop> {
    const record = await this.prisma.crop.update({ where: { id }, data });
    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.crop.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new CropReferencedError(id);
      }
      throw error;
    }
  }

  async findMany(pagination: {
    limit: number;
    offset: number;
  }): Promise<{ data: Crop[]; total: number }> {
    const [records, total] = await Promise.all([
      this.prisma.crop.findMany({
        take: pagination.limit,
        skip: pagination.offset,
        orderBy: { name: 'asc' },
      }),
      this.prisma.crop.count(),
    ]);
    return { data: records.map((record) => this.toDomain(record)), total };
  }
}
