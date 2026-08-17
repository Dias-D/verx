// Adapter de entrada — controller fino: só HTTP + delegação pro Service.
// Nenhuma regra de negócio aqui. O Service já lança NotFoundException/
// ConflictException diretamente (ver seasons.service.ts), então o controller
// não precisa traduzir nenhum erro de domínio aqui.

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
import { CreateSeasonDto } from '../../application/dto/create-season.dto';
import { UpdateSeasonDto } from '../../application/dto/update-season.dto';
import { SeasonsService } from '../../application/seasons.service';

@ApiTags('seasons')
@Controller('seasons')
export class SeasonsController {
  constructor(private readonly service: SeasonsService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra uma safra (catálogo, year único)' })
  @ApiCreatedResponse({ description: 'Season criada com sucesso.' })
  @ApiConflictResponse({ description: 'Já existe uma season com este year.' })
  create(@Body() dto: CreateSeasonDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista seasons (paginado)' })
  @ApiOkResponse({ description: 'Lista paginada de seasons.' })
  findMany(@Query() query: PaginationQueryDto) {
    return this.service.findMany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma season pelo id' })
  @ApiOkResponse({ description: 'Season encontrada.' })
  @ApiNotFoundResponse({ description: 'Season não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente uma season' })
  @ApiOkResponse({ description: 'Season atualizada.' })
  @ApiNotFoundResponse({ description: 'Season não encontrada.' })
  update(@Param('id') id: string, @Body() dto: UpdateSeasonDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove uma season (bloqueado se houver planted-crop vinculado)',
  })
  @ApiNotFoundResponse({ description: 'Season não encontrada.' })
  @ApiConflictResponse({
    description:
      'Season vinculada a um planted-crop — exclusão bloqueada (histórico).',
  })
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
