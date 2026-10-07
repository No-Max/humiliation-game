-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "teamName" TEXT,
    "teamLogoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "GameTeam" ADD COLUMN "playerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Player_telegramId_key" ON "Player"("telegramId");

-- CreateIndex
CREATE INDEX "GameTeam_playerId_idx" ON "GameTeam"("playerId");

-- AddForeignKey
ALTER TABLE "GameTeam" ADD CONSTRAINT "GameTeam_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
