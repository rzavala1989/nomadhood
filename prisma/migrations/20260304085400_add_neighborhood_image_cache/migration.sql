-- CreateTable
CREATE TABLE "NeighborhoodImageCache" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "source" VARCHAR(20) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "altText" TEXT,
    "photographerName" TEXT,
    "photographerUrl" TEXT,
    "pageUrl" TEXT,
    "rawResponse" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NeighborhoodImageCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NeighborhoodImageCache_neighborhoodId_key" ON "NeighborhoodImageCache"("neighborhoodId");

-- CreateIndex
CREATE INDEX "NeighborhoodImageCache_expiresAt_idx" ON "NeighborhoodImageCache"("expiresAt");

-- AddForeignKey
ALTER TABLE "NeighborhoodImageCache" ADD CONSTRAINT "NeighborhoodImageCache_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;
