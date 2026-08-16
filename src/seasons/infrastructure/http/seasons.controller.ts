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
import { ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateSeasonDto } from '../../application/dto/create-season.dto';
import { UpdateSeasonDto } from '../../application/dto/update-season.dto';
import { SeasonsService } from '../../application/seasons.service';

@ApiTags('seasons')
@Controller('seasons')
export class SeasonsController {
  constructor(private readonly service: SeasonsService) {}

  @Post()
  create(@Body() dto: CreateSeasonDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateSeasonDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
