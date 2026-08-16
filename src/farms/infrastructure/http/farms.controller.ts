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
import { ApiTags } from '@nestjs/swagger';
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
  findMany(@Query() query: FindFarmsQueryDto) {
    const { page, limit, producerId, state, city } = query;
    return this.service.findMany({ producerId, state, city }, { page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
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
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
