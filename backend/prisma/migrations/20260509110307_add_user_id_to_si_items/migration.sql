-- AlterTable
ALTER TABLE "SI_Items" ADD COLUMN     "userId" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "SI_Items_userId_idx" ON "SI_Items"("userId");
