import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ 
  connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
});

async function deleteUsers() {
  try {
    const client = await pool.connect();
    
    // Delete all related data first
    await client.query('DELETE FROM trades');
    await client.query('DELETE FROM strategies');
    await client.query('DELETE FROM users');
    
    console.log('All users and related data deleted successfully!');
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteUsers();
