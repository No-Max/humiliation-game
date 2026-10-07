-- AlterTable
ALTER TABLE "SeriesComment" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- DropIndex
DROP INDEX "SeriesComment_seriesId_createdAt_idx";

-- CreateIndex
CREATE INDEX "SeriesComment_seriesId_hidden_createdAt_idx" ON "SeriesComment"("seriesId", "hidden", "createdAt");
