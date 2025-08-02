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
  
  // Parse URL to handle query parameters
  const urlObj = new URL(url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Health check
  if (pathname === '/api/health' || pathname === '/api/health/') {
    return res.status(200).json({ 
      status: 'ok',
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      hasSupabase: !!supabase
    });
  }
  
  // Register endpoint
  if ((pathname === '/api/register' || pathname === '/api/register/') && method === 'POST') {
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
  if ((pathname === '/api/login' || pathname === '/api/login/') && method === 'POST') {
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
  if ((pathname === '/api/logout' || pathname === '/api/logout/') && method === 'POST') {
    const sessionId = headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      sessions.delete(sessionId);
    }
    return res.status(200).json({ message: 'Logged out successfully' });
  }
  
  // User endpoint
  if (pathname === '/api/user' || pathname === '/api/user/') {
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
  
  // Market data endpoints - handle multiple variations
  if (pathname === '/api/market-data' || pathname === '/api/market-data/' || 
      pathname === '/api/market/data' || pathname === '/api/market/data/') {
    // Mock market data since we don't have API keys in serverless function
    const mockData = {
      symbols: [
        { symbol: 'BTCUSDT', price: '43250.00', change: '+2.45%', volume: '1234567' },
        { symbol: 'ETHUSDT', price: '2650.00', change: '+1.85%', volume: '987654' },
        { symbol: 'BNBUSDT', price: '310.50', change: '+0.95%', volume: '456789' },
      ],
      timestamp: new Date().toISOString()
    };
    return res.status(200).json(mockData);
  }
  
  // Strategies endpoint
  if (pathname === '/api/strategies' || pathname === '/api/strategies/') {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }
    
    const sessionId = headers.authorization?.replace('Bearer ', '');
    const userId = sessionId ? getUserFromSession(sessionId) : null;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (method === 'GET') {
      try {
        const { data: strategies, error } = await supabase
          .from('strategies')
          .select('*')
          .eq('user_id', userId);
          
        if (error) throw error;
        return res.status(200).json(strategies || []);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }
    
    if (method === 'POST') {
      try {
        const { name, description, parameters } = body;
        const { data: strategy, error } = await supabase
          .from('strategies')
          .insert([{ name, description, parameters, user_id: userId }])
          .select()
          .single();
          
        if (error) throw error;
        return res.status(201).json(strategy);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }
  }
  
  // Trades endpoint
  if (pathname === '/api/trades' || pathname === '/api/trades/') {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }
    
    const sessionId = headers.authorization?.replace('Bearer ', '');
    const userId = sessionId ? getUserFromSession(sessionId) : null;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return res.status(200).json(trades || []);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Binance account info endpoint
  if (pathname === '/api/binance/account' || pathname === '/api/binance/account/') {
    const sessionId = headers.authorization?.replace('Bearer ', '');
    const userId = sessionId ? getUserFromSession(sessionId) : null;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Return mock account data since we can't store API keys in serverless functions
    return res.status(200).json({
      balances: [
        { asset: 'USDT', free: '1280.00', locked: '0.00' },
        { asset: 'BTC', free: '0.02850000', locked: '0.00' },
        { asset: 'ETH', free: '4.75000000', locked: '0.00' }
      ],
      totalWalletBalance: '12500.00',
      totalUnrealizedPnl: '0.00',
      totalMarginBalance: '12500.00'
    });
  }
  
  // Binance price endpoint
  if (pathname === '/api/binance/price' || pathname === '/api/binance/price/') {
    // Return mock price data
    return res.status(200).json([
      { symbol: 'BTCUSDT', price: '43250.00' },
      { symbol: 'ETHUSDT', price: '2650.00' },
      { symbol: 'BNBUSDT', price: '310.50' },
      { symbol: 'ADAUSDT', price: '0.4850' },
      { symbol: 'DOTUSDT', price: '7.25' }
    ]);
  }
  
  // Update API keys endpoint
  if ((pathname === '/api/user/api-keys' || pathname === '/api/user/api-keys/') && method === 'PUT') {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }
    
    const sessionId = headers.authorization?.replace('Bearer ', '');
    const userId = sessionId ? getUserFromSession(sessionId) : null;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      const { apiKey, apiSecret } = body;
      
      // In a real implementation, encrypt these keys
      const { data: user, error } = await supabase
        .from('users')
        .update({ 
          binance_api_key: apiKey,
          binance_api_secret: apiSecret 
        })
        .eq('id', userId)
        .select('id, username, email')
        .single();
        
      if (error) throw error;
      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Cryptocurrency list endpoint
  if (pathname === '/api/cryptocurrencies' || pathname === '/api/cryptocurrencies/') {
    // Return a subset of popular cryptocurrencies
    const cryptos = [
      { symbol: 'BTC', name: 'Bitcoin', price: '43250.00', change: '+2.45%' },
      { symbol: 'ETH', name: 'Ethereum', price: '2650.00', change: '+1.85%' },
      { symbol: 'BNB', name: 'BNB', price: '310.50', change: '+0.95%' },
      { symbol: 'ADA', name: 'Cardano', price: '0.4850', change: '-0.75%' },
      { symbol: 'DOT', name: 'Polkadot', price: '7.25', change: '+1.25%' },
      { symbol: 'SOL', name: 'Solana', price: '95.75', change: '+3.15%' },
      { symbol: 'MATIC', name: 'Polygon', price: '0.8950', change: '+2.05%' },
      { symbol: 'AVAX', name: 'Avalanche', price: '36.50', change: '+1.95%' }
    ];
    return res.status(200).json(cryptos);
  }
  
  // Trading pairs endpoint
  if (pathname === '/api/trading-pairs' || pathname === '/api/trading-pairs/' ||
      pathname === '/api/market/pairs' || pathname === '/api/market/pairs/') {
    const pairs = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT',
      'SOLUSDT', 'MATICUSDT', 'AVAXUSDT', 'LINKUSDT', 'UNIUSDT'
    ];
    return res.status(200).json(pairs);
  }
  
  // Additional endpoints that might be needed
  if (pathname === '/api/notifications' || pathname === '/api/notifications/') {
    return res.status(200).json([]);
  }
  
  if (pathname.startsWith('/api/trades') && pathname.includes('limit')) {
    const sessionId = headers.authorization?.replace('Bearer ', '');
    const userId = sessionId ? getUserFromSession(sessionId) : null;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    return res.status(200).json([]);
  }
  
  // Handle market data with symbols parameter
  if (pathname === '/api/market/data' && urlObj.searchParams.get('symbols')) {
    const symbols = urlObj.searchParams.get('symbols').split(',');
    const mockData = symbols.map(symbol => ({
      symbol: symbol,
      price: (Math.random() * 50000 + 1000).toFixed(2),
      change: (Math.random() * 10 - 5).toFixed(2) + '%',
      volume: Math.floor(Math.random() * 10000000).toString()
    }));
    
    return res.status(200).json({ symbols: mockData, timestamp: new Date().toISOString() });
  }
  
  // Default 404 for unknown API routes
  return res.status(404).json({ 
    error: 'API route not found',
    path: pathname,
    fullUrl: url
  });
}