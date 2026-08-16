// Adapter — único lugar do módulo que sabe que existe um ORM concreto por
// trás da porta. Implementa a porta, mapeia entre o tipo gerado pelo
// cliente de persistência e a entidade de domínio.
//
// Duas responsabilidades específicas deste adapter (ver arquitetura.md e
// tecnologias.md): (1) converter as três colunas `Decimal` para `number`
// via `.toNumber()` antes de montar a entidade — o domínio nunca vê
// `Decimal`; (2) capturar a violação de FK do producerId (Prisma `P2003`) e
// traduzir para o erro de domínio `ProducerNotFoundError`, já que o Farm
// não depende do repositório de Producer para checar existência.

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { BrazilianState } from '../../domain/brazilian-state';
import { Farm } from '../../domain/farm.entity';
import {
  FarmCreateData,
  FarmFilters,
  FarmRepositoryPort,
  FarmUpdateData,
} from '../../domain/farm.repository.port';
import { ProducerNotFoundError } from '../../domain/producer-not-found.error';

interface FarmRecord {
  id: string;
  name: string;
  city: string;
  state: string;
  totalAreaHectares: Prisma.Decimal;
  arableAreaHectares: Prisma.Decimal;
  vegetationAreaHectares: Prisma.Decimal;
  producerId: string;
  createdAt: Date;
  updatedAt: Date;
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  );
}

@Injectable()
export class FarmPrismaRepository implements FarmRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: FarmRecord): Farm {
    return new Farm(
      record.id,
      record.name,
      record.city,
      record.state as BrazilianState,
      record.totalAreaHectares.toNumber(),
      record.arableAreaHectares.toNumber(),
      record.vegetationAreaHectares.toNumber(),
      record.producerId,
      record.createdAt,
      record.updatedAt,
    );
  }

  async create(data: FarmCreateData): Promise<Farm> {
    try {
      const record = await this.prisma.farm.create({ data });
      return this.toDomain(record);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ProducerNotFoundError(data.producerId);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Farm | null> {
    const record = await this.prisma.farm.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async update(id: string, data: FarmUpdateData): Promise<Farm> {
    try {
      const record = await this.prisma.farm.update({ where: { id }, data });
      return this.toDomain(record);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ProducerNotFoundError(id);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.farm.delete({ where: { id } });
  }

  async findMany(
    filters: FarmFilters,
    pagination: { limit: number; offset: number },
  ): Promise<{ data: Farm[]; total: number }> {
    const where: Prisma.FarmWhereInput = {
      ...(filters.producerId ? { producerId: filters.producerId } : {}),
      ...(filters.state ? { state: filters.state } : {}),
      ...(filters.city ? { city: filters.city } : {}),
    };
    const [records, total] = await Promise.all([
      this.prisma.farm.findMany({
        where,
        take: pagination.limit,
        skip: pagination.offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.farm.count({ where }),
    ]);
    return { data: records.map((record) => this.toDomain(record)), total };
  }
}
