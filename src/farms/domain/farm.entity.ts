// Entidade de domínio — classe pura, sem nada de infraestrutura nela.
//
// Cuidado de implementação (ver tecnologias.md): as três colunas de área são
// um tipo `Decimal` (biblioteca decimal.js) na camada de persistência, não
// `number`. É responsabilidade do adapter (infrastructure/persistence), não
// desta classe, converter via `.toNumber()` antes de montar a entidade —
// aqui elas já chegam como `number` puro.

import { BrazilianState } from './brazilian-state';

export class Farm {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly city: string,
    public readonly state: BrazilianState,
    public readonly totalAreaHectares: number,
    public readonly arableAreaHectares: number,
    public readonly vegetationAreaHectares: number,
    public readonly producerId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
