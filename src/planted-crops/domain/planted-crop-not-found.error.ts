// Erro de domínio — lançado pelo adapter de persistência quando o registro a
// remover não existe (Prisma P2025). O controller mapeia isto para 404.

export class PlantedCropNotFoundError extends Error {
  constructor(id: string) {
    super(`PlantedCrop with id ${id} not found`);
    this.name = 'PlantedCropNotFoundError';
  }
}
