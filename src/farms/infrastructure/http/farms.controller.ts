// Adapter de entrada — controller fino: só HTTP + delegação pro Service.
// Nenhuma regra de negócio aqui. Traduz o erro de domínio
// ProducerNotFoundError (lançado pelo adapter de persistência via violação
// de FK) para 404 (ver arquitetura.md#1-schema-e-migration).

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFarmDto } from '../../application/dto/create-farm.dto';
import { FindFarmsQueryDto } from '../../application/dto/find-farms-query.dto';
import { UpdateFarmDto } from '../../application/dto/update-farm.dto';
import { FarmsService } from '../../application/farms.service';
import { ProducerNotFoundError } from '../../domain/producer-not-found.error';

@ApiTags('farms')
@Controller('farms')
export class FarmsController {
  constructor(private readonly service: FarmsService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra uma propriedade rural vinculada a um producer',
  })
  @ApiCreatedResponse({ description: 'Farm criada com sucesso.' })
  @ApiBadRequestResponse({
    description:
      'A soma de arableAreaHectares + vegetationAreaHectares ultrapassa totalAreaHectares.',
  })
  @ApiNotFoundResponse({
    description: 'producerId não corresponde a nenhum produtor.',
  })
  async create(@Body() dto: CreateFarmDto) {
    try {
      return await this.service.create(dto);
    } catch (error) {
      if (error instanceof ProducerNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary:
      'Lista farms (paginado), com filtros opcionais producerId/state/city',
  })
  @ApiOkResponse({ description: 'Lista paginada de farms.' })
  findMany(@Query() query: FindFarmsQueryDto) {
    const { page, limit, producerId, state, city } = query;
    return this.service.findMany({ producerId, state, city }, { page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma farm pelo id' })
  @ApiOkResponse({ description: 'Farm encontrada.' })
  @ApiNotFoundResponse({ description: 'Farm não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente uma farm' })
  @ApiOkResponse({ description: 'Farm atualizada.' })
  @ApiBadRequestResponse({
    description:
      'A soma de área agricultável + vegetação (mesclada com o estado persistido) ultrapassa a área total.',
  })
  @ApiNotFoundResponse({ description: 'Farm não encontrada.' })
  async update(@Param('id') id: string, @Body() dto: UpdateFarmDto) {
    try {
      return await this.service.update(id, dto);
    } catch (error) {
      if (error instanceof ProducerNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma farm (cascade em seus planted-crops)' })
  @ApiNotFoundResponse({ description: 'Farm não encontrada.' })
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
