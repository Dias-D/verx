-- CreateEnum
CREATE TYPE "BrazilianState" AS ENUM ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" "BrazilianState" NOT NULL,
    "totalAreaHectares" DECIMAL(10,2) NOT NULL,
    "arableAreaHectares" DECIMAL(10,2) NOT NULL,
    "vegetationAreaHectares" DECIMAL(10,2) NOT NULL,
    "producerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "farms_producerId_idx" ON "farms"("producerId");

-- CreateIndex
CREATE INDEX "farms_state_idx" ON "farms"("state");

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "producers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
