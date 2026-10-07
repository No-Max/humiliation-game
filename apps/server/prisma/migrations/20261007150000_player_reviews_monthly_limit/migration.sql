-- DropIndex
DROP INDEX "PlayerReview_playerId_key";

-- CreateIndex
CREATE INDEX "PlayerReview_playerId_createdAt_idx" ON "PlayerReview"("playerId", "createdAt");

-- CreateIndex
CREATE INDEX "PlayerReview_playerId_published_idx" ON "PlayerReview"("playerId", "published");
