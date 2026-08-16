// Liga a porta ao adapter concreto via token de DI — único lugar do módulo
// que faz esse binding. Trocar de ORM/banco = trocar só o `useClass` aqui.

import { Module } from '@nestjs/common';
import { FarmsService } from './application/farms.service';
import { FARM_REPOSITORY } from './domain/farm.repository.port';
import { FarmsController } from './infrastructure/http/farms.controller';
import { FarmPrismaRepository } from './infrastructure/persistence/farm.prisma-repository';

@Module({
  controllers: [FarmsController],
  providers: [
    FarmsService,
    { provide: FARM_REPOSITORY, useClass: FarmPrismaRepository },
  ],
  exports: [FarmsService],
})
export class FarmsModule {}
