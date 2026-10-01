-- DropIndex
-- This migration was generated against a local database where the index existed.
-- Fresh shadow databases may not have it yet, so make the cleanup idempotent.
DROP INDEX IF EXISTS "Order_promoCodeId_idx";
