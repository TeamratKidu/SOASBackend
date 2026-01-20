-- Drop all tables and types to start fresh
DROP TABLE IF EXISTS "transactions" CASCADE;
DROP TABLE IF EXISTS "bids" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "auctions" CASCADE;
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS "feedback" CASCADE;

-- Drop all enums
DROP TYPE IF EXISTS "auction_status" CASCADE;
DROP TYPE IF EXISTS "payment_gateway" CASCADE;
DROP TYPE IF EXISTS "transaction_status" CASCADE;
DROP TYPE IF EXISTS "user_role" CASCADE;
DROP TYPE IF EXISTS "auctions_status_enum" CASCADE;
DROP TYPE IF EXISTS "transactions_gateway_enum" CASCADE;
DROP TYPE IF EXISTS "transactions_status_enum" CASCADE;
DROP TYPE IF EXISTS "users_role_enum" CASCADE;
