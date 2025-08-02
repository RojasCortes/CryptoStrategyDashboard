import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Simple session storage (in production, use a proper session store)
const sessions = new Map();

// Helper function to hash passwords
async function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper function to create session
function createSession(userId) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  sessions.set(sessionId, { userId, createdAt: Date.now() });
  return sessionId;
}

// Helper function to get user from session
function getUserFromSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  // Simple session expiry (24 hours)
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    sessions.delete(sessionId);
    return null;
  }
  return session.userId;
}

export default async function handler(req, res) {
  const { url, method, body, headers } = req;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Health check
  if (url === '/api/health' || url === '/api/health/') {
    return res.status(200).json({ 
      status: 'ok',
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      hasSupabase: !!supabase
    });
  }
  
  // Register endpoint
  if ((url === '/api/register' || url === '/api/register/') && method === 'POST') {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }
    
    try {
      const { username, password, email } = body;
      
      if (!username || !password || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
        
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      // Create user
      const hashedPassword = await hashPassword(password);
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ username, password: hashedPassword, email }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Create session
      const sessionId = createSession(newUser.id);
      
      return res.status(201).json({ 
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        sessionId
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Login endpoint
  if ((url === '/api/login' || url === '/api/login/') && method === 'POST') {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }
    
    try {
      const { username, password } = body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
      }
      
      // Get user
      const hashedPassword = await hashPassword(password);
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', hashedPassword)
        .single();
        
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Create session
      const sessionId = createSession(user.id);
      
      return res.status(200).json({ 
        id: user.id,
        username: user.username,
        email: user.email,
        sessionId
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Logout endpoint
  if ((url === '/api/logout' || url === '/api/logout/') && method === 'POST') {
    const sessionId = headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      sessions.delete(sessionId);
    }
    return res.status(200).json({ message: 'Logged out successfully' });
  }
  
  // User endpoint
  if (url === '/api/user' || url === '/api/user/') {
    const sessionId = headers.authorization?.replace('Bearer ', '');
    const userId = sessionId ? getUserFromSession(sessionId) : null;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }
    
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, email')
        .eq('id', userId)
        .single();
        
      if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Default 404 for unknown API routes
  return res.status(404).json({ 
    error: 'API route not found',
    path: url
  });
}