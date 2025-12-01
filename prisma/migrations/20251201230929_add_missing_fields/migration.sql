-- AlterTable
ALTER TABLE "Episode" ADD COLUMN "explicit" BOOLEAN;

-- AlterTable
ALTER TABLE "Recording" ADD COLUMN "audioBitrate" INTEGER;
ALTER TABLE "Recording" ADD COLUMN "audioCodec" TEXT;
ALTER TABLE "Recording" ADD COLUMN "audioSampleRate" INTEGER;

-- AlterTable
ALTER TABLE "ScheduleSlot" ADD COLUMN "splitGroupId" TEXT;
ALTER TABLE "ScheduleSlot" ADD COLUMN "splitPosition" TEXT;

-- CreateTable
CREATE TABLE "StationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'station',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "name" TEXT DEFAULT 'My Radio Station',
    "description" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "streamUrl" TEXT,
    "siteLogo" TEXT,
    "siteTitle" TEXT,
    "siteTagline" TEXT,
    "showSiteLogo" BOOLEAN NOT NULL DEFAULT true,
    "showSiteTitle" BOOLEAN NOT NULL DEFAULT true,
    "showSiteTagline" BOOLEAN NOT NULL DEFAULT true,
    "audioCodec" TEXT NOT NULL DEFAULT 'libmp3lame',
    "audioBitrate" INTEGER NOT NULL DEFAULT 192,
    "audioSampleRate" INTEGER,
    "audioVBR" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Show" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "host" TEXT,
    "email" TEXT,
    "author" TEXT,
    "explicit" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "tags" TEXT,
    "image" TEXT,
    "recordingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "recordingSource" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en-us',
    "copyright" TEXT,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Show" ("author", "category", "createdAt", "description", "email", "explicit", "host", "id", "image", "recordingEnabled", "recordingSource", "tags", "title", "type", "updatedAt") SELECT "author", "category", "createdAt", "description", "email", "explicit", "host", "id", "image", "recordingEnabled", "recordingSource", "tags", "title", "type", "updatedAt" FROM "Show";
DROP TABLE "Show";
ALTER TABLE "new_Show" RENAME TO "Show";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
