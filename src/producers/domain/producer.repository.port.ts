// Porta de repositório — interface que domain/application dependem. Nenhuma
// implementação aqui, nenhuma referência a Prisma/ORM (só infrastructure/
// conhece o Prisma, ver arquitetura.md).

import { Producer } from './producer.entity';

export interface ProducerCreateData {
  name: string;
  document: string;
}

export interface ProducerUpdateData {
  name?: string;
  document?: string;
}

export interface ProducerRepositoryPort {
  create(data: ProducerCreateData): Promise<Producer>;
  findById(id: string): Promise<Producer | null>;
  findByDocument(document: string): Promise<Producer | null>;
  update(id: string, data: ProducerUpdateData): Promise<Producer>;
  delete(id: string): Promise<void>;
  findMany(pagination: {
    limit: number;
    offset: number;
  }): Promise<{ data: Producer[]; total: number }>;
}

// Token de DI — producers.module.ts usa isto para ligar a porta ao adapter concreto.
export const PRODUCER_REPOSITORY = Symbol('ProducerRepositoryPort');
