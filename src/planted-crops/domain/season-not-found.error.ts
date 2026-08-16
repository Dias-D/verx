// Erro de domínio — lançado pelo adapter de persistência quando a constraint
// de FK do seasonId falha (violação P2003 capturada e traduzida). O
// controller mapeia isto para 404.

export class SeasonNotFoundError extends Error {
  constructor(seasonId: string) {
    super(`Season with id ${seasonId} not found`);
    this.name = 'SeasonNotFoundError';
  }
}
