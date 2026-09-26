-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER');

-- AlterTable: listPrice se añade primero como nullable para poder rellenar las citas existentes.
ALTER TABLE "Appointment" ADD COLUMN     "chargedAmount" DECIMAL(10,2),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "listPrice" DECIMAL(10,2),
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "priceNote" TEXT,
ADD COLUMN     "tipAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Backfill: el precio de lista es el precio actual del servicio; las citas ya completadas
-- se dan por cobradas a ese precio.
UPDATE "Appointment" a SET "listPrice" = s."price" FROM "Service" s WHERE s."id" = a."serviceId";
UPDATE "Appointment" SET "chargedAmount" = "listPrice", "completedAt" = "updatedAt" WHERE "status" = 'COMPLETED';

ALTER TABLE "Appointment" ALTER COLUMN "listPrice" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Appointment_barberId_status_date_idx" ON "Appointment"("barberId", "status", "date");
