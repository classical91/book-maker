-- AlterTable
ALTER TABLE "ebooks" ADD COLUMN "word_count" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing e-books with an approximate word count (whitespace split),
-- so the dashboard shows correct counts without needing each book re-saved.
UPDATE "ebooks"
SET "word_count" = CASE
  WHEN "content" IS NULL OR btrim("content") = '' THEN 0
  ELSE COALESCE(array_length(regexp_split_to_array(btrim("content"), '\s+'), 1), 0)
END;
