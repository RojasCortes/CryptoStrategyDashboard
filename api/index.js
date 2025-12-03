import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

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

// Secure password hashing with bcrypt
const SALT_ROUNDS = 12; // Higher = more secure but slower

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Encryption key for API keys (use a strong key from environment)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

// Encrypt sensitive data (API keys, secrets)
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  };
}

// Decrypt sensitive data
function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32),
    Buffer.from(encrypted.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

  let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Simple rate limiting (in-memory, resets on function restart)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

function checkRateLimit(identifier) {
  const now = Date.now();
  const userLimits = rateLimits.get(identifier) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

  // Reset if window expired
  if (now > userLimits.resetAt) {
    userLimits.count = 0;
    userLimits.resetAt = now + RATE_LIMIT_WINDOW;
  }

  userLimits.count++;
  rateLimits.set(identifier, userLimits);

  if (userLimits.count > MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }

  return true; // OK
}

// Helper to verify Firebase JWT token from Authorization header
async function verifyFirebaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const admin = await initFirebaseAdmin();

    if (!admin) {
      console.warn('Firebase Admin not initialized, cannot verify token');
      return null;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid; // Return Firebase UID
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
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
      
      // Create user with bcrypt hashed password
      const hashedPassword = await hashPassword(password);
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ username, password: hashedPassword, email }])
        .select()
        .single();

      if (error) throw error;

      // Return user data (Firebase JWT handles session)
      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        message: 'User created successfully. Please login with Firebase.'
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
      
      // Get user by username
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password with bcrypt
      const isValidPassword = await comparePassword(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Return user data (Firebase JWT handles session)
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        message: 'Login successful. Use Firebase authentication.'
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Logout endpoint (Firebase handles session on client-side)
  if ((pathname === '/api/logout' || pathname === '/api/logout/') && method === 'POST') {
    // With JWT-based auth, logout is handled on the client by clearing the Firebase token
    return res.status(200).json({
      message: 'Logout successful. Clear Firebase token on client.',
      success: true
    });
  }
  
  // User endpoint (use /api/auth/session instead for Firebase auth)
  if (pathname === '/api/user' || pathname === '/api/user/') {
    const firebaseUid = await verifyFirebaseToken(headers.authorization);

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, email, firebase_uid')
        .eq('firebase_uid', firebaseUid)
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

    const firebaseUid = await verifyFirebaseToken(headers.authorization);

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    // Get user ID from firebase_uid
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    const userId = userData?.id;
    
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

    const firebaseUid = await verifyFirebaseToken(headers.authorization);

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    // Get user ID from firebase_uid
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    const userId = userData?.id;
    
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
    const firebaseUid = await verifyFirebaseToken(headers.authorization);

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    // Return mock account data (or implement real Binance API call with decrypted keys)
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
  
  // Update API keys endpoint - NOW WITH AES-256 ENCRYPTION
  // Support both /api/user/api-keys and /api/user/apikeys for compatibility
  if ((pathname === '/api/user/api-keys' || pathname === '/api/user/api-keys/' ||
       pathname === '/api/user/apikeys' || pathname === '/api/user/apikeys/') &&
      (method === 'PUT' || method === 'POST')) {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const firebaseUid = await verifyFirebaseToken(headers.authorization);

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    try {
      const { apiKey, apiSecret } = body;

      if (!apiKey || !apiSecret) {
        return res.status(400).json({ error: 'API key and secret are required' });
      }

      // ENCRYPT API keys before storing (AES-256-GCM)
      const encryptedKey = encrypt(apiKey);
      const encryptedSecret = encrypt(apiSecret);

      // Store encrypted data as JSON string
      const { data: user, error } = await supabase
        .from('users')
        .update({
          binance_api_key: JSON.stringify(encryptedKey),
          binance_api_secret: JSON.stringify(encryptedSecret)
        })
        .eq('firebase_uid', firebaseUid)
        .select('id, username, email')
        .single();

      if (error) throw error;

      return res.status(200).json({
        ...user,
        message: 'API keys encrypted and saved successfully'
      });
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
      { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
      { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
      { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' },
      { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT' },
      { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT' },
      { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
      { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT' },
      { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT' },
      { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT' },
      { symbol: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT' }
    ];
    return res.status(200).json(pairs);
  }
  
  // Additional endpoints that might be needed
  if (pathname === '/api/notifications' || pathname === '/api/notifications/') {
    return res.status(200).json([]);
  }
  
  if (pathname.startsWith('/api/trades') && pathname.includes('limit')) {
    const firebaseUid = await verifyFirebaseToken(headers.authorization);

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
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