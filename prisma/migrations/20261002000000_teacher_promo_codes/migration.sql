ALTER TABLE "PromoCode" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PromoCode" ADD COLUMN "expiresAt" DATETIME;
ALTER TABLE "PromoCode" ADD COLUMN "instructorId" TEXT REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD COLUMN "discountAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "promoCodeId" TEXT REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PromoCode_instructorId_active_idx" ON "PromoCode"("instructorId", "active");
CREATE INDEX "Order_promoCodeId_idx" ON "Order"("promoCodeId");
