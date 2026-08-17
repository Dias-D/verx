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
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({
    summary:
      'Registra um lote de culturas plantadas (farm+season+crop) para a farm',
  })
  @ApiCreatedResponse({ description: 'Lote registrado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Item duplicado dentro do próprio lote enviado.',
  })
  @ApiNotFoundResponse({
    description:
      'A farm, ou alguma season/crop referenciada no lote, não existe.',
  })
  @ApiConflictResponse({
    description: 'Combinação farm+season+crop já registrada anteriormente.',
  })
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
  @ApiOperation({ summary: 'Lista culturas plantadas de uma farm (paginado)' })
  @ApiOkResponse({ description: 'Lista paginada de planted-crops da farm.' })
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
  @ApiOperation({ summary: 'Remove um vínculo de cultura plantada' })
  @ApiNotFoundResponse({
    description: 'Vínculo de cultura plantada não encontrado.',
  })
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
