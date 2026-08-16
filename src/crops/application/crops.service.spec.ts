// Teste unitário do Service — contra um FAKE da porta, nunca um mock do
// Prisma (o service não conhece o Prisma, só a porta, ver praticas.md).

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CropReferencedError } from '../domain/crop-referenced.error';
import {
  CROP_REPOSITORY,
  CropRepositoryPort,
} from '../domain/crop.repository.port';
import { buildCrop } from '../test-support/crop.fixture';
import { CropsService } from './crops.service';

describe('CropsService', () => {
  let service: CropsService;
  const fakeRepository: jest.Mocked<CropRepositoryPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CropsService,
        { provide: CROP_REPOSITORY, useValue: fakeRepository },
      ],
    }).compile();
    service = module.get(CropsService);
  });

  describe('create', () => {
    it('cria um crop com name inédito', async () => {
      const crop = buildCrop();
      fakeRepository.findByName.mockResolvedValue(null);
      fakeRepository.create.mockResolvedValue(crop);

      const result = await service.create({ name: crop.name });

      expect(fakeRepository.findByName).toHaveBeenCalledWith(crop.name);
      expect(fakeRepository.create).toHaveBeenCalledWith({
        name: crop.name,
      });
      expect(result).toBe(crop);
    });

    it('rejeita a criação quando o name já existe (ConflictException)', async () => {
      const existing = buildCrop();
      fakeRepository.findByName.mockResolvedValue(existing);

      await expect(service.create({ name: existing.name })).rejects.toThrow(
        ConflictException,
      );
      expect(fakeRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('retorna o crop quando encontrado', async () => {
      const crop = buildCrop();
      fakeRepository.findById.mockResolvedValue(crop);

      const result = await service.findById(crop.id);

      expect(result).toBe(crop);
    });

    it('lança NotFoundException quando o id não existe', async () => {
      fakeRepository.findById.mockResolvedValue(null);

      await expect(service.findById('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('atualiza um crop existente', async () => {
      const existing = buildCrop();
      const updated = buildCrop({ id: existing.id, name: 'Milho' });
      fakeRepository.findById.mockResolvedValue(existing);
      fakeRepository.update.mockResolvedValue(updated);

      const result = await service.update(existing.id, { name: 'Milho' });

      expect(fakeRepository.update).toHaveBeenCalledWith(existing.id, {
        name: 'Milho',
      });
      expect(result).toBe(updated);
    });

    it('lança NotFoundException ao atualizar um id inexistente', async () => {
      fakeRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('id-inexistente', { name: 'Milho' }),
      ).rejects.toThrow(NotFoundException);
      expect(fakeRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('remove um crop sem vínculo', async () => {
      const existing = buildCrop();
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

    it('lança ConflictException ao remover um crop vinculado a um planted-crop (FK Restrict)', async () => {
      const existing = buildCrop();
      fakeRepository.findById.mockResolvedValue(existing);
      fakeRepository.delete.mockRejectedValue(
        new CropReferencedError(existing.id),
      );

      await expect(service.delete(existing.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findMany', () => {
    it('respeita limit/offset e devolve o envelope { data, meta }', async () => {
      const crops = [buildCrop(), buildCrop()];
      fakeRepository.findMany.mockResolvedValue({
        data: crops,
        total: 42,
      });

      const result = await service.findMany({ page: 2, limit: 10 });

      expect(fakeRepository.findMany).toHaveBeenCalledWith({
        limit: 10,
        offset: 10,
      });
      expect(result).toEqual({
        data: crops,
        meta: { total: 42, page: 2, limit: 10 },
      });
    });
  });
});
