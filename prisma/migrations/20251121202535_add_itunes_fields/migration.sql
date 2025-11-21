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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Show" ("createdAt", "description", "host", "id", "image", "recordingEnabled", "recordingSource", "title", "type", "updatedAt") SELECT "createdAt", "description", "host", "id", "image", "recordingEnabled", "recordingSource", "title", "type", "updatedAt" FROM "Show";
DROP TABLE "Show";
ALTER TABLE "new_Show" RENAME TO "Show";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
