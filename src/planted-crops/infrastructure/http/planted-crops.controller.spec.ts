// Controller fino — só HTTP + delegação. Teste unitário com o Service
// mockado (o teste HTTP completo, incluindo o ValidationPipe real, fica em
// test/planted-crops.e2e-spec.ts).

import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreatePlantedCropBatchDto } from '../../application/dto/create-planted-crop-batch.dto';
import { PlantedCropsService } from '../../application/planted-crops.service';
import { CropNotFoundError } from '../../domain/crop-not-found.error';
import { FarmNotFoundError } from '../../domain/farm-not-found.error';
import { PlantedCropNotFoundError } from '../../domain/planted-crop-not-found.error';
import { SeasonNotFoundError } from '../../domain/season-not-found.error';
import { buildPlantedCrop } from '../../test-support/planted-crop.fixture';
import { PlantedCropsController } from './planted-crops.controller';

describe('PlantedCropsController', () => {
  let controller: PlantedCropsController;
  const serviceMock = {
    createMany: jest.fn(),
    findByFarm: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [PlantedCropsController],
      providers: [{ provide: PlantedCropsService, useValue: serviceMock }],
    }).compile();
    controller = module.get(PlantedCropsController);
  });

  it('delega a criação em lote ao service', async () => {
    const farmId = 'farm-1';
    const dto: CreatePlantedCropBatchDto = {
      items: [{ seasonId: 'season-1', cropId: 'crop-1' }],
    };
    const created = [buildPlantedCrop({ farmId })];
    serviceMock.createMany.mockResolvedValue(created);

    await expect(controller.createMany(farmId, dto)).resolves.toBe(created);
    expect(serviceMock.createMany).toHaveBeenCalledWith(farmId, dto);
  });

  it('traduz FarmNotFoundError em NotFoundException (404) na criação', async () => {
    serviceMock.createMany.mockRejectedValue(
      new FarmNotFoundError('farm-inexistente'),
    );

    await expect(
      controller.createMany('farm-inexistente', {
        items: [{ seasonId: 'season-1', cropId: 'crop-1' }],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('traduz SeasonNotFoundError em NotFoundException (404) na criação', async () => {
    serviceMock.createMany.mockRejectedValue(
      new SeasonNotFoundError('season-inexistente'),
    );

    await expect(
      controller.createMany('farm-1', {
        items: [{ seasonId: 'season-inexistente', cropId: 'crop-1' }],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('traduz CropNotFoundError em NotFoundException (404) na criação', async () => {
    serviceMock.createMany.mockRejectedValue(
      new CropNotFoundError('crop-inexistente'),
    );

    await expect(
      controller.createMany('farm-1', {
        items: [{ seasonId: 'season-1', cropId: 'crop-inexistente' }],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('delega a listagem paginada ao service', async () => {
    const envelope = { data: [], meta: { total: 0, page: 1, limit: 20 } };
    serviceMock.findByFarm.mockResolvedValue(envelope);

    const query = { page: 1, limit: 20 };
    await expect(controller.findByFarm('farm-1', query)).resolves.toBe(
      envelope,
    );
    expect(serviceMock.findByFarm).toHaveBeenCalledWith('farm-1', {
      page: 1,
      limit: 20,
    });
  });

  it('delega a remoção ao service', async () => {
    serviceMock.delete.mockResolvedValue(undefined);

    await controller.remove('planted-crop-1');

    expect(serviceMock.delete).toHaveBeenCalledWith('planted-crop-1');
  });

  it('traduz PlantedCropNotFoundError em NotFoundException (404) na remoção', async () => {
    serviceMock.delete.mockRejectedValue(
      new PlantedCropNotFoundError('id-inexistente'),
    );

    await expect(controller.remove('id-inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });
});
