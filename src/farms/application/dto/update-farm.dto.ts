// DTO de atualização — todos os campos do Create viram opcionais. A regra
// de área cross-field não é totalmente verificável aqui quando só um
// subconjunto dos três campos chega (@IsValidArea ignora esse caso) — é
// o Service quem revalida mesclando com o estado persistido.
import { PartialType } from '@nestjs/swagger';
import { CreateFarmDto } from './create-farm.dto';

export class UpdateFarmDto extends PartialType(CreateFarmDto) {}
