-- Add missing columns to user table for AxumAuction seller upgrade
-- Run this if drizzle-kit push doesn't work

-- Add seller-specific fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bio" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "tinNumber" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "faydaId" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "sellerApprovalStatus" text DEFAULT 'pending';

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user' 
AND column_name IN ('bio', 'tinNumber', 'faydaId', 'location', 'sellerApprovalStatus');
