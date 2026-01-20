-- Clear all data from tables for fresh seed
-- Run this before seeding to avoid duplicate key errors

TRUNCATE TABLE "feedback" CASCADE;
TRUNCATE TABLE "bid" CASCADE;
TRUNCATE TABLE "transaction" CASCADE;
TRUNCATE TABLE "auction" CASCADE;
TRUNCATE TABLE "account" CASCADE;
TRUNCATE TABLE "session" CASCADE;
TRUNCATE TABLE "verification" CASCADE;
TRUNCATE TABLE "auditLog" CASCADE;
TRUNCATE TABLE "user" CASCADE;

SELECT 'Database cleared successfully' AS status;
