-- DropIndex
DROP INDEX "NeighborhoodImageCache_neighborhoodId_key";

-- AlterTable
ALTER TABLE "NeighborhoodImageCache" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "NeighborhoodImageCache_neighborhoodId_imageUrl_key" ON "NeighborhoodImageCache"("neighborhoodId", "imageUrl");

-- CreateIndex
CREATE INDEX "NeighborhoodImageCache_neighborhoodId_idx" ON "NeighborhoodImageCache"("neighborhoodId");
