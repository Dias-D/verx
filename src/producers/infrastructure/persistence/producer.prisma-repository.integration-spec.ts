// Adapter — teste de integração contra Postgres real via Testcontainers
// (nunca sqlite/in-memory, ver praticas.md#testes): persistência real,
// constraint única no banco, paginação real.

import { execSync } from 'node:child_process';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { cpf } from 'cpf-cnpj-validator';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ProducerPrismaRepository } from './producer.prisma-repository';

describe('ProducerPrismaRepository (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let prismaService: PrismaService;
  let repository: ProducerPrismaRepository;

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
    repository = new ProducerPrismaRepository(prismaService);
  }, 120_000);

  afterAll(async () => {
    await prismaService.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    await prismaService.producer.deleteMany();
  });

  it('persiste e recupera um producer', async () => {
    const created = await repository.create({
      name: 'João da Silva',
      document: cpf.generate(),
    });

    const found = await repository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.name).toBe('João da Silva');
    expect(found?.document).toBe(created.document);
  });

  it('encontra um producer pelo documento', async () => {
    const document = cpf.generate();
    const created = await repository.create({ name: 'Maria', document });

    const found = await repository.findByDocument(document);

    expect(found?.id).toBe(created.id);
  });

  it('retorna null quando o id não existe', async () => {
    const found = await repository.findById(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(found).toBeNull();
  });

  it('viola a constraint única de document no banco', async () => {
    const document = cpf.generate();
    await repository.create({ name: 'Primeiro', document });

    await expect(
      repository.create({ name: 'Segundo', document }),
    ).rejects.toThrow();
  });

  it('atualiza um producer existente', async () => {
    const created = await repository.create({
      name: 'Nome Original',
      document: cpf.generate(),
    });

    const updated = await repository.update(created.id, {
      name: 'Nome Atualizado',
    });

    expect(updated.name).toBe('Nome Atualizado');
  });

  it('remove um producer existente', async () => {
    const created = await repository.create({
      name: 'Para Remover',
      document: cpf.generate(),
    });

    await repository.delete(created.id);

    expect(await repository.findById(created.id)).toBeNull();
  });

  it('pagina os resultados respeitando limit/offset', async () => {
    for (let i = 0; i < 5; i += 1) {
      await repository.create({
        name: `Producer ${i}`,
        document: cpf.generate(),
      });
    }

    const page1 = await repository.findMany({ limit: 2, offset: 0 });
    const page2 = await repository.findMany({ limit: 2, offset: 2 });

    expect(page1.data).toHaveLength(2);
    expect(page2.data).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.data.map((p) => p.id)).not.toEqual(
      page2.data.map((p) => p.id),
    );
  });
});
