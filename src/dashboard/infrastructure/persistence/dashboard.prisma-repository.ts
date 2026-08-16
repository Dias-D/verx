// Adapter — único lugar do módulo que sabe que existe um cliente de
// persistência concreto por trás da porta de leitura. Toda agregação é
// resolvida no banco (aggregate/groupBy/$queryRaw) — nunca um findMany sem
// filtro seguido de soma em JS (ver arquitetura.md e 05-dashboard.md).
//
// byCrop precisa do nome da cultura (não só o cropId), o que exige um join
// entre planted_crops e crops — join que o groupBy do Prisma não expressa
// (ele só agrupa colunas escalares de uma única tabela). Por isso usa
// $queryRaw tipado aqui dentro do adapter (previsto em tecnologias.md e no
// "Se travar" de 05-dashboard.md) — a porta de leitura não muda, e nenhum
// SQL vaza para a camada de aplicação.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { DashboardSnapshot } from '../../domain/dashboard-snapshot';
import { DashboardReadPort } from '../../domain/dashboard.read.port';

interface CropCountRow {
  crop: string;
  count: bigint;
}

@Injectable()
export class DashboardPrismaRepository implements DashboardReadPort {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(): Promise<DashboardSnapshot> {
    const [farmAggregate, stateGroups, cropRows] = await Promise.all([
      this.prisma.farm.aggregate({
        _count: { _all: true },
        _sum: {
          totalAreaHectares: true,
          arableAreaHectares: true,
          vegetationAreaHectares: true,
        },
      }),
      this.prisma.farm.groupBy({
        by: ['state'],
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<CropCountRow[]>`
        SELECT c.name AS crop, COUNT(*) AS count
        FROM planted_crops pc
        JOIN crops c ON c.id = pc."cropId"
        GROUP BY c.name
        ORDER BY c.name
      `,
    ]);

    return {
      totalFarms: farmAggregate._count._all,
      totalHectares: farmAggregate._sum.totalAreaHectares?.toNumber() ?? 0,
      byState: stateGroups.map((group) => ({
        state: group.state,
        count: group._count._all,
      })),
      byCrop: cropRows.map((row) => ({
        crop: row.crop,
        count: Number(row.count),
      })),
      byLandUse: [
        {
          type: 'arable',
          hectares: farmAggregate._sum.arableAreaHectares?.toNumber() ?? 0,
        },
        {
          type: 'vegetation',
          hectares: farmAggregate._sum.vegetationAreaHectares?.toNumber() ?? 0,
        },
      ],
    };
  }
}
