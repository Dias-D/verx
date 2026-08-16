// Controller fino — só HTTP + delegação. Teste unitário com o Service
// mockado (o teste HTTP completo fica em test/crops.e2e-spec.ts).

import { Test } from '@nestjs/testing';
import { CreateCropDto } from '../../application/dto/create-crop.dto';
import { UpdateCropDto } from '../../application/dto/update-crop.dto';
import { CropsService } from '../../application/crops.service';
import { buildCrop } from '../../test-support/crop.fixture';
import { CropsController } from './crops.controller';

describe('CropsController', () => {
  let controller: CropsController;
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
      controllers: [CropsController],
      providers: [{ provide: CropsService, useValue: serviceMock }],
    }).compile();
    controller = module.get(CropsController);
  });

  it('delega a criação ao service', async () => {
    const crop = buildCrop();
    const dto: CreateCropDto = { name: crop.name };
    serviceMock.create.mockResolvedValue(crop);

    await expect(controller.create(dto)).resolves.toBe(crop);
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
    const crop = buildCrop();
    serviceMock.findById.mockResolvedValue(crop);

    await expect(controller.findOne(crop.id)).resolves.toBe(crop);
    expect(serviceMock.findById).toHaveBeenCalledWith(crop.id);
  });

  it('delega a atualização ao service', async () => {
    const crop = buildCrop();
    const dto: UpdateCropDto = { name: 'Milho' };
    serviceMock.update.mockResolvedValue(crop);

    await expect(controller.update(crop.id, dto)).resolves.toBe(crop);
    expect(serviceMock.update).toHaveBeenCalledWith(crop.id, dto);
  });

  it('delega a remoção ao service', async () => {
    serviceMock.delete.mockResolvedValue(undefined);

    await controller.remove('some-id');

    expect(serviceMock.delete).toHaveBeenCalledWith('some-id');
  });
});
