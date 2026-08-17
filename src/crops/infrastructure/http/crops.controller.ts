// Adapter de entrada — controller fino: só HTTP + delegação pro Service.
// Nenhuma regra de negócio aqui. O Service já lança NotFoundException/
// ConflictException diretamente (ver crops.service.ts), então o controller
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
import { CreateCropDto } from '../../application/dto/create-crop.dto';
import { UpdateCropDto } from '../../application/dto/update-crop.dto';
import { CropsService } from '../../application/crops.service';

@ApiTags('crops')
@Controller('crops')
export class CropsController {
  constructor(private readonly service: CropsService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra uma cultura (catálogo, name único)' })
  @ApiCreatedResponse({ description: 'Crop criada com sucesso.' })
  @ApiConflictResponse({ description: 'Já existe uma crop com este name.' })
  create(@Body() dto: CreateCropDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista crops (paginado)' })
  @ApiOkResponse({ description: 'Lista paginada de crops.' })
  findMany(@Query() query: PaginationQueryDto) {
    return this.service.findMany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma crop pelo id' })
  @ApiOkResponse({ description: 'Crop encontrada.' })
  @ApiNotFoundResponse({ description: 'Crop não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente uma crop' })
  @ApiOkResponse({ description: 'Crop atualizada.' })
  @ApiNotFoundResponse({ description: 'Crop não encontrada.' })
  update(@Param('id') id: string, @Body() dto: UpdateCropDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove uma crop (bloqueado se houver planted-crop vinculado)',
  })
  @ApiNotFoundResponse({ description: 'Crop não encontrada.' })
  @ApiConflictResponse({
    description:
      'Crop vinculada a um planted-crop — exclusão bloqueada (histórico).',
  })
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
