// Entidade de domínio — classe pura, sem nada de infraestrutura nela.
// Join entity farm+season+crop (ver arquitetura.md#modelo-de-dados).

export class PlantedCrop {
  constructor(
    public readonly id: string,
    public readonly farmId: string,
    public readonly seasonId: string,
    public readonly cropId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
