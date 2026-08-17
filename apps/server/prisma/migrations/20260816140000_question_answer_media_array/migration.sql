-- AlterTable
ALTER TABLE "Question" ADD COLUMN "answerMedia" JSONB NOT NULL DEFAULT '[]';

-- Migrate existing single-file media into the array
UPDATE "Question"
SET "answerMedia" = jsonb_build_array(
  jsonb_build_object('url', "answerMediaUrl", 'type', "answerMediaType")
)
WHERE "answerMediaUrl" IS NOT NULL AND "answerMediaType" IS NOT NULL;

-- DropTable columns
ALTER TABLE "Question" DROP COLUMN "answerMediaUrl";
ALTER TABLE "Question" DROP COLUMN "answerMediaType";
