const express = require('express');
const { Pool } = require('@neondatabase/serverless');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const session = require('express-session');
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

const app = express();

// Database setup using Supabase connection string
let databaseUrl;
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // Construct database URL from Supabase project URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  databaseUrl = `postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`;
} else {
  databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
}

if (!databaseUrl) {
  console.error('No database URL configured');
}

let pool;
try {
  pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
} catch (error) {
  console.error('Pool creation error:', error);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
const sessionSecret = process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET || 'default-secret';
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Password utilities
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Database functions
async function getUserByUsername(username) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

async function getUserById(id) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user by id:', error);
    throw error;
  }
}

async function createUser(userData) {
  try {
    const { username, email, password } = userData;
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
      [username, email, password]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Passport configuration
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await getUserByUsername(username);
    if (!user || !(await comparePasswords(password, user.password))) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Routes
app.post('/api/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser({
      username,
      email,
      password: hashedPassword
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.status(200).json(req.user);
});

app.post('/api/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get('/api/user', (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json(req.user);
  } catch (error) {
    console.error('Error in /api/user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database test
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', ['public']);
    res.json({
      success: true,
      tables: result.rows.map(row => row.table_name),
      timestamp: new Date().toISOString(),
      databaseConnected: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      databaseConnected: false
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;