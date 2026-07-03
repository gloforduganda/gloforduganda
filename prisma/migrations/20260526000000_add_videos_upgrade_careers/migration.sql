-- Add VideoPost model
CREATE TABLE "VideoPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VideoPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VideoPost_isPublished_order_idx" ON "VideoPost"("isPublished", "order");
CREATE INDEX "VideoPost_category_idx" ON "VideoPost"("category");

-- Add VideoView model
CREATE TABLE "VideoView" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "sessionId" TEXT,
    "watchedMs" INTEGER NOT NULL DEFAULT 0,
    "percentWatched" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT,
    "deviceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VideoView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VideoView_videoId_createdAt_idx" ON "VideoView"("videoId", "createdAt");
CREATE INDEX "VideoView_sessionId_idx" ON "VideoView"("sessionId");

ALTER TABLE "VideoView" ADD CONSTRAINT "VideoView_videoId_fkey"
    FOREIGN KEY ("videoId") REFERENCES "VideoPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Upgrade Career: add customFields, notificationEmail, emailTemplate columns
ALTER TABLE "Career"
    ADD COLUMN IF NOT EXISTS "customFields" JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS "notificationEmail" TEXT,
    ADD COLUMN IF NOT EXISTS "emailTemplate" JSONB;

-- Upgrade CareerApplication: add new document columns, rename coverLetter to coverLetterUrl
ALTER TABLE "CareerApplication"
    ADD COLUMN IF NOT EXISTS "coverLetterUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "idDocumentUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "photoUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "portfolioUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "nationality" TEXT,
    ADD COLUMN IF NOT EXISTS "address" TEXT;

-- Migrate existing coverLetter text to coverLetterUrl if any data exists
-- (coverLetter was a text field, we keep it as-is for backward compat, new apps use coverLetterUrl)
