// Entidade de domínio — classe pura, sem nada do Prisma Client.

export class Season {
  constructor(
    public readonly id: string,
    public readonly year: number,
  ) {}
}
