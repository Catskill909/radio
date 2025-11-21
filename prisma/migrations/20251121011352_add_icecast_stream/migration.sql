-- CreateTable
CREATE TABLE "IcecastStream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "bitrate" INTEGER,
    "format" TEXT,
    "listeners" INTEGER,
    "maxListeners" INTEGER,
    "genre" TEXT,
    "description" TEXT,
    "lastChecked" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
