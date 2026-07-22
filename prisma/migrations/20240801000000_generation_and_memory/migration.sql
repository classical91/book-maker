-- CreateEnum
CREATE TYPE "generation_status" AS ENUM ('IDLE', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "chapters" ADD COLUMN "plan" JSONB;
ALTER TABLE "chapters" ADD COLUMN "target_words" INTEGER;
ALTER TABLE "chapters" ADD COLUMN "generation_status" "generation_status" NOT NULL DEFAULT 'IDLE';
ALTER TABLE "chapters" ADD COLUMN "generation_started_at" TIMESTAMP(3);
ALTER TABLE "chapters" ADD COLUMN "generation_key" TEXT;

-- CreateTable
CREATE TABLE "chapter_memory" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "summary" TEXT,
    "introduced_concepts" JSONB,
    "key_definitions" JSONB,
    "examples_used" JSONB,
    "claims" JSONB,
    "open_loops" JSONB,
    "transition_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapter_memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chapter_memory_chapter_id_key" ON "chapter_memory"("chapter_id");

-- AddForeignKey
ALTER TABLE "chapter_memory" ADD CONSTRAINT "chapter_memory_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
