// Erro de domínio — lançado pelo adapter de persistência (infrastructure/)
// quando a constraint de FK do farmId falha (violação P2003 capturada e
// traduzida). O controller mapeia isto para 404 (mesmo padrão de
// ProducerNotFoundError no módulo Farm, ver arquitetura.md).

export class FarmNotFoundError extends Error {
  constructor(farmId: string) {
    super(`Farm with id ${farmId} not found`);
    this.name = 'FarmNotFoundError';
  }
}
