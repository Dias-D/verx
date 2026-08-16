// Erro de domínio — lançado pelo adapter de persistência quando o DELETE de
// uma Season viola a constraint de FK (onDelete: Restrict em
// PlantedCrop.seasonId, violação P2003 capturada e traduzida). O Service
// mapeia isto para ConflictException (409) — ver
// implementacao/etapas/04-safra-cultura.md, seção "Decisão a registrar".

export class SeasonReferencedError extends Error {
  constructor(seasonId: string) {
    super(
      `Season with id ${seasonId} is referenced by a planted crop and cannot be deleted`,
    );
    this.name = 'SeasonReferencedError';
  }
}
