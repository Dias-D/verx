// DTO de atualização — todos os campos do Create viram opcionais.
import { PartialType } from '@nestjs/swagger';
import { CreateProducerDto } from './create-producer.dto';

export class UpdateProducerDto extends PartialType(CreateProducerDto) {}
