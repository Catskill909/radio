-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScheduleSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "showId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "sourceUrl" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ScheduleSlot_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ScheduleSlot" ("endTime", "id", "isRecurring", "showId", "sourceUrl", "startTime") SELECT "endTime", "id", "isRecurring", "showId", "sourceUrl", "startTime" FROM "ScheduleSlot";
DROP TABLE "ScheduleSlot";
ALTER TABLE "new_ScheduleSlot" RENAME TO "ScheduleSlot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
