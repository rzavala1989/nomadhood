-- CreateTable
CREATE TABLE "WalkScoreCache" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "walkScore" INTEGER,
    "transitScore" INTEGER,
    "bikeScore" INTEGER,
    "walkDescription" VARCHAR(100),
    "transitDescription" VARCHAR(100),
    "bikeDescription" VARCHAR(100),
    "rawResponse" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalkScoreCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentcastCache" (
    "id" TEXT NOT NULL,
    "zip" VARCHAR(10) NOT NULL,
    "medianRent" DOUBLE PRECISION,
    "medianRentSqft" DOUBLE PRECISION,
    "medianSalePrice" DOUBLE PRECISION,
    "medianSaleSqft" DOUBLE PRECISION,
    "rawResponse" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentcastCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrimeDataCache" (
    "id" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "oriCode" VARCHAR(20),
    "violentCrimeRate" DOUBLE PRECISION,
    "propertyCrimeRate" DOUBLE PRECISION,
    "population" INTEGER,
    "dataYear" INTEGER,
    "dataQuality" VARCHAR(20) NOT NULL DEFAULT 'unavailable',
    "rawResponse" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrimeDataCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlsDataCache" (
    "id" TEXT NOT NULL,
    "seriesId" VARCHAR(30) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "seriesType" VARCHAR(20) NOT NULL,
    "value" DOUBLE PRECISION,
    "period" VARCHAR(10),
    "year" INTEGER,
    "rawResponse" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlsDataCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventbriteCache" (
    "id" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "upcomingEventCount" INTEGER NOT NULL DEFAULT 0,
    "events" JSONB NOT NULL DEFAULT '[]',
    "rawResponse" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventbriteCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRateLimitTracker" (
    "id" TEXT NOT NULL,
    "apiName" VARCHAR(50) NOT NULL,
    "callCount" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "lastCalledAt" TIMESTAMP(3),

    CONSTRAINT "ApiRateLimitTracker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalkScoreCache_neighborhoodId_key" ON "WalkScoreCache"("neighborhoodId");

-- CreateIndex
CREATE INDEX "WalkScoreCache_expiresAt_idx" ON "WalkScoreCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RentcastCache_zip_key" ON "RentcastCache"("zip");

-- CreateIndex
CREATE INDEX "RentcastCache_expiresAt_idx" ON "RentcastCache"("expiresAt");

-- CreateIndex
CREATE INDEX "CrimeDataCache_expiresAt_idx" ON "CrimeDataCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CrimeDataCache_city_state_key" ON "CrimeDataCache"("city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "BlsDataCache_seriesId_key" ON "BlsDataCache"("seriesId");

-- CreateIndex
CREATE INDEX "BlsDataCache_city_state_idx" ON "BlsDataCache"("city", "state");

-- CreateIndex
CREATE INDEX "BlsDataCache_seriesType_idx" ON "BlsDataCache"("seriesType");

-- CreateIndex
CREATE INDEX "BlsDataCache_expiresAt_idx" ON "BlsDataCache"("expiresAt");

-- CreateIndex
CREATE INDEX "EventbriteCache_expiresAt_idx" ON "EventbriteCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventbriteCache_city_state_key" ON "EventbriteCache"("city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "ApiRateLimitTracker_apiName_key" ON "ApiRateLimitTracker"("apiName");

-- AddForeignKey
ALTER TABLE "WalkScoreCache" ADD CONSTRAINT "WalkScoreCache_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;
