// Vercel serverless function format
export default function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');
    
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasDatabaseUrl: !!process.env.SUPABASE_DATABASE_URL,
        hasSessionSecret: !!(process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET)
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}