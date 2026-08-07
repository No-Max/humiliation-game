-- Create join table for series ↔ tour links
CREATE TABLE "SeriesTour" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeriesTour_pkey" PRIMARY KEY ("id")
);

-- Migrate existing tour assignments
INSERT INTO "SeriesTour" ("id", "seriesId", "tourId", "sortOrder", "createdAt")
SELECT
    'st_' || "id",
    "seriesId",
    "id",
    "sortOrder",
    "createdAt"
FROM "Tour";

CREATE UNIQUE INDEX "SeriesTour_seriesId_tourId_key" ON "SeriesTour"("seriesId", "tourId");
CREATE INDEX "SeriesTour_seriesId_idx" ON "SeriesTour"("seriesId");
CREATE INDEX "SeriesTour_tourId_idx" ON "SeriesTour"("tourId");

ALTER TABLE "SeriesTour" ADD CONSTRAINT "SeriesTour_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeriesTour" ADD CONSTRAINT "SeriesTour_tourId_fkey"
    FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tours become standalone library entities
ALTER TABLE "Tour" DROP CONSTRAINT "Tour_seriesId_fkey";
DROP INDEX IF EXISTS "Tour_seriesId_idx";
ALTER TABLE "Tour" DROP COLUMN "seriesId";
ALTER TABLE "Tour" DROP COLUMN "sortOrder";

CREATE INDEX "Tour_title_idx" ON "Tour"("title");
