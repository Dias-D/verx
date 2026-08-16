// Erro de domínio — lançado pelo adapter de persistência quando a constraint
// de FK do cropId falha (violação P2003 capturada e traduzida). O
// controller mapeia isto para 404.

export class CropNotFoundError extends Error {
  constructor(cropId: string) {
    super(`Crop with id ${cropId} not found`);
    this.name = 'CropNotFoundError';
  }
}
