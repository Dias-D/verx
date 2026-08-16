// Teste unitário do Service — contra um FAKE da porta, nunca um mock do
// ORM (o service não conhece detalhe de persistência, só a porta, ver
// praticas.md).

import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  PLANTED_CROP_REPOSITORY,
  PlantedCropRepositoryPort,
} from '../domain/planted-crop.repository.port';
import { FarmNotFoundError } from '../domain/farm-not-found.error';
import { SeasonNotFoundError } from '../domain/season-not-found.error';
import { CropNotFoundError } from '../domain/crop-not-found.error';
import { buildPlantedCrop } from '../test-support/planted-crop.fixture';
import { PlantedCropsService } from './planted-crops.service';

describe('PlantedCropsService', () => {
  let service: PlantedCropsService;
  const fakeRepository: jest.Mocked<PlantedCropRepositoryPort> = {
    createMany: jest.fn(),
    findByFarm: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PlantedCropsService,
        { provide: PLANTED_CROP_REPOSITORY, useValue: fakeRepository },
      ],
    }).compile();
    service = module.get(PlantedCropsService);
  });

  describe('createMany', () => {
    it('insere um lote válido com N associações', async () => {
      const farmId = 'farm-1';
      const items = [
        { seasonId: 'season-1', cropId: 'crop-1' },
        { seasonId: 'season-1', cropId: 'crop-2' },
      ];
      const created = items.map((item) =>
        buildPlantedCrop({ farmId, ...item }),
      );
      fakeRepository.createMany.mockResolvedValue(created);

      const result = await service.createMany(farmId, { items });

      expect(fakeRepository.createMany).toHaveBeenCalledWith(farmId, items);
      expect(result).toBe(created);
    });

    it('rejeita um lote com seasonId+cropId duplicado dentro do próprio array antes de tocar o banco', async () => {
      const farmId = 'farm-1';
      const items = [
        { seasonId: 'season-1', cropId: 'crop-1' },
        { seasonId: 'season-1', cropId: 'crop-1' },
      ];

      await expect(service.createMany(farmId, { items })).rejects.toThrow(
        BadRequestException,
      );
      expect(fakeRepository.createMany).not.toHaveBeenCalled();
    });

    it('propaga FarmNotFoundError quando o farmId não existe (mapeado para 404 no controller)', async () => {
      const farmId = 'farm-inexistente';
      const items = [{ seasonId: 'season-1', cropId: 'crop-1' }];
      fakeRepository.createMany.mockRejectedValue(
        new FarmNotFoundError(farmId),
      );

      await expect(service.createMany(farmId, { items })).rejects.toThrow(
        FarmNotFoundError,
      );
    });

    it('propaga SeasonNotFoundError quando um seasonId do lote não existe', async () => {
      const farmId = 'farm-1';
      const items = [{ seasonId: 'season-inexistente', cropId: 'crop-1' }];
      fakeRepository.createMany.mockRejectedValue(
        new SeasonNotFoundError('season-inexistente'),
      );

      await expect(service.createMany(farmId, { items })).rejects.toThrow(
        SeasonNotFoundError,
      );
    });

    it('propaga CropNotFoundError quando um cropId do lote não existe', async () => {
      const farmId = 'farm-1';
      const items = [{ seasonId: 'season-1', cropId: 'crop-inexistente' }];
      fakeRepository.createMany.mockRejectedValue(
        new CropNotFoundError('crop-inexistente'),
      );

      await expect(service.createMany(farmId, { items })).rejects.toThrow(
        CropNotFoundError,
      );
    });
  });

  describe('findByFarm', () => {
    it('respeita a paginação e devolve o envelope { data, meta }', async () => {
      const farmId = 'farm-1';
      const plantedCrops = [
        buildPlantedCrop({ farmId }),
        buildPlantedCrop({ farmId }),
      ];
      fakeRepository.findByFarm.mockResolvedValue({
        data: plantedCrops,
        total: 5,
      });

      const result = await service.findByFarm(farmId, { page: 2, limit: 2 });

      expect(fakeRepository.findByFarm).toHaveBeenCalledWith(farmId, {
        limit: 2,
        offset: 2,
      });
      expect(result).toEqual({
        data: plantedCrops,
        meta: { total: 5, page: 2, limit: 2 },
      });
    });
  });

  describe('delete', () => {
    it('delega a remoção ao repositório', async () => {
      fakeRepository.delete.mockResolvedValue(undefined);

      await service.delete('planted-crop-1');

      expect(fakeRepository.delete).toHaveBeenCalledWith('planted-crop-1');
    });
  });
});
