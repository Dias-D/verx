// Adapter — teste de integração contra Postgres real via Testcontainers
// (nunca sqlite/in-memory, ver praticas.md#testes): persistência real,
// constraint única no banco, `Restrict` testado de verdade com fixture de
// PlantedCrop (criar um Crop, vincular via PlantedCrop, tentar apagar o
// Crop e confirmar que falha com o erro de domínio esperado).

import { execSync } from 'node:child_process';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { cpf } from 'cpf-cnpj-validator';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CropReferencedError } from '../../domain/crop-referenced.error';
import { CropPrismaRepository } from './crop.prisma-repository';

describe('CropPrismaRepository (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let prismaService: PrismaService;
  let repository: CropPrismaRepository;

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
    repository = new CropPrismaRepository(prismaService);
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

  it('persiste e recupera um crop', async () => {
    const created = await repository.create({ name: 'Soja' });

    const found = await repository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.name).toBe('Soja');
  });

  it('encontra um crop pelo name', async () => {
    const created = await repository.create({ name: 'Milho' });

    const found = await repository.findByName('Milho');

    expect(found?.id).toBe(created.id);
  });

  it('retorna null quando o id não existe', async () => {
    const found = await repository.findById(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(found).toBeNull();
  });

  it('viola a constraint única de name no banco', async () => {
    await repository.create({ name: 'Café' });

    await expect(repository.create({ name: 'Café' })).rejects.toThrow();
  });

  it('atualiza um crop existente', async () => {
    const created = await repository.create({ name: 'Nome Original' });

    const updated = await repository.update(created.id, {
      name: 'Nome Atualizado',
    });

    expect(updated.name).toBe('Nome Atualizado');
  });

  it('remove um crop sem vínculo', async () => {
    const created = await repository.create({ name: 'Para Remover' });

    await repository.delete(created.id);

    expect(await repository.findById(created.id)).toBeNull();
  });

  it('pagina os resultados respeitando limit/offset', async () => {
    for (let i = 0; i < 5; i += 1) {
      await repository.create({ name: `Crop ${i}` });
    }

    const page1 = await repository.findMany({ limit: 2, offset: 0 });
    const page2 = await repository.findMany({ limit: 2, offset: 2 });

    expect(page1.data).toHaveLength(2);
    expect(page2.data).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.data.map((c) => c.id)).not.toEqual(
      page2.data.map((c) => c.id),
    );
  });

  it('Restrict: apagar um crop vinculado a um planted-crop lança CropReferencedError', async () => {
    const crop = await repository.create({ name: 'Soja Vinculada' });
    const season = await prismaService.season.create({
      data: { year: 2031 },
    });
    const producer = await prismaService.producer.create({
      data: { name: 'Produtor Crop', document: cpf.generate() },
    });
    const farm = await prismaService.farm.create({
      data: {
        name: 'Fazenda Crop',
        city: 'Cidade W',
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

    await expect(repository.delete(crop.id)).rejects.toThrow(
      CropReferencedError,
    );

    expect(await repository.findById(crop.id)).not.toBeNull();
  });
});
