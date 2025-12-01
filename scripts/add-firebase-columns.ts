import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ 
  connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
});

async function addColumns() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Adding firebase_uid column...');
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE`);
    
    console.log('Adding display_name column...');
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT`);
    
    console.log('Adding photo_url column...');
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT`);
    
    console.log('Columns added successfully!');
    
    const result = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`);
    console.log('Current columns:', result.rows.map(r => r.column_name).join(', '));
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addColumns();
