// Teste unitário do Service — contra um FAKE da porta, nunca um mock do
// ORM (o service não conhece detalhe de persistência, só a porta, ver
// praticas.md).

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FARM_REPOSITORY,
  FarmRepositoryPort,
} from '../domain/farm.repository.port';
import { buildFarm } from '../test-support/farm.fixture';
import { FarmsService } from './farms.service';

describe('FarmsService', () => {
  let service: FarmsService;
  const fakeRepository: jest.Mocked<FarmRepositoryPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        FarmsService,
        { provide: FARM_REPOSITORY, useValue: fakeRepository },
      ],
    }).compile();
    service = module.get(FarmsService);
  });

  describe('create', () => {
    it('cria uma farm com áreas válidas', async () => {
      const farm = buildFarm();
      fakeRepository.create.mockResolvedValue(farm);

      const result = await service.create({
        name: farm.name,
        city: farm.city,
        state: farm.state,
        totalAreaHectares: farm.totalAreaHectares,
        arableAreaHectares: farm.arableAreaHectares,
        vegetationAreaHectares: farm.vegetationAreaHectares,
        producerId: farm.producerId,
      });

      expect(fakeRepository.create).toHaveBeenCalledWith({
        name: farm.name,
        city: farm.city,
        state: farm.state,
        totalAreaHectares: farm.totalAreaHectares,
        arableAreaHectares: farm.arableAreaHectares,
        vegetationAreaHectares: farm.vegetationAreaHectares,
        producerId: farm.producerId,
      });
      expect(result).toBe(farm);
    });

    it('rejeita a criação quando a soma de área ultrapassa o total (BadRequestException)', async () => {
      await expect(
        service.create({
          name: 'Fazenda Inválida',
          city: 'Cidade X',
          state: 'SP',
          totalAreaHectares: 100,
          arableAreaHectares: 60,
          vegetationAreaHectares: 40.01,
          producerId: 'producer-id',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(fakeRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('retorna a farm quando encontrada', async () => {
      const farm = buildFarm();
      fakeRepository.findById.mockResolvedValue(farm);

      const result = await service.findById(farm.id);

      expect(result).toBe(farm);
    });

    it('lança NotFoundException quando o id não existe', async () => {
      fakeRepository.findById.mockResolvedValue(null);

      await expect(service.findById('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('atualiza uma farm existente revalidando a área mesclada com o estado persistido', async () => {
      const existing = buildFarm({
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
      });
      const updated = buildFarm({
        id: existing.id,
        totalAreaHectares: 100,
        arableAreaHectares: 70,
        vegetationAreaHectares: 30,
      });
      fakeRepository.findById.mockResolvedValue(existing);
      fakeRepository.update.mockResolvedValue(updated);

      const result = await service.update(existing.id, {
        arableAreaHectares: 70,
        vegetationAreaHectares: 30,
      });

      expect(fakeRepository.update).toHaveBeenCalledWith(existing.id, {
        arableAreaHectares: 70,
        vegetationAreaHectares: 30,
      });
      expect(result).toBe(updated);
    });

    it('rejeita PATCH cuja área mesclada com o estado persistido ultrapassa o total (BadRequestException)', async () => {
      const existing = buildFarm({
        totalAreaHectares: 100,
        arableAreaHectares: 60,
        vegetationAreaHectares: 40,
      });
      fakeRepository.findById.mockResolvedValue(existing);

      // Só arableAreaHectares muda no payload; o DTO sozinho não veria que
      // 90 + 40 (vegetation já persistida) ultrapassa o total de 100 — é
      // exatamente o caso que exige mesclar com o estado persistido.
      await expect(
        service.update(existing.id, { arableAreaHectares: 90 }),
      ).rejects.toThrow(BadRequestException);
      expect(fakeRepository.update).not.toHaveBeenCalled();
    });

    it('lança NotFoundException ao atualizar um id inexistente', async () => {
      fakeRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('id-inexistente', { name: 'Qualquer' }),
      ).rejects.toThrow(NotFoundException);
      expect(fakeRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('remove uma farm existente', async () => {
      const existing = buildFarm();
      fakeRepository.findById.mockResolvedValue(existing);
      fakeRepository.delete.mockResolvedValue(undefined);

      await service.delete(existing.id);

      expect(fakeRepository.delete).toHaveBeenCalledWith(existing.id);
    });

    it('lança NotFoundException ao remover um id inexistente', async () => {
      fakeRepository.findById.mockResolvedValue(null);

      await expect(service.delete('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
      expect(fakeRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('findMany', () => {
    it('respeita filtros (producerId/state/city) e limit/offset, devolvendo o envelope { data, meta }', async () => {
      const farms = [buildFarm(), buildFarm()];
      fakeRepository.findMany.mockResolvedValue({ data: farms, total: 7 });

      const result = await service.findMany(
        { producerId: 'producer-1', state: 'SP', city: 'Ribeirão Preto' },
        { page: 2, limit: 5 },
      );

      expect(fakeRepository.findMany).toHaveBeenCalledWith(
        { producerId: 'producer-1', state: 'SP', city: 'Ribeirão Preto' },
        { limit: 5, offset: 5 },
      );
      expect(result).toEqual({
        data: farms,
        meta: { total: 7, page: 2, limit: 5 },
      });
    });
  });
});
