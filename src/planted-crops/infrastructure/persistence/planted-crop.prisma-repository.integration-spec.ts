// Adapter — teste de integração contra Postgres real via Testcontainers
// (nunca sqlite/in-memory, ver praticas.md#testes): transação atômica
// (falha parcial não deixa resíduo), unicidade composta (P2002 ->
// ConflictException), FK violations (P2003 -> erro de domínio), Restrict
// real em season/crop, cascade real em farm, índices confirmados via
// pg_indexes.

import { execSync } from 'node:child_process';
import { ConflictException } from '@nestjs/common';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { cpf } from 'cpf-cnpj-validator';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CropNotFoundError } from '../../domain/crop-not-found.error';
import { FarmNotFoundError } from '../../domain/farm-not-found.error';
import { PlantedCropNotFoundError } from '../../domain/planted-crop-not-found.error';
import { SeasonNotFoundError } from '../../domain/season-not-found.error';
import { PlantedCropPrismaRepository } from './planted-crop.prisma-repository';

describe('PlantedCropPrismaRepository (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let prismaService: PrismaService;
  let repository: PlantedCropPrismaRepository;
  let farmId: string;
  let seasonId: string;
  let cropId: string;
  let secondCropId: string;

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
    repository = new PlantedCropPrismaRepository(prismaService);
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

    const producer = await prismaService.producer.create({
      data: { name: 'Produtor PlantedCrop', document: cpf.generate() },
    });
    const farm = await prismaService.farm.create({
      data: {
        name: 'Fazenda PlantedCrop',
        city: 'Cidade X',
        state: 'SP',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId: producer.id,
      },
    });
    farmId = farm.id;
    const season = await prismaService.season.create({ data: { year: 2021 } });
    seasonId = season.id;
    const crop = await prismaService.crop.create({ data: { name: 'Soja' } });
    cropId = crop.id;
    const secondCrop = await prismaService.crop.create({
      data: { name: 'Milho' },
    });
    secondCropId = secondCrop.id;
  });

  it('createMany persiste um lote de associações válidas', async () => {
    const created = await repository.createMany(farmId, [
      { seasonId, cropId },
      { seasonId, cropId: secondCropId },
    ]);

    expect(created).toHaveLength(2);
    expect(created.every((item) => item.farmId === farmId)).toBe(true);

    const count = await prismaService.plantedCrop.count();
    expect(count).toBe(2);
  });

  it('createMany é atômico: FK inexistente no meio do lote não deixa resíduo', async () => {
    await expect(
      repository.createMany(farmId, [
        { seasonId, cropId },
        { seasonId, cropId: '00000000-0000-0000-0000-000000000000' },
      ]),
    ).rejects.toThrow(CropNotFoundError);

    const count = await prismaService.plantedCrop.count();
    expect(count).toBe(0);
  });

  it('createMany é atômico: violação de unicidade composta no meio do lote não deixa resíduo (P2002 -> ConflictException)', async () => {
    // Combinação já existente no banco (não faz parte deste lote, então o
    // check em memória do Service não a pega — só a constraint do banco).
    await prismaService.plantedCrop.create({
      data: { farmId, seasonId, cropId },
    });

    await expect(
      repository.createMany(farmId, [
        { seasonId, cropId: secondCropId },
        { seasonId, cropId }, // duplica a combinação já persistida acima
      ]),
    ).rejects.toThrow(ConflictException);

    // Só o registro pré-existente continua lá; o item novo do lote (que
    // seria inserido antes do item duplicado) foi revertido.
    const count = await prismaService.plantedCrop.count();
    expect(count).toBe(1);
  });

  it('createMany lança FarmNotFoundError quando farmId não existe (P2003)', async () => {
    await expect(
      repository.createMany('00000000-0000-0000-0000-000000000000', [
        { seasonId, cropId },
      ]),
    ).rejects.toThrow(FarmNotFoundError);

    expect(await prismaService.plantedCrop.count()).toBe(0);
  });

  it('createMany lança SeasonNotFoundError quando seasonId não existe (P2003)', async () => {
    await expect(
      repository.createMany(farmId, [
        { seasonId: '00000000-0000-0000-0000-000000000000', cropId },
      ]),
    ).rejects.toThrow(SeasonNotFoundError);

    expect(await prismaService.plantedCrop.count()).toBe(0);
  });

  it('createMany lança CropNotFoundError quando cropId não existe (P2003)', async () => {
    await expect(
      repository.createMany(farmId, [
        { seasonId, cropId: '00000000-0000-0000-0000-000000000000' },
      ]),
    ).rejects.toThrow(CropNotFoundError);

    expect(await prismaService.plantedCrop.count()).toBe(0);
  });

  it('Restrict: apagar uma season referenciada por um planted-crop falha de verdade', async () => {
    await repository.createMany(farmId, [{ seasonId, cropId }]);

    await expect(
      prismaService.season.delete({ where: { id: seasonId } }),
    ).rejects.toThrow();

    // A season continua lá, não foi apagada.
    expect(
      await prismaService.season.findUnique({ where: { id: seasonId } }),
    ).not.toBeNull();
  });

  it('Restrict: apagar um crop referenciado por um planted-crop falha de verdade', async () => {
    await repository.createMany(farmId, [{ seasonId, cropId }]);

    await expect(
      prismaService.crop.delete({ where: { id: cropId } }),
    ).rejects.toThrow();

    expect(
      await prismaService.crop.findUnique({ where: { id: cropId } }),
    ).not.toBeNull();
  });

  it('Cascade: apagar a farm remove seus planted-crops', async () => {
    const created = await repository.createMany(farmId, [
      { seasonId, cropId },
      { seasonId, cropId: secondCropId },
    ]);

    await prismaService.farm.delete({ where: { id: farmId } });

    const remaining = await prismaService.plantedCrop.findMany({
      where: { id: { in: created.map((item) => item.id) } },
    });
    expect(remaining).toHaveLength(0);
  });

  it('findByFarm filtra por farmId e pagina os resultados', async () => {
    await repository.createMany(farmId, [
      { seasonId, cropId },
      { seasonId, cropId: secondCropId },
    ]);

    const producer2 = await prismaService.producer.create({
      data: { name: 'Outro Produtor', document: cpf.generate() },
    });
    const otherFarm = await prismaService.farm.create({
      data: {
        name: 'Outra Fazenda',
        city: 'Cidade Y',
        state: 'MG',
        totalAreaHectares: 50,
        arableAreaHectares: 30,
        vegetationAreaHectares: 20,
        producerId: producer2.id,
      },
    });
    await repository.createMany(otherFarm.id, [{ seasonId, cropId }]);

    const page1 = await repository.findByFarm(farmId, {
      limit: 1,
      offset: 0,
    });
    expect(page1.total).toBe(2);
    expect(page1.data).toHaveLength(1);

    const page2 = await repository.findByFarm(farmId, {
      limit: 1,
      offset: 1,
    });
    expect(page2.data).toHaveLength(1);
  });

  it('delete remove um planted-crop existente', async () => {
    const created = await repository.createMany(farmId, [{ seasonId, cropId }]);

    await repository.delete(created[0].id);

    const found = await prismaService.plantedCrop.findUnique({
      where: { id: created[0].id },
    });
    expect(found).toBeNull();
  });

  it('delete lança PlantedCropNotFoundError quando o id não existe (P2025)', async () => {
    await expect(
      repository.delete('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(PlantedCropNotFoundError);
  });

  it('confirma o índice único composto [farmId, seasonId, cropId] e os índices de FK no banco', async () => {
    const indexes = await prismaService.$queryRawUnsafe<
      { indexname: string }[]
    >("SELECT indexname FROM pg_indexes WHERE tablename = 'planted_crops'");
    const indexNames = indexes.map((index) => index.indexname);

    expect(
      indexNames.some(
        (name) =>
          name.includes('farmId') &&
          name.includes('seasonId') &&
          name.includes('cropId'),
      ),
    ).toBe(true);
    expect(indexNames.some((name) => name.includes('farmId'))).toBe(true);
    expect(indexNames.some((name) => name.includes('seasonId'))).toBe(true);
    expect(indexNames.some((name) => name.includes('cropId'))).toBe(true);
  });
});
