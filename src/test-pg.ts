import { Client } from 'pg';

const client = new Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433'),
  user: process.env.DATABASE_USER || 'soas_user',
  password: process.env.DATABASE_PASSWORD || 'soas_password',
  database: process.env.DATABASE_NAME || 'soas_db',
});

console.log('Testing raw pg connection...');
console.log('Config:', {
  host: client.host,
  port: client.port,
  user: client.user,
  database: client.database,
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Connected successfully to PostgreSQL!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

testConnection();
