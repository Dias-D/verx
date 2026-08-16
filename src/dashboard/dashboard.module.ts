// Liga a porta de leitura ao adapter concreto via token de DI — único lugar
// do módulo que faz esse binding. Trocar de agregação/banco = trocar só o
// `useClass` aqui.

import { Module } from '@nestjs/common';
import { DashboardService } from './application/dashboard.service';
import { DASHBOARD_READ_PORT } from './domain/dashboard.read.port';
import { DashboardController } from './infrastructure/http/dashboard.controller';
import { DashboardPrismaRepository } from './infrastructure/persistence/dashboard.prisma-repository';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    { provide: DASHBOARD_READ_PORT, useClass: DashboardPrismaRepository },
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
