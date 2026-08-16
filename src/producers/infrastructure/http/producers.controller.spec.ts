// Controller fino — só HTTP + delegação. Teste unitário com o Service
// mockado (o teste HTTP completo, incluindo o ValidationPipe real, fica em
// test/producers.e2e-spec.ts).

import { Test } from '@nestjs/testing';
import { CreateProducerDto } from '../../application/dto/create-producer.dto';
import { UpdateProducerDto } from '../../application/dto/update-producer.dto';
import { ProducersService } from '../../application/producers.service';
import { buildProducer } from '../../test-support/producer.fixture';
import { ProducersController } from './producers.controller';

describe('ProducersController', () => {
  let controller: ProducersController;
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
      controllers: [ProducersController],
      providers: [{ provide: ProducersService, useValue: serviceMock }],
    }).compile();
    controller = module.get(ProducersController);
  });

  it('delega a criação ao service', async () => {
    const producer = buildProducer();
    const dto: CreateProducerDto = {
      name: producer.name,
      document: producer.document,
    };
    serviceMock.create.mockResolvedValue(producer);

    await expect(controller.create(dto)).resolves.toBe(producer);
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
    const producer = buildProducer();
    serviceMock.findById.mockResolvedValue(producer);

    await expect(controller.findOne(producer.id)).resolves.toBe(producer);
    expect(serviceMock.findById).toHaveBeenCalledWith(producer.id);
  });

  it('delega a atualização ao service', async () => {
    const producer = buildProducer();
    const dto: UpdateProducerDto = { name: 'Novo Nome' };
    serviceMock.update.mockResolvedValue(producer);

    await expect(controller.update(producer.id, dto)).resolves.toBe(producer);
    expect(serviceMock.update).toHaveBeenCalledWith(producer.id, dto);
  });

  it('delega a remoção ao service', async () => {
    serviceMock.delete.mockResolvedValue(undefined);

    await controller.remove('some-id');

    expect(serviceMock.delete).toHaveBeenCalledWith('some-id');
  });
});
