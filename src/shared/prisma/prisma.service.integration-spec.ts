import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { PrismaService } from './prisma.service';

describe('PrismaService (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let prismaService: PrismaService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    prismaService = new PrismaService(container.getConnectionUri());
    await prismaService.$connect();
  }, 60_000);

  afterAll(async () => {
    await prismaService.$disconnect();
    await container.stop();
  });

  it('conecta a um Postgres real (Testcontainers) e executa SELECT 1', async () => {
    const result = await prismaService.$queryRaw<
      Array<Record<string, number>>
    >`SELECT 1 AS result`;

    expect(result[0].result).toBe(1);
  });
});
