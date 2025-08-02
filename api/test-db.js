const { Pool } = require('@neondatabase/serverless');

const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

async function testDatabase() {
  try {
    const pool = new Pool({ 
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const result = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', ['public']);
    
    return {
      success: true,
      tables: result.rows.map(row => row.table_name),
      timestamp: new Date().toISOString(),
      databaseUrl: databaseUrl ? 'Present' : 'Missing'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      databaseUrl: databaseUrl ? 'Present' : 'Missing'
    };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const result = await testDatabase();
  res.status(result.success ? 200 : 500).json(result);
};