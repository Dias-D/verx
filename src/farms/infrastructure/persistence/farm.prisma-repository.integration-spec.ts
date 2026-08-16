// Adapter — teste de integração contra Postgres real via Testcontainers
// (nunca sqlite/in-memory, ver praticas.md#testes): persistência real,
// violação de FK -> ProducerNotFoundError, cascade delete real, filtros e
// paginação reais, índices confirmados via pg_indexes.

import { execSync } from 'node:child_process';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { cpf } from 'cpf-cnpj-validator';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ProducerNotFoundError } from '../../domain/producer-not-found.error';
import { FarmPrismaRepository } from './farm.prisma-repository';

describe('FarmPrismaRepository (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let prismaService: PrismaService;
  let repository: FarmPrismaRepository;
  let producerId: string;

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
    repository = new FarmPrismaRepository(prismaService);
  }, 120_000);

  afterAll(async () => {
    await prismaService.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    await prismaService.farm.deleteMany();
    await prismaService.producer.deleteMany();
    const producer = await prismaService.producer.create({
      data: { name: 'Produtor Farm', document: cpf.generate() },
    });
    producerId = producer.id;
  });

  it('persiste e recupera uma farm, com áreas convertidas para number', async () => {
    const created = await repository.create({
      name: 'Fazenda Boa Vista',
      city: 'Ribeirão Preto',
      state: 'SP',
      totalAreaHectares: 100,
      arableAreaHectares: 60,
      vegetationAreaHectares: 40,
      producerId,
    });

    const found = await repository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.name).toBe('Fazenda Boa Vista');
    expect(found?.totalAreaHectares).toBe(100);
    expect(typeof found?.totalAreaHectares).toBe('number');
    expect(found?.arableAreaHectares).toBe(60);
    expect(found?.vegetationAreaHectares).toBe(40);
  });

  it('retorna null quando o id não existe', async () => {
    const found = await repository.findById(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(found).toBeNull();
  });

  it('lança ProducerNotFoundError quando producerId não existe (violação de FK)', async () => {
    await expect(
      repository.create({
        name: 'Fazenda Órfã',
        city: 'Cidade X',
        state: 'SP',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toThrow(ProducerNotFoundError);
  });

  it('cascade delete: apagar o producer remove suas farms', async () => {
    const created = await repository.create({
      name: 'Fazenda Cascata',
      city: 'Cidade Y',
      state: 'MG',
      totalAreaHectares: 100,
      arableAreaHectares: 60,
      vegetationAreaHectares: 40,
      producerId,
    });

    await prismaService.producer.delete({ where: { id: producerId } });

    const farmAfterDelete = await prismaService.farm.findUnique({
      where: { id: created.id },
    });
    expect(farmAfterDelete).toBeNull();
  });

  it('atualiza uma farm existente', async () => {
    const created = await repository.create({
      name: 'Nome Original',
      city: 'Cidade Z',
      state: 'RJ',
      totalAreaHectares: 100,
      arableAreaHectares: 60,
      vegetationAreaHectares: 40,
      producerId,
    });

    const updated = await repository.update(created.id, {
      name: 'Nome Atualizado',
    });

    expect(updated.name).toBe('Nome Atualizado');
  });

  it('remove uma farm existente', async () => {
    const created = await repository.create({
      name: 'Para Remover',
      city: 'Cidade W',
      state: 'BA',
      totalAreaHectares: 100,
      arableAreaHectares: 60,
      vegetationAreaHectares: 40,
      producerId,
    });

    await repository.delete(created.id);

    expect(await repository.findById(created.id)).toBeNull();
  });

  it('filtra por producerId/state/city e pagina os resultados', async () => {
    const otherProducer = await prismaService.producer.create({
      data: { name: 'Outro Produtor', document: cpf.generate() },
    });

    for (let i = 0; i < 3; i += 1) {
      await repository.create({
        name: `Fazenda SP ${i}`,
        city: 'Campinas',
        state: 'SP',
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
        producerId,
      });
    }
    await repository.create({
      name: 'Fazenda MG',
      city: 'Uberlândia',
      state: 'MG',
      totalAreaHectares: 100,
      arableAreaHectares: 60,
      vegetationAreaHectares: 40,
      producerId,
    });
    await repository.create({
      name: 'Fazenda Outro Produtor',
      city: 'Campinas',
      state: 'SP',
      totalAreaHectares: 100,
      arableAreaHectares: 60,
      vegetationAreaHectares: 40,
      producerId: otherProducer.id,
    });

    const byState = await repository.findMany(
      { state: 'SP' },
      { limit: 10, offset: 0 },
    );
    expect(byState.total).toBe(4);

    const byProducer = await repository.findMany(
      { producerId },
      { limit: 10, offset: 0 },
    );
    expect(byProducer.total).toBe(4);

    const byCity = await repository.findMany(
      { city: 'Campinas' },
      { limit: 10, offset: 0 },
    );
    expect(byCity.total).toBe(4);

    const combined = await repository.findMany(
      { producerId, state: 'SP', city: 'Campinas' },
      { limit: 2, offset: 0 },
    );
    expect(combined.total).toBe(3);
    expect(combined.data).toHaveLength(2);

    const page2 = await repository.findMany(
      { producerId, state: 'SP', city: 'Campinas' },
      { limit: 2, offset: 2 },
    );
    expect(page2.data).toHaveLength(1);
  });

  it('confirma que os índices de producerId e state existem no banco', async () => {
    const indexes = await prismaService.$queryRawUnsafe<
      { indexname: string }[]
    >("SELECT indexname FROM pg_indexes WHERE tablename = 'farms'");
    const indexNames = indexes.map((index) => index.indexname);

    expect(indexNames.some((name) => name.includes('producerId'))).toBe(true);
    expect(indexNames.some((name) => name.includes('state'))).toBe(true);
  });
});
