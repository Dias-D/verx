// Adapter — único lugar do módulo que sabe que existe um ORM concreto por
// trás da porta. Implementa a porta, mapeia entre o tipo gerado pelo cliente
// de persistência e a entidade de domínio.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Producer } from '../../domain/producer.entity';
import {
  ProducerCreateData,
  ProducerRepositoryPort,
  ProducerUpdateData,
} from '../../domain/producer.repository.port';

interface ProducerRecord {
  id: string;
  name: string;
  document: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProducerPrismaRepository implements ProducerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: ProducerRecord): Producer {
    return new Producer(
      record.id,
      record.name,
      record.document,
      record.createdAt,
      record.updatedAt,
    );
  }

  async create(data: ProducerCreateData): Promise<Producer> {
    const record = await this.prisma.producer.create({ data });
    return this.toDomain(record);
  }

  async findById(id: string): Promise<Producer | null> {
    const record = await this.prisma.producer.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByDocument(document: string): Promise<Producer | null> {
    const record = await this.prisma.producer.findUnique({
      where: { document },
    });
    return record ? this.toDomain(record) : null;
  }

  async update(id: string, data: ProducerUpdateData): Promise<Producer> {
    const record = await this.prisma.producer.update({
      where: { id },
      data,
    });
    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.producer.delete({ where: { id } });
  }

  async findMany(pagination: {
    limit: number;
    offset: number;
  }): Promise<{ data: Producer[]; total: number }> {
    const [records, total] = await Promise.all([
      this.prisma.producer.findMany({
        take: pagination.limit,
        skip: pagination.offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.producer.count(),
    ]);
    return { data: records.map((record) => this.toDomain(record)), total };
  }
}
