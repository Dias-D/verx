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
import { ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateCropDto } from '../../application/dto/create-crop.dto';
import { UpdateCropDto } from '../../application/dto/update-crop.dto';
import { CropsService } from '../../application/crops.service';

@ApiTags('crops')
@Controller('crops')
export class CropsController {
  constructor(private readonly service: CropsService) {}

  @Post()
  create(@Body() dto: CreateCropDto) {
    return this.service.create(dto);
  }

  @Get()
  findMany(@Query() query: PaginationQueryDto) {
    return this.service.findMany(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCropDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
