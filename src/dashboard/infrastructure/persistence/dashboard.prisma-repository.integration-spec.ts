// Adapter — teste de integração contra Postgres real via Testcontainers
// (nunca sqlite/in-memory, ver praticas.md#testes):
//
// 1. Banco vazio não quebra (tudo zerado).
// 2. Agregação real (aggregate/groupBy/$queryRaw) contra dados sintéticos
//    conhecidos, confirmando que os totais batem exatamente.
// 3. Teste de volume (hábito, não só correção — ver
//    praticas.md#escalabilidade-e-confiabilidade-sob-grande-volume-de-dados):
//    popula milhares de registros sintéticos via @faker-js/faker (produtores/
//    farms/planted crops espalhados por vários estados/culturas) e confirma
//    que o tempo de resposta não cresce linearmente com o volume — a query
//    nunca carrega as linhas inteiras pro Node, só o resultado já agregado.

import { randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { faker } from '@faker-js/faker';
import { cpf } from 'cpf-cnpj-validator';
import { BRAZILIAN_STATES } from '../../../farms/domain/brazilian-state';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { DashboardPrismaRepository } from './dashboard.prisma-repository';

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

describe('DashboardPrismaRepository (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let prismaService: PrismaService;
  let repository: DashboardPrismaRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    const databaseUrl = container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;

    execSync('yarn prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });

    prismaService = new PrismaService();
    await prismaService.$connect();
    repository = new DashboardPrismaRepository(prismaService);
  }, 120_000);

  afterAll(async () => {
    await prismaService.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    await prismaService.plantedCrop.deleteMany();
    await prismaService.farm.deleteMany();
    await prismaService.producer.deleteMany();
    await prismaService.season.deleteMany();
    await prismaService.crop.deleteMany();
  });

  it('devolve tudo zerado quando o banco está vazio', async () => {
    const snapshot = await repository.getSnapshot();

    expect(snapshot).toEqual({
      totalFarms: 0,
      totalHectares: 0,
      byState: [],
      byCrop: [],
      byLandUse: [
        { type: 'arable', hectares: 0 },
        { type: 'vegetation', hectares: 0 },
      ],
    });
  });

  it('agrega totais, por estado, por cultura e por uso do solo com dados conhecidos', async () => {
    const season = await prismaService.season.create({
      data: { year: 2026 },
    });
    const soja = await prismaService.crop.create({ data: { name: 'Soja' } });
    const milho = await prismaService.crop.create({
      data: { name: 'Milho' },
    });
    const producer = await prismaService.producer.create({
      data: { name: 'Produtor Dashboard', document: cpf.generate() },
    });

    const farmSp1 = await prismaService.farm.create({
      data: {
        name: 'Fazenda SP 1',
        city: 'Ribeirão Preto',
        state: 'SP',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId: producer.id,
      },
    });
    const farmSp2 = await prismaService.farm.create({
      data: {
        name: 'Fazenda SP 2',
        city: 'Campinas',
        state: 'SP',
        totalAreaHectares: 200,
        arableAreaHectares: 150,
        vegetationAreaHectares: 50,
        producerId: producer.id,
      },
    });
    const farmMg = await prismaService.farm.create({
      data: {
        name: 'Fazenda MG',
        city: 'Uberlândia',
        state: 'MG',
        totalAreaHectares: 50,
        arableAreaHectares: 30,
        vegetationAreaHectares: 20,
        producerId: producer.id,
      },
    });

    await prismaService.plantedCrop.createMany({
      data: [
        { farmId: farmSp1.id, seasonId: season.id, cropId: soja.id },
        { farmId: farmSp2.id, seasonId: season.id, cropId: soja.id },
        { farmId: farmSp2.id, seasonId: season.id, cropId: milho.id },
        { farmId: farmMg.id, seasonId: season.id, cropId: milho.id },
      ],
    });

    const snapshot = await repository.getSnapshot();

    expect(snapshot.totalFarms).toBe(3);
    expect(snapshot.totalHectares).toBe(350);
    expect(snapshot.byState).toHaveLength(2);
    expect(snapshot.byState).toEqual(
      expect.arrayContaining([
        { state: 'SP', count: 2 },
        { state: 'MG', count: 1 },
      ]),
    );
    expect(snapshot.byCrop).toHaveLength(2);
    expect(snapshot.byCrop).toEqual(
      expect.arrayContaining([
        { crop: 'Soja', count: 2 },
        { crop: 'Milho', count: 2 },
      ]),
    );
    expect(snapshot.byLandUse).toEqual(
      expect.arrayContaining([
        { type: 'arable', hectares: 240 },
        { type: 'vegetation', hectares: 110 },
      ]),
    );
  });

  it('teste de volume: agregação de milhares de registros sintéticos não degrada linearmente com o volume', async () => {
    const CROPS = [
      'Soja',
      'Milho',
      'Café',
      'Cana-de-açúcar',
      'Algodão',
      'Arroz',
      'Feijão',
      'Trigo',
    ];
    const crops = await Promise.all(
      CROPS.map((name) => prismaService.crop.create({ data: { name } })),
    );
    const season = await prismaService.season.create({
      data: { year: 2026 },
    });

    // Semeia um lote pequeno primeiro, mede a linha de base, depois semeia
    // um lote muito maior (escala ~25x) e mede de novo — se a query
    // crescesse linearmente com o volume, o tempo cresceria na mesma
    // proporção (~25x); o objetivo é confirmar que cresce muito menos que
    // isso, porque a agregação nunca carrega as linhas inteiras pro Node.
    async function seed(producerCount: number, farmCount: number) {
      const producers = Array.from({ length: producerCount }, () => ({
        id: randomUUID(),
        name: faker.company.name(),
        document: randomUUID(),
      }));
      for (const batch of chunk(producers, 500)) {
        await prismaService.producer.createMany({ data: batch });
      }

      const farms = Array.from({ length: farmCount }, () => {
        const arable = faker.number.int({ min: 10, max: 500 });
        const vegetation = faker.number.int({ min: 10, max: 500 });
        return {
          id: randomUUID(),
          name: faker.company.name(),
          city: faker.location.city(),
          state: faker.helpers.arrayElement(BRAZILIAN_STATES),
          totalAreaHectares: arable + vegetation,
          arableAreaHectares: arable,
          vegetationAreaHectares: vegetation,
          producerId: faker.helpers.arrayElement(producers).id,
        };
      });
      for (const batch of chunk(farms, 500)) {
        await prismaService.farm.createMany({ data: batch });
      }

      const plantedCrops = farms.flatMap((farm) => {
        const farmCrops = faker.helpers.arrayElements(crops, 2);
        return farmCrops.map((crop) => ({
          farmId: farm.id,
          seasonId: season.id,
          cropId: crop.id,
        }));
      });
      for (const batch of chunk(plantedCrops, 500)) {
        await prismaService.plantedCrop.createMany({ data: batch });
      }
    }

    await seed(50, 200);
    // Warm-up: primeira chamada paga custo de plano de query "frio".
    await repository.getSnapshot();
    const baselineStart = Date.now();
    const baselineSnapshot = await repository.getSnapshot();
    const baselineDurationMs = Date.now() - baselineStart;

    await seed(1_000, 5_000);
    const volumeStart = Date.now();
    const volumeSnapshot = await repository.getSnapshot();
    const volumeDurationMs = Date.now() - volumeStart;

    const farmGrowthFactor =
      volumeSnapshot.totalFarms / baselineSnapshot.totalFarms;
    const timeGrowthFactor = volumeDurationMs / Math.max(baselineDurationMs, 1);

    console.log(
      `[dashboard volume test] baseline: ${baselineSnapshot.totalFarms} farms em ${baselineDurationMs}ms | ` +
        `volume: ${volumeSnapshot.totalFarms} farms em ${volumeDurationMs}ms | ` +
        `crescimento de dados: ${farmGrowthFactor.toFixed(1)}x | crescimento de tempo: ${timeGrowthFactor.toFixed(1)}x`,
    );

    expect(volumeSnapshot.totalFarms).toBe(5_200);
    // Não-linear: o volume de dados cresce ~25x, mas o tempo de resposta
    // fica bem abaixo disso — bem longe de um crescimento proporcional.
    expect(timeGrowthFactor).toBeLessThan(farmGrowthFactor / 2);
    // Teto absoluto de sanidade — a agregação nunca deveria chegar perto
    // disso, mesmo sob milhares de registros.
    expect(volumeDurationMs).toBeLessThan(3_000);
  }, 180_000);
});
