-- Add missing Career.contactEmail column used by the Prisma schema and seed.
ALTER TABLE "Career"
    ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
