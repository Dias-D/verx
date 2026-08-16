// Liga a porta ao adapter concreto via token de DI — único lugar do módulo
// que faz esse binding. Trocar de ORM/banco = trocar só o `useClass` aqui.

import { Module } from '@nestjs/common';
import { PlantedCropsService } from './application/planted-crops.service';
import { PLANTED_CROP_REPOSITORY } from './domain/planted-crop.repository.port';
import { PlantedCropsController } from './infrastructure/http/planted-crops.controller';
import { PlantedCropPrismaRepository } from './infrastructure/persistence/planted-crop.prisma-repository';

@Module({
  controllers: [PlantedCropsController],
  providers: [
    PlantedCropsService,
    { provide: PLANTED_CROP_REPOSITORY, useClass: PlantedCropPrismaRepository },
  ],
  exports: [PlantedCropsService],
})
export class PlantedCropsModule {}
