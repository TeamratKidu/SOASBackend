-- SOAS Database Quick Fix Script
-- Aligns TypeORM tables with Drizzle schema for Better-Auth compatibility

-- 1. Rename users table to user (Better-Auth expects singular)
ALTER TABLE IF EXISTS users RENAME TO "user";

-- 2. Add Better-Auth required columns
ALTER TABLE "user" 
  ADD COLUMN IF NOT EXISTS "emailVerified" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "phoneNumberVerified" boolean DEFAULT false;

-- 3. Rename columns to match Drizzle schema
ALTER TABLE "user" 
  RENAME COLUMN IF EXISTS username TO name;

ALTER TABLE "user" 
  RENAME COLUMN IF EXISTS phone TO "phoneNumber";

-- 4. Ensure all Better-Auth required columns exist
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS "trustScore" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "unpaidAuctionsCount" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "failedLogins" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockedUntil" timestamp,
  ADD COLUMN IF NOT EXISTS notifications jsonb;

-- 5. Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user'
ORDER BY ordinal_position;

-- Success message
SELECT 'Database schema aligned with Drizzle! Ready for seed script.' as status;
