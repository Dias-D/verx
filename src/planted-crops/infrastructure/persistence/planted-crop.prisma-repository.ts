// Adapter — único lugar do módulo que sabe que existe um ORM concreto por
// trás da porta. Implementa a porta, mapeia entre o tipo gerado pelo
// cliente de persistência e a entidade de domínio.
//
// Responsabilidades específicas deste adapter (ver arquitetura.md e
// implementacao/etapas/03-cultura-plantada.md): (1) `createMany` roda
// genuinamente dentro de `prisma.$transaction` — se qualquer item do lote
// falhar (unicidade composta ou FK), nada do lote é persistido; (2) captura
// a violação de unicidade composta (P2002) e traduz para `ConflictException`
// diretamente (não precisa de um erro de domínio intermediário, o 409 já é
// a resposta final); (3) captura violação de FK (P2003) e traduz para o
// erro de domínio correspondente (Farm/Season/Crop NotFoundError), que o
// controller mapeia para 404; (4) captura "record not found" (P2025) no
// delete e traduz para `PlantedCropNotFoundError`.

import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CropNotFoundError } from '../../domain/crop-not-found.error';
import { FarmNotFoundError } from '../../domain/farm-not-found.error';
import { PlantedCrop } from '../../domain/planted-crop.entity';
import { PlantedCropNotFoundError } from '../../domain/planted-crop-not-found.error';
import {
  PlantedCropCreateItem,
  PlantedCropRepositoryPort,
} from '../../domain/planted-crop.repository.port';
import { SeasonNotFoundError } from '../../domain/season-not-found.error';

interface PlantedCropRecord {
  id: string;
  farmId: string;
  seasonId: string;
  cropId: string;
  createdAt: Date;
  updatedAt: Date;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  );
}

function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

// P2003 traz o nome da constraint de FK que violou em `meta.constraint`
// (Prisma 6.19, driver Postgres nativo) — versões/drivers mais antigos usam
// `meta.field_name` (ex.: "planted_crops_seasonId_fkey (index)"). Checa os
// dois para descobrir qual das três FKs falhou e lançar o erro de domínio
// certo.
function foreignKeyField(error: Prisma.PrismaClientKnownRequestError): string {
  const constraint = error.meta?.constraint;
  const fieldName = error.meta?.field_name;
  if (typeof constraint === 'string') {
    return constraint;
  }
  return typeof fieldName === 'string' ? fieldName : '';
}

@Injectable()
export class PlantedCropPrismaRepository implements PlantedCropRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: PlantedCropRecord): PlantedCrop {
    return new PlantedCrop(
      record.id,
      record.farmId,
      record.seasonId,
      record.cropId,
      record.createdAt,
      record.updatedAt,
    );
  }

  async createMany(
    farmId: string,
    items: PlantedCropCreateItem[],
  ): Promise<PlantedCrop[]> {
    let currentItem: PlantedCropCreateItem | undefined;
    try {
      const records = await this.prisma.$transaction(async (tx) => {
        const created: PlantedCropRecord[] = [];
        for (const item of items) {
          currentItem = item;
          const record = await tx.plantedCrop.create({
            data: { farmId, seasonId: item.seasonId, cropId: item.cropId },
          });
          created.push(record);
        }
        return created;
      });
      return records.map((record) => this.toDomain(record));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'uma ou mais combinações de safra e cultura já estão associadas a esta fazenda',
        );
      }
      if (isForeignKeyViolation(error)) {
        const field = foreignKeyField(
          error as Prisma.PrismaClientKnownRequestError,
        );
        if (field.includes('seasonId')) {
          throw new SeasonNotFoundError(currentItem?.seasonId ?? '');
        }
        if (field.includes('cropId')) {
          throw new CropNotFoundError(currentItem?.cropId ?? '');
        }
        throw new FarmNotFoundError(farmId);
      }
      throw error;
    }
  }

  async findByFarm(
    farmId: string,
    pagination: { limit: number; offset: number },
  ): Promise<{ data: PlantedCrop[]; total: number }> {
    const where: Prisma.PlantedCropWhereInput = { farmId };
    const [records, total] = await Promise.all([
      this.prisma.plantedCrop.findMany({
        where,
        take: pagination.limit,
        skip: pagination.offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plantedCrop.count({ where }),
    ]);
    return { data: records.map((record) => this.toDomain(record)), total };
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.plantedCrop.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new PlantedCropNotFoundError(id);
      }
      throw error;
    }
  }
}
