// Liga a porta ao adapter concreto via token de DI — único lugar do módulo
// que faz esse binding. Trocar de ORM/banco = trocar só o `useClass` aqui.

import { Module } from '@nestjs/common';
import { PRODUCER_REPOSITORY } from './domain/producer.repository.port';
import { ProducersService } from './application/producers.service';
import { ProducerPrismaRepository } from './infrastructure/persistence/producer.prisma-repository';
import { ProducersController } from './infrastructure/http/producers.controller';

@Module({
  controllers: [ProducersController],
  providers: [
    ProducersService,
    { provide: PRODUCER_REPOSITORY, useClass: ProducerPrismaRepository },
  ],
  exports: [ProducersService],
})
export class ProducersModule {}
