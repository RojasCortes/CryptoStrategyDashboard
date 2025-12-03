import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import admin from 'firebase-admin';

// Firebase Admin initialization for token verification
let firebaseAdmin = null;
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

function initFirebaseAdmin() {
  if (firebaseAdmin) {
    console.log('[initFirebaseAdmin] Already initialized, returning cached instance');
    return firebaseAdmin;
  }

  console.log('[initFirebaseAdmin] Starting initialization...');
  console.log('[initFirebaseAdmin] Has serviceAccountKey:', !!serviceAccountKey);

  if (serviceAccountKey) {
    try {
      console.log('[initFirebaseAdmin] firebase-admin imported successfully');

      let credential;
      let parseMethod = 'unknown';
      try {
        // Try parsing as JSON string first
        console.log('[initFirebaseAdmin] Attempting JSON parse...');
        const parsed = JSON.parse(serviceAccountKey);
        console.log('[initFirebaseAdmin] JSON parsed, project_id:', parsed.project_id);
        credential = admin.credential.cert(parsed);
        parseMethod = 'direct-json';
      } catch (e1) {
        console.log('[initFirebaseAdmin] Direct JSON parse failed, trying base64:', e1.message);
        // Try base64 decoding
        try {
          const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf8');
          const parsed = JSON.parse(decoded);
          console.log('[initFirebaseAdmin] Base64 decoded and parsed, project_id:', parsed.project_id);
          credential = admin.credential.cert(parsed);
          parseMethod = 'base64-decoded';
        } catch (e2) {
          console.error('[initFirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e2.message);
          return null;
        }
      }

      console.log('[initFirebaseAdmin] Credential created using:', parseMethod);
      console.log('[initFirebaseAdmin] Existing apps count:', admin.apps.length);

      if (!admin.apps.length) {
        admin.initializeApp({ credential });
        console.log('[initFirebaseAdmin] Firebase Admin app initialized');
      } else {
        console.log('[initFirebaseAdmin] Using existing Firebase Admin app');
      }

      firebaseAdmin = admin;
      console.log('[initFirebaseAdmin] Initialization complete');
      return admin;
    } catch (error) {
      console.error('[initFirebaseAdmin] Failed to initialize Firebase Admin:', error);
      console.error('[initFirebaseAdmin] Error stack:', error.stack);
      console.error('[initFirebaseAdmin] Error name:', error.name);
      console.error('[initFirebaseAdmin] Error code:', error.code);
      return null;
    }
  }

  console.error('[initFirebaseAdmin] No serviceAccountKey found');
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
    console.log('[verifyToken] No auth header or wrong format');
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const admin = initFirebaseAdmin();

    if (!admin) {
      console.error('[verifyToken] Firebase Admin not initialized');
      return null;
    }

    console.log('[verifyToken] Attempting to verify token...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('[verifyToken] Token verified successfully, UID:', decodedToken.uid);
    return decodedToken.uid; // Return Firebase UID
  } catch (error) {
    console.error('[verifyToken] Token verification failed:', error.message);
    console.error('[verifyToken] Error code:', error.code);
    console.error('[verifyToken] Full error:', error);
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
  // NOTE: Removed Access-Control-Allow-Credentials to allow wildcard origin (*)
  // JWT Bearer tokens in Authorization header don't require credentials mode
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

  // Firebase Debug endpoint - to diagnose initialization issues
  if (pathname === '/api/debug/firebase' || pathname === '/api/debug/firebase/') {
    const admin = initFirebaseAdmin();
    const hasServiceKey = !!serviceAccountKey;
    let keyFormat = 'none';
    let parseError = null;

    if (hasServiceKey) {
      try {
        JSON.parse(serviceAccountKey);
        keyFormat = 'valid-json';
      } catch (e1) {
        try {
          const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf8');
          JSON.parse(decoded);
          keyFormat = 'valid-base64-json';
        } catch (e2) {
          keyFormat = 'invalid-format';
          parseError = e2.message;
        }
      }
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      hasServiceAccountKey: hasServiceKey,
      serviceKeyLength: hasServiceKey ? serviceAccountKey.length : 0,
      serviceKeyFormat: keyFormat,
      parseError,
      firebaseAdminInitialized: !!admin,
      firebaseProjectId,
      appsCount: admin ? admin.apps.length : 0
    });
  }

  // Firebase status endpoint
  if (pathname === '/api/auth/firebase-status' || pathname === '/api/auth/firebase-status/') {
    const admin = initFirebaseAdmin();
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
      const admin = initFirebaseAdmin();
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
        apiKey: null, // Will be populated from Supabase if available
        apiSecret: null // Will be populated from Supabase if available
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
            userData.apiSecret = existingUser.api_secret ? '***configured***' : null;

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
        .select('id, username, email, firebase_uid, api_key, api_secret')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return user data with API key status (not the actual keys)
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firebase_uid: user.firebase_uid,
        // Indicate if keys are configured without exposing actual values
        apiKey: user.api_key ? '***configured***' : null,
        apiSecret: user.api_secret ? '***configured***' : null
      });
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
  
  // Binance account info endpoint (multiple route aliases)
  if (pathname === '/api/binance/account' || pathname === '/api/binance/account/' ||
      pathname === '/api/account/balance' || pathname === '/api/account/balance/') {
    const firebaseUid = await verifyFirebaseToken(headers.authorization);

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    // Return mock account data matching AccountInfo interface
    const mockBalances = [
      {
        asset: 'USDT',
        free: '1280.00',
        locked: '0.00',
        total: 1280.00,
        usdValue: '1280.00'
      },
      {
        asset: 'BTC',
        free: '0.02850000',
        locked: '0.00',
        total: 0.02850000,
        usdValue: '2650.00' // ~$93k per BTC
      },
      {
        asset: 'ETH',
        free: '4.75000000',
        locked: '0.00',
        total: 4.75,
        usdValue: '14250.00' // ~$3k per ETH
      }
    ];

    return res.status(200).json({
      makerCommission: 10,
      takerCommission: 10,
      buyerCommission: 0,
      sellerCommission: 0,
      canTrade: true,
      canWithdraw: true,
      canDeposit: true,
      updateTime: Date.now(),
      accountType: 'SPOT',
      balances: mockBalances,
      permissions: ['SPOT'],
      totalBalanceUSD: mockBalances.reduce((sum, b) => sum + parseFloat(b.usdValue), 0)
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

    console.log('[API Keys] Endpoint called, method:', method);
    console.log('[API Keys] Has Authorization header:', !!headers.authorization);

    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const firebaseUid = await verifyFirebaseToken(headers.authorization);

    console.log('[API Keys] Firebase UID from token:', firebaseUid);

    if (!firebaseUid) {
      return res.status(401).json({
        error: 'Not authenticated. Use Firebase JWT token.',
        debug: {
          hasAuthHeader: !!headers.authorization,
          hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
          authHeaderFormat: headers.authorization ? headers.authorization.substring(0, 20) + '...' : 'missing'
        }
      });
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
          api_key: JSON.stringify(encryptedKey),
          api_secret: JSON.stringify(encryptedSecret)
        })
        .eq('firebase_uid', firebaseUid)
        .select('id, username, email, firebase_uid')
        .single();

      if (error) throw error;

      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firebase_uid: user.firebase_uid,
        // Indicate keys are now configured
        apiKey: '***configured***',
        apiSecret: '***configured***',
        message: 'API keys encrypted and saved successfully'
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Cryptocurrency list endpoint
  if (pathname === '/api/cryptocurrencies' || pathname === '/api/cryptocurrencies/' ||
      pathname === '/api/market/cryptocurrencies' || pathname === '/api/market/cryptocurrencies/') {
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
  
  // WebSocket stats endpoint
  if (pathname === '/api/ws/stats' || pathname === '/api/ws/stats/') {
    return res.status(200).json({
      connected: true,
      latency: 45,
      lastUpdate: Date.now(),
      reconnections: 0,
      messagesReceived: 1250,
      status: 'healthy'
    });
  }

  // Notifications endpoint
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