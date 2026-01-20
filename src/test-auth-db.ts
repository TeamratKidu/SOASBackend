import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Testing Better Auth with explicit Pool...');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433'),
  user: process.env.DATABASE_USER || 'soas_user',
  password: process.env.DATABASE_PASSWORD || 'soas_password',
  database: process.env.DATABASE_NAME || 'soas_db',
});

try {
  const auth = betterAuth({
    database: {
      provider: 'postgres',
      pool: pool, // Pass the pool directly
    },
    emailAndPassword: { enabled: true },
  });

  console.log('Better Auth instance created successfully with Pool.');
  // Force a DB check - better-auth usually checks on init or first call
} catch (error: any) {
  console.error('FAILED to initialize Better Auth:', error);
  if (error.cause) console.error('Cause:', error.cause);
  if (error.stack) console.error('Stack:', error.stack);
  console.dir(error, { depth: null });
}
