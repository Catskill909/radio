-- AlterTable
ALTER TABLE "Episode" ADD COLUMN "duration" INTEGER;
ALTER TABLE "Episode" ADD COLUMN "host" TEXT;
ALTER TABLE "Episode" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Episode" ADD COLUMN "tags" TEXT;

-- AlterTable
ALTER TABLE "Recording" ADD COLUMN "duration" INTEGER;
ALTER TABLE "Recording" ADD COLUMN "size" INTEGER;
