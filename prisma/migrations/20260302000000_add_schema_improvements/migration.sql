-- Add updatedAt to User (backfill existing rows with createdAt value)
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "User" SET "updatedAt" = "createdAt";
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt to Neighborhood
ALTER TABLE "Neighborhood" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Neighborhood" SET "updatedAt" = "createdAt";
ALTER TABLE "Neighborhood" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Neighborhood" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt to Review
ALTER TABLE "Review" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Review" SET "updatedAt" = "createdAt";
ALTER TABLE "Review" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Add latitude and longitude to Neighborhood
ALTER TABLE "Neighborhood" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Neighborhood" ADD COLUMN "longitude" DOUBLE PRECISION;

-- Alter column types for better constraints
ALTER TABLE "User" ALTER COLUMN "email" TYPE VARCHAR(255);
ALTER TABLE "User" ALTER COLUMN "name" TYPE VARCHAR(100);
ALTER TABLE "Neighborhood" ALTER COLUMN "name" TYPE VARCHAR(100);
ALTER TABLE "Neighborhood" ALTER COLUMN "city" TYPE VARCHAR(50);
ALTER TABLE "Neighborhood" ALTER COLUMN "state" TYPE CHAR(2);
ALTER TABLE "Neighborhood" ALTER COLUMN "zip" TYPE VARCHAR(10);
ALTER TABLE "Review" ALTER COLUMN "rating" TYPE SMALLINT;

-- Add indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");
CREATE INDEX IF NOT EXISTS "Neighborhood_city_state_idx" ON "Neighborhood"("city", "state");
CREATE INDEX IF NOT EXISTS "Neighborhood_zip_idx" ON "Neighborhood"("zip");
CREATE INDEX IF NOT EXISTS "Neighborhood_latitude_longitude_idx" ON "Neighborhood"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "Review_neighborhoodId_idx" ON "Review"("neighborhoodId");
CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");
CREATE INDEX IF NOT EXISTS "Review_rating_idx" ON "Review"("rating");

-- Add unique constraint on Review (one review per user per neighborhood)
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_neighborhoodId_key" UNIQUE ("userId", "neighborhoodId");

-- Add cascade deletes
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_userId_fkey";
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_neighborhoodId_fkey";
ALTER TABLE "Review" ADD CONSTRAINT "Review_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;
