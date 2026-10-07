-- CreateTable
CREATE TABLE "PlayerReview" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "telegramName" TEXT NOT NULL,
    "teamName" TEXT,
    "teamLogoUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerReview_playerId_key" ON "PlayerReview"("playerId");

-- CreateIndex
CREATE INDEX "PlayerReview_published_createdAt_idx" ON "PlayerReview"("published", "createdAt");

-- AddForeignKey
ALTER TABLE "PlayerReview" ADD CONSTRAINT "PlayerReview_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
