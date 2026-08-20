-- AlterTable: add seriesId (nullable first for backfill)
ALTER TABLE "Question" ADD COLUMN "seriesId" TEXT;

-- Tours linked to one or more series: assign the first linked series
UPDATE "Question" q
SET "seriesId" = first_st."seriesId"
FROM (
  SELECT DISTINCT ON ("tourId") "tourId", "seriesId"
  FROM "SeriesTour"
  ORDER BY "tourId", "sortOrder" ASC, "createdAt" ASC
) first_st
WHERE q."tourId" = first_st."tourId"
  AND q."seriesId" IS NULL;

-- Clone questions onto every other series that uses the same tour
INSERT INTO "Question" (
  "id",
  "tourId",
  "seriesId",
  "sortOrder",
  "contentType",
  "prompt",
  "mediaUrls",
  "answerType",
  "choices",
  "correctAnswer",
  "acceptableAnswers",
  "hints",
  "points",
  "timeLimitSec",
  "answerMedia",
  "createdAt",
  "updatedAt"
)
SELECT
  'c' || replace(gen_random_uuid()::text, '-', ''),
  q."tourId",
  st."seriesId",
  q."sortOrder",
  q."contentType",
  q."prompt",
  q."mediaUrls",
  q."answerType",
  q."choices",
  q."correctAnswer",
  q."acceptableAnswers",
  q."hints",
  q."points",
  q."timeLimitSec",
  q."answerMedia",
  NOW(),
  NOW()
FROM "Question" q
JOIN "SeriesTour" st ON st."tourId" = q."tourId"
WHERE q."seriesId" IS NOT NULL
  AND st."seriesId" <> q."seriesId";

-- Drop questions that still have no series (tour not linked anywhere)
DELETE FROM "Question" WHERE "seriesId" IS NULL;

ALTER TABLE "Question" ALTER COLUMN "seriesId" SET NOT NULL;

ALTER TABLE "Question"
  ADD CONSTRAINT "Question_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "Series"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Question_seriesId_idx" ON "Question"("seriesId");
CREATE INDEX "Question_tourId_seriesId_idx" ON "Question"("tourId", "seriesId");
