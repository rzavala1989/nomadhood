-- CreateTable
CREATE TABLE "ReviewDimension" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "dimension" VARCHAR(30) NOT NULL,
    "rating" SMALLINT NOT NULL,

    CONSTRAINT "ReviewDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "matchReasons" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeighborhoodSnapshot" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "nomadScore" INTEGER NOT NULL,
    "avgRating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL,
    "favoriteCount" INTEGER NOT NULL,
    "dimensionAvgs" JSONB,

    CONSTRAINT "NeighborhoodSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewDimension_reviewId_idx" ON "ReviewDimension"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewDimension_dimension_idx" ON "ReviewDimension"("dimension");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewDimension_reviewId_dimension_key" ON "ReviewDimension"("reviewId", "dimension");

-- CreateIndex
CREATE INDEX "RecommendationCache_userId_matchScore_idx" ON "RecommendationCache"("userId", "matchScore");

-- CreateIndex
CREATE INDEX "RecommendationCache_computedAt_idx" ON "RecommendationCache"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationCache_userId_neighborhoodId_key" ON "RecommendationCache"("userId", "neighborhoodId");

-- CreateIndex
CREATE INDEX "NeighborhoodSnapshot_neighborhoodId_snapshotDate_idx" ON "NeighborhoodSnapshot"("neighborhoodId", "snapshotDate");

-- CreateIndex
CREATE INDEX "NeighborhoodSnapshot_snapshotDate_idx" ON "NeighborhoodSnapshot"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "NeighborhoodSnapshot_neighborhoodId_snapshotDate_key" ON "NeighborhoodSnapshot"("neighborhoodId", "snapshotDate");

-- AddForeignKey
ALTER TABLE "ReviewDimension" ADD CONSTRAINT "ReviewDimension_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationCache" ADD CONSTRAINT "RecommendationCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationCache" ADD CONSTRAINT "RecommendationCache_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeighborhoodSnapshot" ADD CONSTRAINT "NeighborhoodSnapshot_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;
