// Erro de domínio — lançado pelo adapter de persistência (infrastructure/)
// quando a constraint de FK do producerId falha (violação capturada e
// traduzida, ver arquitetura.md#1-schema-e-migration). O controller mapeia
// isto para 404. Farm não depende do ProducerRepositoryPort de outro módulo
// para checar existência — a checagem é resolvida pela constraint do banco.

export class ProducerNotFoundError extends Error {
  constructor(producerId: string) {
    super(`Producer with id ${producerId} not found`);
    this.name = 'ProducerNotFoundError';
  }
}
