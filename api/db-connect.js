const { Pool } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    
    // Try to get database URL from environment
    const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        error: 'No database URL found',
        hasSupabaseUrl: !!process.env.SUPABASE_DATABASE_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      });
    }
    
    // Test database connection
    const pool = new Pool({ 
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await pool.query('SELECT NOW() as current_time');
    
    await pool.end();
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      databaseTime: result.rows[0].current_time,
      connectionWorking: true
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};