// Adapter de entrada — controller fino: só HTTP + delegação pro Service.
// Nenhuma regra de negócio aqui.

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateProducerDto } from '../../application/dto/create-producer.dto';
import { UpdateProducerDto } from '../../application/dto/update-producer.dto';
import { ProducersService } from '../../application/producers.service';

@ApiTags('producers')
@Controller('producers')
export class ProducersController {
  constructor(private readonly service: ProducersService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um produtor rural (CPF ou CNPJ)' })
  @ApiCreatedResponse({ description: 'Produtor criado com sucesso.' })
  @ApiConflictResponse({
    description: 'Já existe um produtor com este document.',
  })
  create(@Body() dto: CreateProducerDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista produtores (paginado)' })
  @ApiOkResponse({ description: 'Lista paginada de produtores.' })
  findMany(@Query() query: PaginationQueryDto) {
    return this.service.findMany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um produtor pelo id' })
  @ApiOkResponse({ description: 'Produtor encontrado.' })
  @ApiNotFoundResponse({ description: 'Produtor não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente um produtor' })
  @ApiOkResponse({ description: 'Produtor atualizado.' })
  @ApiNotFoundResponse({ description: 'Produtor não encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateProducerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um produtor (cascade em suas farms)' })
  @ApiNotFoundResponse({ description: 'Produtor não encontrado.' })
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
