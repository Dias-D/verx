// Adapter — teste de integração contra Postgres real via Testcontainers
// (nunca sqlite/in-memory, ver praticas.md#testes): persistência real,
// constraint única no banco, `Restrict` testado de verdade com fixture de
// PlantedCrop (criar uma Season, vincular via PlantedCrop, tentar apagar a
// Season e confirmar que falha com o erro de domínio esperado).

import { execSync } from 'node:child_process';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { cpf } from 'cpf-cnpj-validator';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SeasonReferencedError } from '../../domain/season-referenced.error';
import { SeasonPrismaRepository } from './season.prisma-repository';

describe('SeasonPrismaRepository (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let prismaService: PrismaService;
  let repository: SeasonPrismaRepository;

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
    repository = new SeasonPrismaRepository(prismaService);
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

  it('persiste e recupera uma season', async () => {
    const created = await repository.create({ year: 2021 });

    const found = await repository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.year).toBe(2021);
  });

  it('encontra uma season pelo year', async () => {
    const created = await repository.create({ year: 2022 });

    const found = await repository.findByYear(2022);

    expect(found?.id).toBe(created.id);
  });

  it('retorna null quando o id não existe', async () => {
    const found = await repository.findById(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(found).toBeNull();
  });

  it('viola a constraint única de year no banco', async () => {
    await repository.create({ year: 2023 });

    await expect(repository.create({ year: 2023 })).rejects.toThrow();
  });

  it('atualiza uma season existente', async () => {
    const created = await repository.create({ year: 2024 });

    const updated = await repository.update(created.id, { year: 2025 });

    expect(updated.year).toBe(2025);
  });

  it('remove uma season sem vínculo', async () => {
    const created = await repository.create({ year: 2026 });

    await repository.delete(created.id);

    expect(await repository.findById(created.id)).toBeNull();
  });

  it('pagina os resultados respeitando limit/offset', async () => {
    for (let i = 0; i < 5; i += 1) {
      await repository.create({ year: 1900 + i });
    }

    const page1 = await repository.findMany({ limit: 2, offset: 0 });
    const page2 = await repository.findMany({ limit: 2, offset: 2 });

    expect(page1.data).toHaveLength(2);
    expect(page2.data).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.data.map((s) => s.id)).not.toEqual(
      page2.data.map((s) => s.id),
    );
  });

  it('Restrict: apagar uma season vinculada a um planted-crop lança SeasonReferencedError', async () => {
    const season = await repository.create({ year: 2030 });
    const crop = await prismaService.crop.create({ data: { name: 'Soja' } });
    const producer = await prismaService.producer.create({
      data: { name: 'Produtor Season', document: cpf.generate() },
    });
    const farm = await prismaService.farm.create({
      data: {
        name: 'Fazenda Season',
        city: 'Cidade Z',
        state: 'SP',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId: producer.id,
      },
    });
    await prismaService.plantedCrop.create({
      data: { farmId: farm.id, seasonId: season.id, cropId: crop.id },
    });

    await expect(repository.delete(season.id)).rejects.toThrow(
      SeasonReferencedError,
    );

    expect(await repository.findById(season.id)).not.toBeNull();
  });
});
