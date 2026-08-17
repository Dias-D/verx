// Dado de demonstração — idempotente (não duplica em restart de container),
// fora do escopo de TDD: não é regra de negócio, endpoint nem validador,
// mesmo tratamento já dado às fixtures de teste (`*.fixture.ts`) das etapas
// 1-5 (ver arquitetura.md#seed-de-dados-de-demonstração e
// implementacao/etapas/07-documentacao.md). Roda com PrismaClient direto
// (não PrismaService/DI): é um script standalone fora dos módulos
// hexagonais, não dentro de domain/ nem application/ de nenhum deles.
//
// Objetivo: sem nenhum dado, o Swagger (/docs) e o GET /dashboard nascem
// vazios para quem for avaliar — este seed cobre os cinco módulos com um
// conjunto pequeno e representativo, espalhado por múltiplos
// BrazilianState/Season/Crop, para que os três gráficos de pizza do
// dashboard não nasçam vazios/triviais.

import { BrazilianState, PrismaClient } from '@prisma/client';
import { cnpj, cpf } from 'cpf-cnpj-validator';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const existingProducers = await prisma.producer.count();
  if (existingProducers > 0) {
    console.log('Seed: já existe dado (producers > 0) — nada a fazer.');
    return;
  }

  console.log('Seed: banco vazio, inserindo dado de demonstração...');

  const [joao, mariaAgro, techFarm] = await Promise.all([
    prisma.producer.create({
      data: { name: 'João da Silva', document: cpf.generate() },
    }),
    prisma.producer.create({
      data: { name: 'Maria Agropecuária LTDA', document: cnpj.generate() },
    }),
    prisma.producer.create({
      data: {
        name: 'TechFarm Alfanumérica S.A.',
        // CNPJ alfanumérico real (Nota Técnica RFB 49/2024), já normalizado
        // (sem pontuação) — mesmo exemplo usado nos testes de
        // document.validator.spec.ts.
        document: '00000000E08G12',
      },
    }),
  ]);

  const [season2023, season2024, season2025] = await Promise.all([
    prisma.season.create({ data: { year: 2023 } }),
    prisma.season.create({ data: { year: 2024 } }),
    prisma.season.create({ data: { year: 2025 } }),
  ]);

  const [soja, milho, cafe, algodao] = await Promise.all([
    prisma.crop.create({ data: { name: 'Soja' } }),
    prisma.crop.create({ data: { name: 'Milho' } }),
    prisma.crop.create({ data: { name: 'Café' } }),
    prisma.crop.create({ data: { name: 'Algodão' } }),
  ]);

  const farmsData = [
    {
      name: 'Fazenda Boa Vista',
      city: 'Ribeirão Preto',
      state: BrazilianState.SP,
      totalAreaHectares: 500,
      arableAreaHectares: 350,
      vegetationAreaHectares: 150,
      producerId: joao.id,
    },
    {
      name: 'Fazenda Santa Fé',
      city: 'Uberlândia',
      state: BrazilianState.MG,
      totalAreaHectares: 300,
      arableAreaHectares: 200,
      vegetationAreaHectares: 100,
      producerId: joao.id,
    },
    {
      name: 'Fazenda Primavera',
      city: 'Rio Verde',
      state: BrazilianState.GO,
      totalAreaHectares: 800,
      arableAreaHectares: 600,
      vegetationAreaHectares: 200,
      producerId: mariaAgro.id,
    },
    {
      name: 'Fazenda Recanto',
      city: 'Barreiras',
      state: BrazilianState.BA,
      totalAreaHectares: 450,
      arableAreaHectares: 300,
      vegetationAreaHectares: 150,
      producerId: mariaAgro.id,
    },
    {
      name: 'Fazenda Horizonte',
      city: 'Londrina',
      state: BrazilianState.PR,
      totalAreaHectares: 600,
      arableAreaHectares: 400,
      vegetationAreaHectares: 200,
      producerId: techFarm.id,
    },
    {
      name: 'Fazenda Nova Aurora',
      city: 'Cascavel',
      state: BrazilianState.PR,
      totalAreaHectares: 250,
      arableAreaHectares: 180,
      vegetationAreaHectares: 70,
      producerId: techFarm.id,
    },
  ];

  // Promise.all preserva a ordem de farmsData no array resultante — farms[N]
  // usado logo abaixo para montar os planted crops corresponde a farmsData[N].
  const farms = await Promise.all(
    farmsData.map((data) => prisma.farm.create({ data })),
  );

  await prisma.plantedCrop.createMany({
    data: [
      { farmId: farms[0].id, seasonId: season2024.id, cropId: soja.id },
      { farmId: farms[0].id, seasonId: season2024.id, cropId: milho.id },
      { farmId: farms[0].id, seasonId: season2023.id, cropId: soja.id },
      { farmId: farms[1].id, seasonId: season2024.id, cropId: cafe.id },
      { farmId: farms[2].id, seasonId: season2025.id, cropId: soja.id },
      { farmId: farms[2].id, seasonId: season2025.id, cropId: algodao.id },
      { farmId: farms[3].id, seasonId: season2024.id, cropId: milho.id },
      { farmId: farms[4].id, seasonId: season2023.id, cropId: cafe.id },
      { farmId: farms[5].id, seasonId: season2025.id, cropId: soja.id },
    ],
  });

  console.log(
    `Seed: concluído — 3 producers, ${farmsData.length} farms, 3 seasons, 4 crops, 9 planted crops.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed falhou:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
