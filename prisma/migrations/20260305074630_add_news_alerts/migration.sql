-- CreateTable
CREATE TABLE "NewsAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "triggerArticleIds" TEXT[],
    "alertType" VARCHAR(30) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "severity" VARCHAR(10) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "triggerDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsAlert_userId_isRead_idx" ON "NewsAlert"("userId", "isRead");

-- CreateIndex
CREATE INDEX "NewsAlert_userId_createdAt_idx" ON "NewsAlert"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "NewsAlert_neighborhoodId_idx" ON "NewsAlert"("neighborhoodId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsAlert_userId_neighborhoodId_alertType_triggerDate_key" ON "NewsAlert"("userId", "neighborhoodId", "alertType", "triggerDate");

-- AddForeignKey
ALTER TABLE "NewsAlert" ADD CONSTRAINT "NewsAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsAlert" ADD CONSTRAINT "NewsAlert_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;
