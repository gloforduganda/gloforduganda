-- CreateTable: Project
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" JSONB NOT NULL DEFAULT '[]',
    "coverMediaId" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Project_slug_key" ON "Project"("slug");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");
CREATE INDEX IF NOT EXISTS "Project_order_idx" ON "Project"("order");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: SiteVisit
CREATE TABLE IF NOT EXISTS "SiteVisit" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "country" TEXT,
    "city" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SiteVisit_createdAt_idx" ON "SiteVisit"("createdAt");
CREATE INDEX IF NOT EXISTS "SiteVisit_path_idx" ON "SiteVisit"("path");
CREATE INDEX IF NOT EXISTS "SiteVisit_sessionId_idx" ON "SiteVisit"("sessionId");

-- AlterTable: Media — add showInGallery flag
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "showInGallery" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "Media_showInGallery_idx" ON "Media"("showInGallery");
