-- Fix: ensure coverLetter (legacy text field) exists for backward compat
-- The 20260526 migration added coverLetterUrl but the seed/service still
-- references the old coverLetter text column. Keep both; new apps use
-- coverLetterUrl (file URL), old data stays in coverLetter.
ALTER TABLE "CareerApplication"
    ADD COLUMN IF NOT EXISTS "coverLetter" TEXT;

-- Add admin videos page nav entry seed helper (no-op if already exists)
-- Nothing else needed — VideoPost/VideoView tables were added in 20260526.
