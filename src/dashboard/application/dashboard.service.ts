// Caso de uso (application) — depende SÓ da porta de leitura (injetada por
// token de DI), nunca de um detalhe concreto de infraestrutura/ORM
// diretamente. Sem regra de negócio própria: passagem direta do snapshot que
// a porta já devolve pronto (ver 05-dashboard.md).

import { Inject, Injectable } from '@nestjs/common';
import { DashboardSnapshot } from '../domain/dashboard-snapshot';
import { DASHBOARD_READ_PORT } from '../domain/dashboard.read.port';
import type { DashboardReadPort } from '../domain/dashboard.read.port';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DASHBOARD_READ_PORT)
    private readonly readPort: DashboardReadPort,
  ) {}

  async getSnapshot(): Promise<DashboardSnapshot> {
    return this.readPort.getSnapshot();
  }
}
