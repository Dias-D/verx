// Teste unitário do Service — contra um FAKE da porta, nunca um mock do
// Prisma (o service não conhece o Prisma, só a porta, ver praticas.md).

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import {
  PRODUCER_REPOSITORY,
  ProducerRepositoryPort,
} from '../domain/producer.repository.port';
import { buildProducer } from '../test-support/producer.fixture';
import { ProducersService } from './producers.service';

describe('ProducersService', () => {
  let service: ProducersService;
  const fakeRepository: jest.Mocked<ProducerRepositoryPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByDocument: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  };
  const loggerMock: Pick<Logger, 'log'> = { log: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProducersService,
        { provide: PRODUCER_REPOSITORY, useValue: fakeRepository },
        { provide: Logger, useValue: loggerMock },
      ],
    }).compile();
    service = module.get(ProducersService);
  });

  describe('create', () => {
    it('cria um producer com documento válido', async () => {
      const producer = buildProducer();
      fakeRepository.findByDocument.mockResolvedValue(null);
      fakeRepository.create.mockResolvedValue(producer);

      const result = await service.create({
        name: producer.name,
        document: producer.document,
      });

      expect(fakeRepository.findByDocument).toHaveBeenCalledWith(
        producer.document,
      );
      expect(fakeRepository.create).toHaveBeenCalledWith({
        name: producer.name,
        document: producer.document,
      });
      expect(result).toBe(producer);
    });

    it('loga o evento de negócio só com o id — nunca o document (ver praticas.md#observabilidade)', async () => {
      const producer = buildProducer();
      fakeRepository.findByDocument.mockResolvedValue(null);
      fakeRepository.create.mockResolvedValue(producer);

      await service.create({
        name: producer.name,
        document: producer.document,
      });

      expect(loggerMock.log).toHaveBeenCalledWith(
        { producerId: producer.id },
        'Producer created',
      );
    });

    it('rejeita a criação quando o documento já existe (ConflictException)', async () => {
      const existing = buildProducer();
      fakeRepository.findByDocument.mockResolvedValue(existing);

      await expect(
        service.create({ name: 'Novo Nome', document: existing.document }),
      ).rejects.toThrow(ConflictException);
      expect(fakeRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('retorna o producer quando encontrado', async () => {
      const producer = buildProducer();
      fakeRepository.findById.mockResolvedValue(producer);

      const result = await service.findById(producer.id);

      expect(result).toBe(producer);
    });

    it('lança NotFoundException quando o id não existe', async () => {
      fakeRepository.findById.mockResolvedValue(null);

      await expect(service.findById('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('atualiza um producer existente', async () => {
      const existing = buildProducer();
      const updated = buildProducer({ id: existing.id, name: 'Atualizado' });
      fakeRepository.findById.mockResolvedValue(existing);
      fakeRepository.update.mockResolvedValue(updated);

      const result = await service.update(existing.id, {
        name: 'Atualizado',
      });

      expect(fakeRepository.update).toHaveBeenCalledWith(existing.id, {
        name: 'Atualizado',
      });
      expect(result).toBe(updated);
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
    it('remove um producer existente', async () => {
      const existing = buildProducer();
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
    it('respeita limit/offset e devolve o envelope { data, meta }', async () => {
      const producers = [buildProducer(), buildProducer()];
      fakeRepository.findMany.mockResolvedValue({
        data: producers,
        total: 42,
      });

      const result = await service.findMany({ page: 2, limit: 10 });

      expect(fakeRepository.findMany).toHaveBeenCalledWith({
        limit: 10,
        offset: 10,
      });
      expect(result).toEqual({
        data: producers,
        meta: { total: 42, page: 2, limit: 10 },
      });
    });
  });
});
