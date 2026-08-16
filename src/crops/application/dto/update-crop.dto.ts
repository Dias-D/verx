// DTO de atualização — todos os campos do Create viram opcionais.
import { PartialType } from '@nestjs/swagger';
import { CreateCropDto } from './create-crop.dto';

export class UpdateCropDto extends PartialType(CreateCropDto) {}
