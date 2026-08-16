// Adapter de entrada — controller fino: só HTTP + delegação pro Service.
// Nenhuma regra de negócio aqui. Traduz os erros de domínio
// Farm/Season/CropNotFoundError (lançados pelo adapter de persistência via
// violação de FK) e PlantedCropNotFoundError (via P2025 no delete) para 404.
//
// Sem PATCH: a associação farm+season+crop é tratada como atômica —
// corrigir significa DELETE + POST novo, não editar um vínculo existente
// (ver arquitetura.md#design-de-endpoints-rest).

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreatePlantedCropBatchDto } from '../../application/dto/create-planted-crop-batch.dto';
import { PlantedCropsService } from '../../application/planted-crops.service';
import { CropNotFoundError } from '../../domain/crop-not-found.error';
import { FarmNotFoundError } from '../../domain/farm-not-found.error';
import { PlantedCropNotFoundError } from '../../domain/planted-crop-not-found.error';
import { SeasonNotFoundError } from '../../domain/season-not-found.error';

@ApiTags('planted-crops')
@Controller('farms/:farmId/planted-crops')
export class PlantedCropsController {
  constructor(private readonly service: PlantedCropsService) {}

  @Post()
  async createMany(
    @Param('farmId') farmId: string,
    @Body() dto: CreatePlantedCropBatchDto,
  ) {
    try {
      return await this.service.createMany(farmId, dto);
    } catch (error) {
      if (
        error instanceof FarmNotFoundError ||
        error instanceof SeasonNotFoundError ||
        error instanceof CropNotFoundError
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get()
  findByFarm(
    @Param('farmId') farmId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.findByFarm(farmId, {
      page: query.page,
      limit: query.limit,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    try {
      await this.service.delete(id);
    } catch (error) {
      if (error instanceof PlantedCropNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
