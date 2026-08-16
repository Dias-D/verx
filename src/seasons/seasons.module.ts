// Liga a porta ao adapter concreto via token de DI — único lugar do módulo
// que faz esse binding. Trocar de ORM/banco = trocar só o `useClass` aqui.

import { Module } from '@nestjs/common';
import { SeasonsService } from './application/seasons.service';
import { SEASON_REPOSITORY } from './domain/season.repository.port';
import { SeasonsController } from './infrastructure/http/seasons.controller';
import { SeasonPrismaRepository } from './infrastructure/persistence/season.prisma-repository';

@Module({
  controllers: [SeasonsController],
  providers: [
    SeasonsService,
    { provide: SEASON_REPOSITORY, useClass: SeasonPrismaRepository },
  ],
  exports: [SeasonsService],
})
export class SeasonsModule {}
