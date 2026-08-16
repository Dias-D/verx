// Controller fino — só HTTP + delegação. Teste unitário com o Service
// mockado (o teste HTTP completo, incluindo o ValidationPipe real, fica em
// test/farms.e2e-spec.ts).

import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreateFarmDto } from '../../application/dto/create-farm.dto';
import { UpdateFarmDto } from '../../application/dto/update-farm.dto';
import { FarmsService } from '../../application/farms.service';
import { ProducerNotFoundError } from '../../domain/producer-not-found.error';
import { buildFarm } from '../../test-support/farm.fixture';
import { FarmsController } from './farms.controller';

describe('FarmsController', () => {
  let controller: FarmsController;
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
      controllers: [FarmsController],
      providers: [{ provide: FarmsService, useValue: serviceMock }],
    }).compile();
    controller = module.get(FarmsController);
  });

  it('delega a criação ao service', async () => {
    const farm = buildFarm();
    const dto: CreateFarmDto = {
      name: farm.name,
      city: farm.city,
      state: farm.state,
      totalAreaHectares: farm.totalAreaHectares,
      arableAreaHectares: farm.arableAreaHectares,
      vegetationAreaHectares: farm.vegetationAreaHectares,
      producerId: farm.producerId,
    };
    serviceMock.create.mockResolvedValue(farm);

    await expect(controller.create(dto)).resolves.toBe(farm);
    expect(serviceMock.create).toHaveBeenCalledWith(dto);
  });

  it('traduz ProducerNotFoundError em NotFoundException (404) na criação', async () => {
    const dto: CreateFarmDto = {
      name: 'Fazenda',
      city: 'Cidade',
      state: 'SP',
      totalAreaHectares: 100,
      arableAreaHectares: 60,
      vegetationAreaHectares: 40,
      producerId: 'id-inexistente',
    };
    serviceMock.create.mockRejectedValue(
      new ProducerNotFoundError('id-inexistente'),
    );

    await expect(controller.create(dto)).rejects.toThrow(NotFoundException);
  });

  it('delega a listagem paginada e filtrada ao service', async () => {
    const envelope = { data: [], meta: { total: 0, page: 1, limit: 20 } };
    serviceMock.findMany.mockResolvedValue(envelope);

    const query = {
      page: 1,
      limit: 20,
      producerId: 'producer-1',
      state: 'SP' as const,
      city: 'Campinas',
    };
    await expect(controller.findMany(query)).resolves.toBe(envelope);
    expect(serviceMock.findMany).toHaveBeenCalledWith(
      { producerId: 'producer-1', state: 'SP', city: 'Campinas' },
      { page: 1, limit: 20 },
    );
  });

  it('delega a busca por id ao service', async () => {
    const farm = buildFarm();
    serviceMock.findById.mockResolvedValue(farm);

    await expect(controller.findOne(farm.id)).resolves.toBe(farm);
    expect(serviceMock.findById).toHaveBeenCalledWith(farm.id);
  });

  it('delega a atualização ao service', async () => {
    const farm = buildFarm();
    const dto: UpdateFarmDto = { name: 'Novo Nome' };
    serviceMock.update.mockResolvedValue(farm);

    await expect(controller.update(farm.id, dto)).resolves.toBe(farm);
    expect(serviceMock.update).toHaveBeenCalledWith(farm.id, dto);
  });

  it('traduz ProducerNotFoundError em NotFoundException (404) na atualização', async () => {
    serviceMock.update.mockRejectedValue(
      new ProducerNotFoundError('id-inexistente'),
    );

    await expect(
      controller.update('farm-id', { producerId: 'id-inexistente' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('delega a remoção ao service', async () => {
    serviceMock.delete.mockResolvedValue(undefined);

    await controller.remove('some-id');

    expect(serviceMock.delete).toHaveBeenCalledWith('some-id');
  });
});
