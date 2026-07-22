-- CreateTable
-- NOTE: `IF NOT EXISTS` is used intentionally. Earlier builds created the
-- `ebooks` table at request time from the application layer, so some existing
-- databases already have it. Guarding the statement keeps `migrate deploy`
-- idempotent whether or not the table was previously created out-of-band.
CREATE TABLE IF NOT EXISTS "ebooks" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ebooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ebooks_owner_id_updated_at_idx" ON "ebooks"("owner_id", "updated_at");
