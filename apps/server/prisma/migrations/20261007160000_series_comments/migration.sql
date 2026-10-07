-- CreateTable
CREATE TABLE "SeriesComment" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "telegramName" TEXT NOT NULL,
    "teamName" TEXT,
    "teamLogoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeriesComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeriesComment_seriesId_createdAt_idx" ON "SeriesComment"("seriesId", "createdAt");

-- CreateIndex
CREATE INDEX "SeriesComment_playerId_createdAt_idx" ON "SeriesComment"("playerId", "createdAt");

-- AddForeignKey
ALTER TABLE "SeriesComment" ADD CONSTRAINT "SeriesComment_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesComment" ADD CONSTRAINT "SeriesComment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
