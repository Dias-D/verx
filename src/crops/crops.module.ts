// Liga a porta ao adapter concreto via token de DI — único lugar do módulo
// que faz esse binding. Trocar de ORM/banco = trocar só o `useClass` aqui.

import { Module } from '@nestjs/common';
import { CropsService } from './application/crops.service';
import { CROP_REPOSITORY } from './domain/crop.repository.port';
import { CropsController } from './infrastructure/http/crops.controller';
import { CropPrismaRepository } from './infrastructure/persistence/crop.prisma-repository';

@Module({
  controllers: [CropsController],
  providers: [
    CropsService,
    { provide: CROP_REPOSITORY, useClass: CropPrismaRepository },
  ],
  exports: [CropsService],
})
export class CropsModule {}
