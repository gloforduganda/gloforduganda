-- Phase 5: Event content status + rich-text description
--
-- 1. Add "status" column to Event using the existing ContentStatus enum.
--    Default PUBLISHED so all existing public events remain visible.
--    Private events (isPublic=false) become DRAFT.
-- 2. Change description from plain String to Json blocks (same pattern
--    as Post/Program/Project body).

-- Step 1: add status column with a safe default
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED';

-- Step 2: back-fill — private events become DRAFT
UPDATE "Event" SET "status" = 'DRAFT' WHERE "isPublic" = false;

-- Step 3: add blocks column for rich-text description
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "descriptionBlocks" JSONB NOT NULL DEFAULT '[]';

-- Step 4: migrate existing plain-text descriptions into a richText block
UPDATE "Event"
SET "descriptionBlocks" = jsonb_build_array(
  jsonb_build_object(
    'id', 'body',
    'type', 'richText',
    'data', jsonb_build_object('html', "description")
  )
)
WHERE "description" IS NOT NULL AND "description" != '';

-- Step 5: index on status for fast public queries
CREATE INDEX IF NOT EXISTS "Event_status_idx" ON "Event"("status");
