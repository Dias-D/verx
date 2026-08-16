// Caso de uso (application) — depende SÓ da porta (injetada por token de
// DI), nunca de detalhes concretos de infraestrutura (persistência)
// diretamente.

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Producer } from '../domain/producer.entity';
import { PRODUCER_REPOSITORY } from '../domain/producer.repository.port';
import type { ProducerRepositoryPort } from '../domain/producer.repository.port';
import { CreateProducerDto } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

@Injectable()
export class ProducersService {
  constructor(
    @Inject(PRODUCER_REPOSITORY)
    private readonly repository: ProducerRepositoryPort,
  ) {}

  async create(dto: CreateProducerDto): Promise<Producer> {
    // Regra de negócio: unicidade do documento. O DTO só valida a FORMA
    // (é um CPF/CNPJ válido); só o Service enxerga o estado persistido
    // (ver praticas.md#onde-cada-regra-de-negócio-vive). A defesa final é a
    // constraint única no banco, aplicada pelo adapter de persistência.
    const existing = await this.repository.findByDocument(dto.document);
    if (existing) {
      throw new ConflictException(
        'A producer with this document already exists',
      );
    }
    return this.repository.create({ name: dto.name, document: dto.document });
  }

  async findById(id: string): Promise<Producer> {
    const producer = await this.repository.findById(id);
    if (!producer) {
      throw new NotFoundException(`Producer with id ${id} not found`);
    }
    return producer;
  }

  async update(id: string, dto: UpdateProducerDto): Promise<Producer> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Producer with id ${id} not found`);
    }
    return this.repository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Producer with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async findMany(query: {
    page: number;
    limit: number;
  }): Promise<PaginatedResult<Producer>> {
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
