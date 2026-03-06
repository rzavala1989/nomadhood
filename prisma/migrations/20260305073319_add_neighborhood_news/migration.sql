-- CreateTable
CREATE TABLE "NeighborhoodNews" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "sourceId" TEXT,
    "sentiment" VARCHAR(20),
    "category" TEXT[],
    "aiTag" TEXT[],
    "pubDate" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NeighborhoodNews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NeighborhoodNews_articleId_key" ON "NeighborhoodNews"("articleId");

-- CreateIndex
CREATE INDEX "NeighborhoodNews_neighborhoodId_pubDate_idx" ON "NeighborhoodNews"("neighborhoodId", "pubDate" DESC);

-- AddForeignKey
ALTER TABLE "NeighborhoodNews" ADD CONSTRAINT "NeighborhoodNews_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;
