import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing Supabase configuration'
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      message: 'Database connected',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}