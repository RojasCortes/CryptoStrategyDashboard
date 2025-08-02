// Supabase configuration for production deployment
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for serverless environments
neonConfig.webSocketConstructor = ws;

// Supabase connection configuration
export function createSupabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set. For Supabase:\n" +
      "1. Go to https://supabase.com/dashboard\n" +
      "2. Create a new project\n" +
      "3. Go to Settings → Database\n" +
      "4. Copy the URI from 'Connection pooling'\n" +
      "5. Replace [YOUR-PASSWORD] with your database password\n" +
      "6. Set as DATABASE_URL environment variable"
    );
  }

  console.log('Connecting to Supabase PostgreSQL database...');
  
  // Create connection pool optimized for serverless
  const pool = new Pool({ 
    connectionString: databaseUrl,
    // Serverless optimizations
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 10000, // Connection timeout 10s
  });

  // Create Drizzle instance
  const db = drizzle({ client: pool, schema });
  
  console.log('Successfully connected to Supabase PostgreSQL');
  
  return { pool, db };
}

// Export for use in production
export const { pool, db } = createSupabaseConnection();

// Health check for database connection
export async function checkDatabaseHealth() {
  try {
    await pool.query('SELECT 1');
    return {
      status: 'healthy',
      provider: 'Supabase PostgreSQL',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      provider: 'Supabase PostgreSQL',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}