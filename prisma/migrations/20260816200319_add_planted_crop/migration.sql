-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planted_crops" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planted_crops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seasons_year_key" ON "seasons"("year");

-- CreateIndex
CREATE UNIQUE INDEX "crops_name_key" ON "crops"("name");

-- CreateIndex
CREATE INDEX "planted_crops_farmId_idx" ON "planted_crops"("farmId");

-- CreateIndex
CREATE INDEX "planted_crops_seasonId_idx" ON "planted_crops"("seasonId");

-- CreateIndex
CREATE INDEX "planted_crops_cropId_idx" ON "planted_crops"("cropId");

-- CreateIndex
CREATE UNIQUE INDEX "planted_crops_farmId_seasonId_cropId_key" ON "planted_crops"("farmId", "seasonId", "cropId");

-- AddForeignKey
ALTER TABLE "planted_crops" ADD CONSTRAINT "planted_crops_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planted_crops" ADD CONSTRAINT "planted_crops_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planted_crops" ADD CONSTRAINT "planted_crops_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
