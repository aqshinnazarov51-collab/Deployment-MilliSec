-- Keep the Prisma schema and databases consistent if an earlier migration dropped the index.
CREATE INDEX IF NOT EXISTS "Order_promoCodeId_idx" ON "Order"("promoCodeId");
