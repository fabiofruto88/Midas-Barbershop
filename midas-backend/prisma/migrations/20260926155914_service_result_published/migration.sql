-- AlterTable
ALTER TABLE "ServiceResult" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ServiceResult_isPublished_createdAt_idx" ON "ServiceResult"("isPublished", "createdAt");
