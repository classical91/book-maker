-- CreateEnum
CREATE TYPE "revision_source" AS ENUM ('MANUAL_SAVE', 'AI_GENERATION', 'AI_REGENERATION');

-- CreateTable
CREATE TABLE "chapter_revisions" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "summary" TEXT,
    "brief" JSONB,
    "word_count" INTEGER,
    "source" "revision_source" NOT NULL,
    "model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapter_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ebook_revisions" (
    "id" TEXT NOT NULL,
    "ebook_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "source" "revision_source" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ebook_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chapter_revisions_chapter_id_created_at_idx" ON "chapter_revisions"("chapter_id", "created_at");

-- CreateIndex
CREATE INDEX "ebook_revisions_ebook_id_created_at_idx" ON "ebook_revisions"("ebook_id", "created_at");

-- AddForeignKey
ALTER TABLE "chapter_revisions" ADD CONSTRAINT "chapter_revisions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebook_revisions" ADD CONSTRAINT "ebook_revisions_ebook_id_fkey" FOREIGN KEY ("ebook_id") REFERENCES "ebooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
