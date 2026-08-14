-- AlterTable
ALTER TABLE "Tour" ADD COLUMN "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
