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

// Helper to parse request body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON in request body'));
      }
    });
    req.on('error', reject);
  });
}

// Helper to transform simulation data from snake_case to camelCase
function transformSimulation(session) {
  if (!session) return null;
  return {
    id: session.id,
    userId: session.user_id,
    strategyId: session.strategy_id,
    name: session.name,
    initialBalance: session.initial_balance,
    currentBalance: session.current_balance,
    startDate: session.start_date,
    endDate: session.end_date,
    status: session.status,
    totalTrades: session.total_trades ?? 0,
    winningTrades: session.winning_trades ?? 0,
    losingTrades: session.losing_trades ?? 0,
    totalProfitLoss: session.total_profit_loss ?? 0,
    maxDrawdown: session.max_drawdown ?? 0,
    returnPercentage: session.return_percentage ?? 0,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  };
}

// Helper to transform trade data from snake_case to camelCase
function transformTrade(trade) {
  if (!trade) return null;
  return {
    id: trade.id,
    simulationId: trade.simulation_id,
    userId: trade.user_id,
    strategyId: trade.strategy_id,
    pair: trade.pair,
    type: trade.type,
    price: trade.price,
    amount: trade.amount,
    fee: trade.fee ?? 0,
    total: trade.total,
    balanceAfter: trade.balance_after,
    profitLoss: trade.profit_loss ?? 0,
    reason: trade.reason,
    executedAt: trade.executed_at,
    createdAt: trade.created_at,
  };
}

// Helper to transform balance history from snake_case to camelCase
function transformBalanceHistory(item) {
  if (!item) return null;
  return {
    id: item.id,
    simulationId: item.simulation_id,
    balance: item.balance ?? 0,
    timestamp: item.timestamp,
    createdAt: item.created_at,
  };
}

// Helper to fetch historical data from Binance
async function fetchBinanceKlines(symbol, interval, startTime, endTime) {
  try {
    const limit = 1000; // Binance max
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    return data.map(candle => ({
      openTime: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
      closeTime: candle[6],
    }));
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    return [];
  }
}

// Calculate RSI indicator
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) gains += changes[i];
    else losses += Math.abs(changes[i]);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

