// Teste unitário do Service — contra um FAKE da porta, nunca um mock do
// Prisma (o service não conhece o Prisma, só a porta, ver praticas.md).

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SeasonReferencedError } from '../domain/season-referenced.error';
import {
  SEASON_REPOSITORY,
  SeasonRepositoryPort,
} from '../domain/season.repository.port';
import { buildSeason } from '../test-support/season.fixture';
import { SeasonsService } from './seasons.service';

describe('SeasonsService', () => {
  let service: SeasonsService;
  const fakeRepository: jest.Mocked<SeasonRepositoryPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByYear: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SeasonsService,
        { provide: SEASON_REPOSITORY, useValue: fakeRepository },
      ],
    }).compile();
    service = module.get(SeasonsService);
  });

  describe('create', () => {
    it('cria uma season com year inédito', async () => {
      const season = buildSeason();
      fakeRepository.findByYear.mockResolvedValue(null);
      fakeRepository.create.mockResolvedValue(season);

      const result = await service.create({ year: season.year });

      expect(fakeRepository.findByYear).toHaveBeenCalledWith(season.year);
      expect(fakeRepository.create).toHaveBeenCalledWith({
        year: season.year,
      });
      expect(result).toBe(season);
    });

    it('rejeita a criação quando o year já existe (ConflictException)', async () => {
      const existing = buildSeason();
      fakeRepository.findByYear.mockResolvedValue(existing);

      await expect(service.create({ year: existing.year })).rejects.toThrow(
        ConflictException,
      );
      expect(fakeRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('retorna a season quando encontrada', async () => {
      const season = buildSeason();
      fakeRepository.findById.mockResolvedValue(season);

      const result = await service.findById(season.id);

      expect(result).toBe(season);
    });

    it('lança NotFoundException quando o id não existe', async () => {
      fakeRepository.findById.mockResolvedValue(null);

      await expect(service.findById('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('atualiza uma season existente', async () => {
      const existing = buildSeason();
      const updated = buildSeason({ id: existing.id, year: 2022 });
      fakeRepository.findById.mockResolvedValue(existing);
      fakeRepository.update.mockResolvedValue(updated);

      const result = await service.update(existing.id, { year: 2022 });

      expect(fakeRepository.update).toHaveBeenCalledWith(existing.id, {
        year: 2022,
      });
      expect(result).toBe(updated);
    });

    it('lança NotFoundException ao atualizar um id inexistente', async () => {
      fakeRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('id-inexistente', { year: 2022 }),
      ).rejects.toThrow(NotFoundException);
      expect(fakeRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('remove uma season sem vínculo', async () => {
      const existing = buildSeason();
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

    it('lança ConflictException ao remover uma season vinculada a um planted-crop (FK Restrict)', async () => {
      const existing = buildSeason();
      fakeRepository.findById.mockResolvedValue(existing);
      fakeRepository.delete.mockRejectedValue(
        new SeasonReferencedError(existing.id),
      );

      await expect(service.delete(existing.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findMany', () => {
    it('respeita limit/offset e devolve o envelope { data, meta }', async () => {
      const seasons = [buildSeason(), buildSeason()];
      fakeRepository.findMany.mockResolvedValue({
        data: seasons,
        total: 42,
      });

      const result = await service.findMany({ page: 2, limit: 10 });

      expect(fakeRepository.findMany).toHaveBeenCalledWith({
        limit: 10,
        offset: 10,
      });
      expect(result).toEqual({
        data: seasons,
        meta: { total: 42, page: 2, limit: 10 },
      });
    });
  });
});
