// Controller fino — só HTTP + delegação. Teste unitário com o Service
// mockado (o teste HTTP completo fica em test/seasons.e2e-spec.ts).

import { Test } from '@nestjs/testing';
import { CreateSeasonDto } from '../../application/dto/create-season.dto';
import { UpdateSeasonDto } from '../../application/dto/update-season.dto';
import { SeasonsService } from '../../application/seasons.service';
import { buildSeason } from '../../test-support/season.fixture';
import { SeasonsController } from './seasons.controller';

describe('SeasonsController', () => {
  let controller: SeasonsController;
  const serviceMock = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [SeasonsController],
      providers: [{ provide: SeasonsService, useValue: serviceMock }],
    }).compile();
    controller = module.get(SeasonsController);
  });

  it('delega a criação ao service', async () => {
    const season = buildSeason();
    const dto: CreateSeasonDto = { year: season.year };
    serviceMock.create.mockResolvedValue(season);

    await expect(controller.create(dto)).resolves.toBe(season);
    expect(serviceMock.create).toHaveBeenCalledWith(dto);
  });

  it('delega a listagem paginada ao service', async () => {
    const envelope = { data: [], meta: { total: 0, page: 1, limit: 20 } };
    serviceMock.findMany.mockResolvedValue(envelope);

    const query = { page: 1, limit: 20 };
    await expect(controller.findMany(query)).resolves.toBe(envelope);
    expect(serviceMock.findMany).toHaveBeenCalledWith(query);
  });

  it('delega a busca por id ao service', async () => {
    const season = buildSeason();
    serviceMock.findById.mockResolvedValue(season);

    await expect(controller.findOne(season.id)).resolves.toBe(season);
    expect(serviceMock.findById).toHaveBeenCalledWith(season.id);
  });

  it('delega a atualização ao service', async () => {
    const season = buildSeason();
    const dto: UpdateSeasonDto = { year: 2022 };
    serviceMock.update.mockResolvedValue(season);

    await expect(controller.update(season.id, dto)).resolves.toBe(season);
    expect(serviceMock.update).toHaveBeenCalledWith(season.id, dto);
  });

  it('delega a remoção ao service', async () => {
    serviceMock.delete.mockResolvedValue(undefined);

    await controller.remove('some-id');

    expect(serviceMock.delete).toHaveBeenCalledWith('some-id');
  });
});