// Simulation engine - runs the strategy simulation
async function runSimulation(simulationId, strategy, config, supabase) {
  try {
    console.log(`[Simulation ${simulationId}] Starting simulation...`);

    const { initial_balance, start_date, end_date } = config;
    const symbol = strategy.pair.replace('/', '');
    const interval = strategy.interval || '1h';

    const startTime = new Date(start_date).getTime();
    const endTime = new Date(end_date).getTime();

    // Fetch historical data
    console.log(`[Simulation ${simulationId}] Fetching data for ${symbol}...`);
    const candles = await fetchBinanceKlines(symbol, interval, startTime, endTime);

    if (candles.length === 0) {
      throw new Error('No historical data available');
    }

    console.log(`[Simulation ${simulationId}] Processing ${candles.length} candles...`);

    // Simulation state
    let balance = initial_balance;
    let position = null; // { amount, entryPrice, entryTime }
    const trades = [];
    const balanceHistory = [];
    let peakBalance = initial_balance;
    let maxDrawdown = 0;

    // Add initial balance to history
    balanceHistory.push({
      simulation_id: simulationId,
      balance: balance,
      timestamp: new Date(candles[0].openTime).toISOString(),
    });

    // Process each candle
    for (let i = 14; i < candles.length; i++) {
      const candle = candles[i];
      const prices = candles.slice(Math.max(0, i - 50), i + 1).map(c => c.close);
      const currentPrice = candle.close;
      const timestamp = new Date(candle.closeTime).toISOString();

      // Calculate indicators based on strategy type
      const rsi = calculateRSI(prices);

      // Generate trading signals based on strategy
      let shouldBuy = false;
      let shouldSell = false;
      let reason = '';

      if (strategy.strategy_type === 'rsi_oversold' && rsi !== null) {
        const rsiOversold = strategy.rsi_oversold || 30;
        const rsiOverbought = strategy.rsi_overbought || 70;

        if (!position && rsi < rsiOversold) {
          shouldBuy = true;
          reason = `RSI oversold (${rsi.toFixed(2)})`;
        } else if (position && rsi > rsiOverbought) {
          shouldSell = true;
          reason = `RSI overbought (${rsi.toFixed(2)})`;
        }
      } else if (strategy.strategy_type === 'price_threshold') {
        const buyPrice = strategy.buy_price;
        const sellPrice = strategy.sell_price;

        if (!position && buyPrice && currentPrice <= buyPrice) {
          shouldBuy = true;
          reason = `Price at or below buy threshold ($${buyPrice})`;
        } else if (position && sellPrice && currentPrice >= sellPrice) {
          shouldSell = true;
          reason = `Price at or above sell threshold ($${sellPrice})`;
        }
      } else {
        // Default simple strategy: buy low, sell high
        if (!position && i % 20 === 0) {
          shouldBuy = true;
          reason = 'Strategy trigger';
        } else if (position && i % 15 === 0) {
          shouldSell = true;
          reason = 'Strategy trigger';
        }
      }

      // Execute buy
      if (shouldBuy && balance > 0) {
        const fee = balance * 0.001; // 0.1% fee
        const amountToInvest = balance - fee;
        const amount = amountToInvest / currentPrice;

        position = {
          amount,
          entryPrice: currentPrice,
          entryTime: timestamp,
        };

        balance = 0;

        trades.push({
          simulation_id: simulationId,
          user_id: config.user_id,
          strategy_id: strategy.id,
          pair: strategy.pair,
          type: 'BUY',
          price: currentPrice,
          amount,
          fee,
          total: amountToInvest,
          balance_after: balance,
          profit_loss: 0,
          reason,
          executed_at: timestamp,
        });

        console.log(`[Simulation ${simulationId}] BUY at $${currentPrice.toFixed(2)} - ${reason}`);
      }

      // Execute sell
      if (shouldSell && position) {
        const sellValue = position.amount * currentPrice;
        const fee = sellValue * 0.001; // 0.1% fee
        const profit = sellValue - fee - (position.amount * position.entryPrice);

        balance = sellValue - fee;

        trades.push({
          simulation_id: simulationId,
          user_id: config.user_id,
          strategy_id: strategy.id,
          pair: strategy.pair,
          type: 'SELL',
          price: currentPrice,
          amount: position.amount,
          fee,
          total: sellValue - fee,
          balance_after: balance,
          profit_loss: profit,
          reason,
          executed_at: timestamp,
        });

        console.log(`[Simulation ${simulationId}] SELL at $${currentPrice.toFixed(2)} - Profit: $${profit.toFixed(2)} - ${reason}`);

        position = null;
      }

      // Calculate current total value
      const currentValue = balance + (position ? position.amount * currentPrice : 0);

      // Update peak and drawdown
      if (currentValue > peakBalance) {
        peakBalance = currentValue;
      }
      const drawdown = ((peakBalance - currentValue) / peakBalance) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }

      // Record balance every 10 candles
      if (i % 10 === 0) {
        balanceHistory.push({
          simulation_id: simulationId,
          balance: currentValue,
          timestamp,
        });
      }
    }

    // Close any open position at the end
    if (position) {
      const finalPrice = candles[candles.length - 1].close;
      const sellValue = position.amount * finalPrice;
      const fee = sellValue * 0.001;
      const profit = sellValue - fee - (position.amount * position.entryPrice);

      balance = sellValue - fee;

      trades.push({
        simulation_id: simulationId,
        user_id: config.user_id,
        strategy_id: strategy.id,
        pair: strategy.pair,
        type: 'SELL',
        price: finalPrice,
        amount: position.amount,
        fee,
        total: sellValue - fee,
        balance_after: balance,
        profit_loss: profit,
        reason: 'Simulation end - closing position',
        executed_at: new Date(candles[candles.length - 1].closeTime).toISOString(),
      });
    }

    const finalBalance = balance;

    // Add final balance to history
    balanceHistory.push({
      simulation_id: simulationId,
      balance: finalBalance,
      timestamp: new Date(candles[candles.length - 1].closeTime).toISOString(),
    });

    // Calculate metrics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.type === 'SELL' && t.profit_loss > 0).length;
    const losingTrades = trades.filter(t => t.type === 'SELL' && t.profit_loss < 0).length;
    const totalProfitLoss = finalBalance - initial_balance;
    const returnPercentage = ((finalBalance - initial_balance) / initial_balance) * 100;

    console.log(`[Simulation ${simulationId}] Completed - Trades: ${totalTrades}, P/L: $${totalProfitLoss.toFixed(2)}, Return: ${returnPercentage.toFixed(2)}%`);

    // Save trades to database
    if (trades.length > 0) {
      const { error: tradesError } = await supabase
        .from('simulation_trades')
        .insert(trades);

      if (tradesError) {
        console.error(`[Simulation ${simulationId}] Error saving trades:`, tradesError);
      }
    }

    // Save balance history
    if (balanceHistory.length > 0) {
      const { error: historyError } = await supabase
        .from('simulation_balance_history')
        .insert(balanceHistory);

      if (historyError) {
        console.error(`[Simulation ${simulationId}] Error saving balance history:`, historyError);
      }
    }

    // Update simulation session
    const { error: updateError } = await supabase
      .from('simulation_sessions')
      .update({
        status: 'completed',
        current_balance: finalBalance,
        total_trades: totalTrades,
        winning_trades: winningTrades,
        losing_trades: losingTrades,
        total_profit_loss: totalProfitLoss,
        max_drawdown: maxDrawdown,
        return_percentage: returnPercentage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', simulationId);

    if (updateError) {
      console.error(`[Simulation ${simulationId}] Error updating session:`, updateError);
      throw updateError;
    }

    console.log(`[Simulation ${simulationId}] Successfully saved to database`);

    return {
      success: true,
      totalTrades,
      finalBalance,
      returnPercentage,
    };
  } catch (error) {
    console.error(`[Simulation ${simulationId}] Error:`, error);

    // Update simulation as failed
    await supabase
      .from('simulation_sessions')
      .update({
        status: 'stopped',
        updated_at: new Date().toISOString(),
      })
      .eq('id', simulationId);

    throw error;
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

  // Firebase status endpoint - MUST NEVER FAIL
  if (pathname === '/api/auth/firebase-status' || pathname === '/api/auth/firebase-status/') {
    try {
      const admin = initFirebaseAdmin();
      const hasFirebaseEnvVars = !!(
        process.env.FIREBASE_PROJECT_ID ||
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
        (process.env.VITE_FIREBASE_PROJECT_ID && process.env.VITE_FIREBASE_API_KEY)
      );

      return res.status(200).json({
        enabled: !!admin, // Frontend expects 'enabled'
        configured: !!admin,
        hasClientConfig: !!(process.env.VITE_FIREBASE_PROJECT_ID && process.env.VITE_FIREBASE_API_KEY),
        hasServerConfig: !!admin,
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Endpoint must never fail - return false if any error
      console.error('[firebase-status] Error checking Firebase status:', error);
      return res.status(200).json({
        enabled: false,
        configured: false,
        hasClientConfig: !!(process.env.VITE_FIREBASE_PROJECT_ID && process.env.VITE_FIREBASE_API_KEY),
        hasServerConfig: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
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
  
  // Binance account info endpoint (multiple route aliases) - REAL DATA
  if (pathname === '/api/binance/account' || pathname === '/api/binance/account/' ||
      pathname === '/api/account/balance' || pathname === '/api/account/balance/') {
    const firebaseUid = await verifyFirebaseToken(headers.authorization);

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    try {
      // Get user's encrypted API keys from database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('api_key, api_secret')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (userError || !user || !user.api_key || !user.api_secret) {
        return res.status(400).json({ error: 'API keys not configured. Please add your Binance API keys in settings.' });
      }

      // Decrypt API keys
      const encryptedKey = JSON.parse(user.api_key);
      const encryptedSecret = JSON.parse(user.api_secret);
      const apiKey = decrypt(encryptedKey);
      const apiSecret = decrypt(encryptedSecret);

      // Call Binance API - Account Information
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;

      // Create signature
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(queryString)
        .digest('hex');

      const binanceUrl = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`;

      const binanceResponse = await fetch(binanceUrl, {
        headers: {
          'X-MBX-APIKEY': apiKey
        }
      });

      if (!binanceResponse.ok) {
        const errorText = await binanceResponse.text();
        console.error('Binance API error:', errorText);
        return res.status(500).json({
          error: 'Failed to fetch Binance account data',
          details: errorText
        });
      }

      const accountData = await binanceResponse.json();

      // Get current prices for USD valuation
      const pricesResponse = await fetch('https://api.binance.com/api/v3/ticker/price');
      const prices = await pricesResponse.json();
      const priceMap = {};
      prices.forEach(p => {
        priceMap[p.symbol] = parseFloat(p.price);
      });

      // Filter and enrich balances with USD values
      const enrichedBalances = accountData.balances
        .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map(balance => {
          const free = parseFloat(balance.free);
          const locked = parseFloat(balance.locked);
          const total = free + locked;

          // Calculate USD value
          let usdValue = 0;
          if (balance.asset === 'USDT' || balance.asset === 'BUSD' || balance.asset === 'USDC') {
            usdValue = total;
          } else {
            const pairSymbol = `${balance.asset}USDT`;
            const price = priceMap[pairSymbol];
            if (price) {
              usdValue = total * price;
            }
          }

          return {
            asset: balance.asset,
            free: balance.free,
            locked: balance.locked,
            total,
            usdValue: usdValue.toFixed(2)
          };
        })
        .sort((a, b) => parseFloat(b.usdValue) - parseFloat(a.usdValue)); // Sort by USD value descending

      const totalBalanceUSD = enrichedBalances.reduce((sum, b) => sum + parseFloat(b.usdValue), 0);

      return res.status(200).json({
        makerCommission: accountData.makerCommission,
        takerCommission: accountData.takerCommission,
        buyerCommission: accountData.buyerCommission,
        sellerCommission: accountData.sellerCommission,
        canTrade: accountData.canTrade,
        canWithdraw: accountData.canWithdraw,
        canDeposit: accountData.canDeposit,
        updateTime: accountData.updateTime,
        accountType: accountData.accountType,
        balances: enrichedBalances,
        permissions: accountData.permissions,
        totalBalanceUSD
      });
    } catch (error) {
      console.error('Error fetching Binance account:', error);
      return res.status(500).json({
        error: 'Failed to fetch account balance',
        details: error.message
      });
    }
  }
  
  // Binance price endpoint - REAL DATA
  if (pathname === '/api/binance/price' || pathname === '/api/binance/price/') {
    try {
      // Get ALL current prices from Binance
      const response = await fetch('https://api.binance.com/api/v3/ticker/price');

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const prices = await response.json();

      // Cache for 10 seconds
      res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');

      return res.status(200).json(prices);
    } catch (error) {
      console.error('Error fetching Binance prices:', error);
      return res.status(500).json({
        error: 'Failed to fetch prices',
        details: error.message
      });
    }
  }

  // Crypto icon endpoint - Maps symbols to CoinGecko IDs
  if (pathname === '/api/crypto/icon' || pathname === '/api/crypto/icon/') {
    try {
      const symbol = urlObj.searchParams.get('symbol');

      if (!symbol) {
        return res.status(400).json({ error: 'Symbol parameter required' });
      }

      // Map common crypto symbols to CoinGecko IDs
      const symbolToId = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'BNB': 'binancecoin',
        'SOL': 'solana',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'DOT': 'polkadot',
        'DOGE': 'dogecoin',
        'LTC': 'litecoin',
        'LINK': 'chainlink',
        'XLM': 'stellar',
        'USDT': 'tether',
        'USDC': 'usd-coin',
        'AVAX': 'avalanche-2',
        'MATIC': 'matic-network',
        'TRX': 'tron',
        'UNI': 'uniswap',
        'ATOM': 'cosmos',
        'XMR': 'monero',
        'FTM': 'fantom',
        'AAVE': 'aave',
        'XTZ': 'tezos',
        'ALGO': 'algorand',
        'NEAR': 'near',
        'NEO': 'neo',
        'DASH': 'dash',
        'ZEC': 'zcash',
        'SHIB': 'shiba-inu',
        'APE': 'apecoin',
        'CRO': 'crypto-com-chain',
        'FIL': 'filecoin',
        'HBAR': 'hedera-hashgraph',
        'VET': 'vechain',
        'ICP': 'internet-computer',
        'APT': 'aptos',
        'ARB': 'arbitrum',
        'OP': 'optimism',
        'LDO': 'lido-dao',
        'INJ': 'injective-protocol',
        'MKR': 'maker',
        'GRT': 'the-graph',
        'SAND': 'the-sandbox',
        'MANA': 'decentraland',
        'ETC': 'ethereum-classic',
        'THETA': 'theta-token',
        'RUNE': 'thorchain',
        'PEPE': 'pepe',
        'STX': 'blockstack'
      };

      const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const coinId = symbolToId[cleanSymbol] || cleanSymbol.toLowerCase();

      // Fetch from CoinGecko
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`
      );

      if (!response.ok) {
        return res.status(404).json({ error: 'Icon not found' });
      }

      const data = await response.json();
      const imageUrl = data.image?.small || data.image?.thumb;

      if (!imageUrl) {
        return res.status(404).json({ error: 'No image available' });
      }

      // Cache for 24 hours (icons don't change)
      res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');

      return res.status(200).json({
        symbol: cleanSymbol,
        iconUrl: imageUrl,
        coinId: coinId
      });
    } catch (error) {
      console.error('Error fetching crypto icon:', error);
      return res.status(404).json({
        error: 'Icon not found',
        details: error.message
      });
    }
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
  
  // Cryptocurrency list endpoint - REAL DATA FROM BINANCE
  if (pathname === '/api/cryptocurrencies' || pathname === '/api/cryptocurrencies/' ||
      pathname === '/api/market/cryptocurrencies' || pathname === '/api/market/cryptocurrencies/') {
    try {
      // Get 24hr ticker data for ALL trading pairs
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const allTickers = await response.json();

      // Filter only USDT pairs and enrich with data
      const usdtPairs = allTickers
        .filter(ticker => ticker.symbol.endsWith('USDT'))
        .map(ticker => {
          // Extract base asset (e.g., BTC from BTCUSDT)
          const baseAsset = ticker.symbol.replace('USDT', '');

          return {
            symbol: baseAsset,
            fullSymbol: ticker.symbol,
            name: baseAsset, // We'll add proper names with icons later
            price: parseFloat(ticker.lastPrice).toFixed(8),
            priceChangePercent: parseFloat(ticker.priceChangePercent).toFixed(2),
            change: parseFloat(ticker.priceChangePercent).toFixed(2) + '%',
            volume: parseFloat(ticker.volume).toFixed(2),
            quoteVolume: parseFloat(ticker.quoteVolume).toFixed(2),
            high24h: parseFloat(ticker.highPrice).toFixed(8),
            low24h: parseFloat(ticker.lowPrice).toFixed(8),
            trades: ticker.count
          };
        })
        // Sort by quote volume (USD volume) descending
        .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        // Take top 200 by volume
        .slice(0, 200);

      // Cache for 30 seconds
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

      return res.status(200).json(usdtPairs);
    } catch (error) {
      console.error('Error fetching cryptocurrencies:', error);
      return res.status(500).json({
        error: 'Failed to fetch cryptocurrencies',
        details: error.message
      });
    }
  }
  
  // Trading pairs endpoint - REAL DATA FROM BINANCE
  if (pathname === '/api/trading-pairs' || pathname === '/api/trading-pairs/' ||
      pathname === '/api/market/pairs' || pathname === '/api/market/pairs/') {
    try {
      // Get exchange information from Binance
      const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const exchangeInfo = await response.json();

      // Filter for USDT pairs that are actively trading
      const usdtPairs = exchangeInfo.symbols
        .filter(symbol =>
          symbol.quoteAsset === 'USDT' &&
          symbol.status === 'TRADING' &&
          symbol.isSpotTradingAllowed
        )
        .map(symbol => ({
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
          status: symbol.status,
          baseAssetPrecision: symbol.baseAssetPrecision,
          quoteAssetPrecision: symbol.quoteAssetPrecision,
          orderTypes: symbol.orderTypes,
          icebergAllowed: symbol.icebergAllowed,
          ocoAllowed: symbol.ocoAllowed,
          isSpotTradingAllowed: symbol.isSpotTradingAllowed,
          isMarginTradingAllowed: symbol.isMarginTradingAllowed,
          permissions: symbol.permissions
        }))
        .sort((a, b) => a.symbol.localeCompare(b.symbol));

      // Cache for 60 seconds (exchange info doesn't change frequently)
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

      return res.status(200).json(usdtPairs);
    } catch (error) {
      console.error('Error fetching Binance exchange info:', error);
      return res.status(500).json({
        error: 'Failed to fetch trading pairs',
        details: error.message
      });
    }
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

  // ==================== SIMULATION ROUTES ====================

  // GET /api/simulations - List all simulations for user
  if (pathname === '/api/simulations' && method === 'GET') {
    const firebaseUid = await verifyFirebaseToken(headers.authorization);
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { data: simulations, error } = await supabase
        .from('simulation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform all simulations to camelCase
      const transformedSimulations = (simulations || []).map(transformSimulation);

      return res.status(200).json(transformedSimulations);
    } catch (error) {
      console.error('Error fetching simulations:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /api/simulations/run - Start a new simulation
  if (pathname === '/api/simulations/run' && method === 'POST') {
    const firebaseUid = await verifyFirebaseToken(headers.authorization);
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    try {
      const body = await parseBody(req);
      const { strategyId, name, initialBalance, startDate, endDate } = body;

      if (!strategyId || !name) {
        return res.status(400).json({ message: 'Strategy ID and name are required' });
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Validate strategy exists and belongs to user
      const { data: strategy, error: strategyError } = await supabase
        .from('strategies')
        .select('*')
        .eq('id', strategyId)
        .eq('user_id', user.id)
        .single();

      if (strategyError || !strategy) {
        return res.status(404).json({ message: 'Strategy not found' });
      }

      // Parse dates
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Create simulation session
      const { data: session, error: sessionError } = await supabase
        .from('simulation_sessions')
        .insert({
          user_id: user.id,
          strategy_id: strategy.id,
          name,
          initial_balance: initialBalance || 10000,
          current_balance: initialBalance || 10000,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          status: 'running',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Run simulation in background (don't await)
      const config = {
        user_id: user.id,
        initial_balance: initialBalance || 10000,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      };

      // Execute simulation asynchronously
      runSimulation(session.id, strategy, config, supabase).catch(error => {
        console.error(`[Background] Simulation ${session.id} failed:`, error);
      });

      // Transform snake_case to camelCase for frontend
      const simulationResponse = transformSimulation(session);

      return res.status(200).json({
        message: 'Simulation started successfully. It will run in the background.',
        simulation: simulationResponse,
      });
    } catch (error) {
      console.error('Error starting simulation:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /api/simulations/:id - Get simulation details
  if (pathname.match(/^\/api\/simulations\/\d+$/) && method === 'GET') {
    const firebaseUid = await verifyFirebaseToken(headers.authorization);
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    try {
      const simulationId = parseInt(pathname.split('/').pop());

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { data: simulation, error } = await supabase
        .from('simulation_sessions')
        .select('*')
        .eq('id', simulationId)
        .eq('user_id', user.id)
        .single();

      if (error || !simulation) {
        return res.status(404).json({ message: 'Simulation not found' });
      }

      // Transform to camelCase
      const transformedSimulation = transformSimulation(simulation);

      return res.status(200).json(transformedSimulation);
    } catch (error) {
      console.error('Error fetching simulation:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /api/simulations/:id/trades - Get simulation trades
  if (pathname.match(/^\/api\/simulations\/\d+\/trades$/) && method === 'GET') {
    const firebaseUid = await verifyFirebaseToken(headers.authorization);
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    try {
      const parts = pathname.split('/');
      const simulationId = parseInt(parts[parts.length - 2]);

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { data: simulation, error: simError } = await supabase
        .from('simulation_sessions')
        .select('id')
        .eq('id', simulationId)
        .eq('user_id', user.id)
        .single();

      if (simError || !simulation) {
        return res.status(404).json({ message: 'Simulation not found' });
      }

      const { data: trades, error } = await supabase
        .from('simulation_trades')
        .select('*')
        .eq('simulation_id', simulationId)
        .order('executed_at', { ascending: true });

      if (error) throw error;

      // Transform to camelCase
      const transformedTrades = (trades || []).map(transformTrade);

      return res.status(200).json(transformedTrades);
    } catch (error) {
      console.error('Error fetching simulation trades:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /api/simulations/:id/balance-history - Get balance history
  if (pathname.match(/^\/api\/simulations\/\d+\/balance-history$/) && method === 'GET') {
    const firebaseUid = await verifyFirebaseToken(headers.authorization);
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    try {
      const parts = pathname.split('/');
      const simulationId = parseInt(parts[parts.length - 2]);

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { data: simulation, error: simError } = await supabase
        .from('simulation_sessions')
        .select('id')
        .eq('id', simulationId)
        .eq('user_id', user.id)
        .single();

      if (simError || !simulation) {
        return res.status(404).json({ message: 'Simulation not found' });
      }

      const { data: history, error } = await supabase
        .from('simulation_balance_history')
        .select('*')
        .eq('simulation_id', simulationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Transform to camelCase
      const transformedHistory = (history || []).map(transformBalanceHistory);

      return res.status(200).json(transformedHistory);
    } catch (error) {
      console.error('Error fetching balance history:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE /api/simulations/:id - Delete simulation
  if (pathname.match(/^\/api\/simulations\/\d+$/) && method === 'DELETE') {
    const firebaseUid = await verifyFirebaseToken(headers.authorization);
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Not authenticated. Use Firebase JWT token.' });
    }

    try {
      const simulationId = parseInt(pathname.split('/').pop());

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { data: simulation, error: simError } = await supabase
        .from('simulation_sessions')
        .select('id')
        .eq('id', simulationId)
        .eq('user_id', user.id)
        .single();

      if (simError || !simulation) {
        return res.status(404).json({ message: 'Simulation not found' });
      }

      const { error } = await supabase
        .from('simulation_sessions')
        .delete()
        .eq('id', simulationId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting simulation:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Default 404 for unknown API routes
  return res.status(404).json({
    error: 'API route not found',
    path: pathname,
    fullUrl: url
  });
}