// Erro de domínio — lançado pelo adapter de persistência quando o DELETE de
// um Crop viola a constraint de FK (onDelete: Restrict em
// PlantedCrop.cropId, violação P2003 capturada e traduzida). O Service
// mapeia isto para ConflictException (409) — ver
// implementacao/etapas/04-safra-cultura.md, seção "Decisão a registrar".

export class CropReferencedError extends Error {
  constructor(cropId: string) {
    super(
      `Crop with id ${cropId} is referenced by a planted crop and cannot be deleted`,
    );
    this.name = 'CropReferencedError';
  }
}
