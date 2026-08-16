// Entidade de domínio — classe pura, sem nada do Prisma Client.

export class Producer {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly document: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
