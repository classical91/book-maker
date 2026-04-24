-- Run this on your Railway PostgreSQL database to add the ebooks table
CREATE TABLE IF NOT EXISTS "ebooks" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ebooks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ebooks_owner_id_updated_at_idx" ON "ebooks"("owner_id", "updated_at");
