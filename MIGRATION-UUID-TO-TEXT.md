# Database Schema Migration - UUID to Text

## Issue
Better Auth generates string IDs (not UUIDs), causing type mismatch with PostgreSQL uuid columns.

## Changes Made
1. Changed `user.id` from `uuid` to `text`
2. Updated all foreign key references to `user.id` across tables:
   - `session.userId`
   - `account.userId`
   - `auction.sellerId` and `auction.winnerId`
   - `bid.bidderId`
   - `transaction.userId`
   - `auditLog.userId`
   - `feedback.fromUserId` and `feedback.toUserId`

3. Updated seed data to manually generate UUIDs using `crypto.randomUUID()`

## Migration Steps

### 1. Drop Existing Tables
```sql
-- Connect to PostgreSQL
psql -U soas_user -d soas_db -p 5433

-- Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS user CASCADE;
```

### 2. Restart Backend
The backend will auto-create tables with the new schema on startup.

```bash
cd backend
npm run start:dev
```

### 3. Seed Database
```bash
cd backend
npm run seed
```

## Testing
After migration, test:
- User registration (Better Auth should generate text IDs)
- Login flow
- Auction creation (foreign keys should work)
- Bidding (foreign keys should work)
