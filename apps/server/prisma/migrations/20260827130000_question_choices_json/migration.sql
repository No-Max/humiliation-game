-- Convert choices from text[] to jsonb objects { text, imageUrl? }
ALTER TABLE "Question" ADD COLUMN "choices_json" JSONB NOT NULL DEFAULT '[]';

UPDATE "Question"
SET "choices_json" = COALESCE(
  (
    SELECT jsonb_agg(jsonb_build_object('text', choice_text))
    FROM unnest("choices") AS choice_text
    WHERE btrim(choice_text) <> ''
  ),
  '[]'::jsonb
);

ALTER TABLE "Question" DROP COLUMN "choices";
ALTER TABLE "Question" RENAME COLUMN "choices_json" TO "choices";
