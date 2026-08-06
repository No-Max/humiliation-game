-- Migrate single hint to hints array
ALTER TABLE "Question" ADD COLUMN "hints" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "Question"
SET "hints" = ARRAY["hint"]
WHERE "hint" IS NOT NULL AND "hint" <> '';

ALTER TABLE "Question" DROP COLUMN "hint";
