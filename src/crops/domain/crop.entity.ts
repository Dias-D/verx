// Entidade de domínio — classe pura, sem nada do Prisma Client.

export class Crop {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}
}
