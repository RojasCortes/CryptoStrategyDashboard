import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Firebase Admin initialization for token verification
let firebaseAdmin = null;
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

async function initFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;
  
  if (serviceAccountKey) {
    try {
      const admin = await import('firebase-admin');
      
      let credential;
      try {
        // Try parsing as JSON string first
        const parsed = JSON.parse(serviceAccountKey);
        credential = admin.credential.cert(parsed);
      } catch {
        // Try base64 decoding
        try {
          const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf8');
          const parsed = JSON.parse(decoded);
          credential = admin.credential.cert(parsed);
        } catch {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY');
          return null;
        }
      }
      
      if (!admin.apps.length) {
        admin.initializeApp({ credential });
      }
      firebaseAdmin = admin;
      return admin;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      return null;
    }
  }
  return null;
}

// Initialize Supabase client - check multiple possible env var names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Also support direct database URL for Drizzle/PostgreSQL style connection
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

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

  // Enable CORS - More permissive configuration for Vercel deployment
  const origin = headers.origin || headers.referer;

  // Allow requests from Vercel domains, localhost, and any origin for serverless
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Health check
  if (pathname === '/api/health' || pathname === '/api/health/') {
    return res.status(200).json({
      status: 'ok',
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      hasSupabase: !!supabase,
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        hasDatabaseUrl: !!databaseUrl,
        hasFirebaseProjectId: !!firebaseProjectId,
        hasFirebaseServiceKey: !!serviceAccountKey
      }
    });
  }

  // Debug endpoint - only for troubleshooting
  if (pathname === '/api/debug/config' || pathname === '/api/debug/config/') {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        hasDatabaseUrl: !!databaseUrl,
        hasFirebaseProjectId: !!firebaseProjectId,
        hasFirebaseServiceKey: !!serviceAccountKey,
        firebaseProjectId: firebaseProjectId || 'not configured',
        supabaseConfigured: !!supabase,
      },
      note: 'This endpoint shows configuration status without exposing sensitive values'
    });
  }
  
  // Firebase status endpoint
  if (pathname === '/api/auth/firebase-status' || pathname === '/api/auth/firebase-status/') {
    const admin = await initFirebaseAdmin();
    const hasFirebaseEnvVars = !!(
      process.env.FIREBASE_PROJECT_ID ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      (process.env.VITE_FIREBASE_PROJECT_ID && process.env.VITE_FIREBASE_API_KEY)
    );

    return res.status(200).json({
      configured: !!admin,
      hasClientConfig: !!(process.env.VITE_FIREBASE_PROJECT_ID && process.env.VITE_FIREBASE_API_KEY),
      hasServerConfig: !!admin,
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || null,
      timestamp: new Date().toISOString()
    });
  }

  // Firebase Auth Session endpoint - syncs Firebase auth with backend
  if ((pathname === '/api/auth/session' || pathname === '/api/auth/session/') && method === 'POST') {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      let email, name, uid, picture;

      // Try Firebase Admin verification first (cryptographically secure)
      const admin = await initFirebaseAdmin();
      if (admin) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          email = decodedToken.email;
          name = decodedToken.name;
          uid = decodedToken.uid;
          picture = decodedToken.picture;
          console.log('Token verified with Firebase Admin for user:', email || uid);
        } catch (verifyError) {
          console.error('Firebase token verification failed:', verifyError.message);
          return res.status(401).json({ error: 'Invalid or expired token' });
        }
      } else {
        // Fallback: Basic JWT validation (NOT cryptographically secure)
        console.warn('SECURITY WARNING: Firebase Admin not configured, using basic JWT validation');

        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          return res.status(401).json({ error: 'Invalid token format' });
        }

        let payload;
        try {
          let base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) base64 += '=';
          payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
        } catch (decodeError) {
          return res.status(401).json({ error: 'Invalid token encoding' });
        }

        const { iss, exp, iat } = payload;
        email = payload.email;
        name = payload.name;
        uid = payload.user_id || payload.sub;
        picture = payload.picture;

        // Basic validation checks
        const now = Math.floor(Date.now() / 1000);
        if (exp && exp < now) {
          return res.status(401).json({ error: 'Token expired' });
        }
        if (iat && (now - iat) > 3600) {
          return res.status(401).json({ error: 'Token too old' });
        }
        if (iss && !iss.includes('securetoken.google.com') && !iss.includes('firebase')) {
          return res.status(401).json({ error: 'Invalid token issuer' });
        }
      }

      if (!uid) {
        return res.status(401).json({ error: 'Invalid token: missing user ID' });
      }

      // Prepare basic user data from Firebase token (ALWAYS available)
      const username = name || email?.split('@')[0] || `user_${uid.substring(0, 8)}`;
      const userData = {
        id: uid, // Use Firebase UID as primary ID
        username,
        email: email || '',
        displayName: name || username,
        photoURL: picture || null,
        firebaseUid: uid,
        apiKey: null // Will be populated from Supabase if available
      };

      // Try to sync with Supabase (OPTIONAL - non-blocking)
      if (supabase) {
        try {
          // Check if user exists by Firebase UID
          const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('firebase_uid', uid)
            .maybeSingle(); // Use maybeSingle() to avoid error if no rows found

          if (selectError) {
            console.warn('Supabase select error:', selectError.message);
          } else if (existingUser) {
            // User exists in Supabase - merge data
            userData.id = existingUser.id;
            userData.username = existingUser.username || userData.username;
            userData.displayName = existingUser.display_name || userData.displayName;
            userData.photoURL = existingUser.photo_url || userData.photoURL;
            userData.apiKey = existingUser.api_key ? '***configured***' : null;

            console.log('User found in Supabase:', existingUser.id);
          } else if (email) {
            // Try to create user in Supabase
            console.log('Creating new user in Supabase for:', email);
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert([{
                username,
                email: email || `${username}@firebase.local`,
                firebase_uid: uid,
                display_name: name,
                photo_url: picture,
                password: crypto.randomBytes(32).toString('hex') // Random password for Firebase users
              }])
              .select()
              .single();

            if (insertError) {
              console.warn('Could not create user in Supabase:', insertError.message);
              // Continue anyway - app works without Supabase
            } else if (newUser) {
              userData.id = newUser.id;
              userData.displayName = newUser.display_name || userData.displayName;
              userData.photoURL = newUser.photo_url || userData.photoURL;
              console.log('User created in Supabase:', newUser.id);
            }
          }
        } catch (dbError) {
          console.warn('Supabase operation failed:', dbError.message);
          // Continue anyway - app works without Supabase
        }
      }

      // ALWAYS return user data, even if Supabase failed
      return res.status(200).json(userData);

    } catch (error) {
      console.error('Session endpoint error:', error);
      return res.status(500).json({
        error: 'Failed to create session',
        details: error.message
      });
    }
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
  
  // Market data endpoints - NOTE: /api/market-data should be handled by api/market-data.js
  // This is a fallback if that route doesn't work
  if (pathname === '/api/market-data' || pathname === '/api/market-data/') {
    // Return array format matching MarketData[] interface expected by client
    const mockData = [
      {
        symbol: 'BTCUSDT',
        price: '43250.00',
        priceChangePercent: '2.45',
        change24h: 2.45,
        volume: '1234567',
        lastUpdate: Date.now()
      },
      {
        symbol: 'ETHUSDT',
        price: '2650.00',
        priceChangePercent: '1.85',
        change24h: 1.85,
        volume: '987654',
        lastUpdate: Date.now()
      },
      {
        symbol: 'BNBUSDT',
        price: '310.50',
        priceChangePercent: '0.95',
        change24h: 0.95,
        volume: '456789',
        lastUpdate: Date.now()
      },
      {
        symbol: 'SOLUSDT',
        price: '95.75',
        priceChangePercent: '3.15',
        change24h: 3.15,
        volume: '234567',
        lastUpdate: Date.now()
      },
    ];
    return res.status(200).json(mockData);
  }

  // Legacy market/data endpoint
  if (pathname === '/api/market/data' || pathname === '/api/market/data/') {
    const mockData = [
      {
        symbol: 'BTCUSDT',
        price: '43250.00',
        priceChangePercent: '2.45',
        change24h: 2.45,
        volume: '1234567',
        lastUpdate: Date.now()
      },
      {
        symbol: 'ETHUSDT',
        price: '2650.00',
        priceChangePercent: '1.85',
        change24h: 1.85,
        volume: '987654',
        lastUpdate: Date.now()
      },
    ];
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