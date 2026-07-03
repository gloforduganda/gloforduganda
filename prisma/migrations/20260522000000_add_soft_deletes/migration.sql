-- Add soft-delete column to all content and user-facing tables.
-- Rows with a non-null deletedAt are treated as deleted; all service
-- queries must filter WHERE "deletedAt" IS NULL.

ALTER TABLE "Post"                ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Page"                ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Program"             ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Project"             ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Event"               ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Career"              ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "VolunteerOpportunity" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Newsletter"          ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Campaign"            ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Media"               ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "ContactMessage"      ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Partial indexes so active-record queries stay fast
CREATE INDEX IF NOT EXISTS "Post_deletedAt_idx"                 ON "Post"("deletedAt")                 WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "Page_deletedAt_idx"                 ON "Page"("deletedAt")                 WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "Program_deletedAt_idx"              ON "Program"("deletedAt")              WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "Project_deletedAt_idx"              ON "Project"("deletedAt")              WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "Event_deletedAt_idx"                ON "Event"("deletedAt")                WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "Career_deletedAt_idx"               ON "Career"("deletedAt")               WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "VolunteerOpportunity_deletedAt_idx" ON "VolunteerOpportunity"("deletedAt") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "Newsletter_deletedAt_idx"           ON "Newsletter"("deletedAt")           WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "Campaign_deletedAt_idx"             ON "Campaign"("deletedAt")             WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "Media_deletedAt_idx"                ON "Media"("deletedAt")                WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "ContactMessage_deletedAt_idx"       ON "ContactMessage"("deletedAt")       WHERE "deletedAt" IS NULL;

-- Add updatedAt to ContactMessage and Tag (audit gap)
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Tag"            ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
