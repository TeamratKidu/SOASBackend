import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env explicitly from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Debug what connection is actually being used
console.log('Drizzle Config - Using:', {
  source: process.env.DATABASE_URL ? 'DATABASE_URL (priority)' : 'fallback (host/port)',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'soas_db',
});

const getDbCredentials = () => {
  if (process.env.DATABASE_URL) {
    let url = process.env.DATABASE_URL.trim();

    // Force SSL for Render external connections (most reliable param)
    if (!url.includes('sslmode=') && !url.includes('ssl=')) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}sslmode=require`;
    }

    return {
      url,
      ssl: { rejectUnauthorized: false }, // Skip strict cert check for Render's certs
    };
  }

  // Local fallback (standard PostgreSQL port by default)
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432, // ← use env var or standard 5432
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'soas_db',
    ssl: false,
  };
};

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: getDbCredentials(),
  verbose: true,
  strict: true,
});