-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('DRAFT', 'OUTLINE_READY', 'WRITING', 'COMPLETE');

-- CreateEnum
CREATE TYPE "chapter_status" AS ENUM ('OUTLINED', 'BRIEF_READY', 'DRAFTED', 'REVIEWED', 'COMPLETE');

-- CreateTable
CREATE TABLE "book_projects" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "premise" TEXT NOT NULL,
    "target_words" INTEGER NOT NULL,
    "total_chapters" INTEGER NOT NULL,
    "summary" TEXT,
    "status" "project_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "chapter_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "outline_bullets" JSONB NOT NULL,
    "brief" JSONB,
    "content" TEXT,
    "summary" TEXT,
    "word_count" INTEGER,
    "status" "chapter_status" NOT NULL DEFAULT 'OUTLINED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_memory" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "key_terms" JSONB,
    "style_rules" JSONB,
    "continuity_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_projects_owner_id_updated_at_idx" ON "book_projects"("owner_id", "updated_at");

-- CreateIndex
CREATE INDEX "chapters_project_id_status_idx" ON "chapters"("project_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_project_id_chapter_number_key" ON "chapters"("project_id", "chapter_number");

-- CreateIndex
CREATE UNIQUE INDEX "book_memory_project_id_key" ON "book_memory"("project_id");

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "book_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_memory" ADD CONSTRAINT "book_memory_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "book_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
