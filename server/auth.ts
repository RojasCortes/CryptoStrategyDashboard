import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, loginUserSchema } from "@shared/schema";
import { verifyIdToken, initializeFirebaseAdmin, isFirebaseEnabled } from "./firebase-admin";
import { decrypt } from "./encryption";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || "binance-dashboard-secret-key";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Importar el schema correcto desde shared/schema
      const { serverRegisterSchema } = await import("@shared/schema");
      
      // Validar los datos de entrada
      const parseResult = serverRegisterSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({ 
          message: "Datos de registro inválidos", 
          errors: errors
        });
      }

      const { username, password, email } = parseResult.data;

      // Verificar si el usuario ya existe por username
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ 
          message: "El nombre de usuario ya está en uso",
          errors: [{ field: 'username', message: 'Este nombre de usuario ya está registrado' }]
        });
      }

      // Verificar si el email ya existe
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ 
          message: "El email ya está en uso",
          errors: [{ field: 'email', message: 'Este email ya está registrado' }]
        });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        apiKey: "",
        apiSecret: ""
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      // Use promise-based login for better Vercel compatibility
      await new Promise<void>((resolve, reject) => {
        req.login(user, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error en registro:", error);
      
      // Manejo específico de errores de base de datos
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        
        if (errorMessage.includes('duplicate key value violates unique constraint "users_username_unique"')) {
          return res.status(400).json({ 
            message: "El nombre de usuario ya está en uso",
            errors: [{ field: 'username', message: 'Este nombre de usuario ya está registrado' }]
          });
        }
        
        if (errorMessage.includes('duplicate key value violates unique constraint "users_email_unique"')) {
          return res.status(400).json({ 
            message: "El email ya está en uso",
            errors: [{ field: 'email', message: 'Este email ya está registrado' }]
          });
        }
      }
      
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Importar y validar los datos de entrada
    import("@shared/schema").then(({ loginUserSchema }) => {
      const parseResult = loginUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Datos de login inválidos",
          errors: parseResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      passport.authenticate("local", (err: Error, user: Express.User) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: "Nombre de usuario o contraseña incorrectos" });
        }
        
        req.login(user, (err) => {
          if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ message: "Error interno del servidor" });
          }
          
          // Remove password from response
          const { password: _, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    }).catch(next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    const safeUser = await getSafeUserData(req.user);
    res.json(safeUser);
  });

  // Update user API keys
  app.post("/api/user/apikeys", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { apiKey, apiSecret } = req.body;
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ message: "API key and secret are required" });
    }

    try {
      const user = await storage.updateUserApiKeys(req.user.id, apiKey, apiSecret);
      const safeUser = await getSafeUserData(user);
      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  });

  // Initialize Firebase Admin
  initializeFirebaseAdmin();

  // Firebase Authentication Session Endpoint
  app.post("/api/auth/session", async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const idToken = authHeader.substring(7);
      
      // Verify Firebase token
      const decodedToken = await verifyIdToken(idToken);
      if (!decodedToken) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const { uid, email, name } = decodedToken;
      const { username, displayName, photoURL } = req.body;

      // Try to find existing user by Firebase UID
      let user = await storage.getUserByFirebaseUid(uid);
      
      if (!user && email) {
        // Try to find by email (for migration from old accounts)
        user = await storage.getUserByEmail(email);
        
        if (user && !user.firebaseUid) {
          // Link existing account to Firebase
          // This requires adding a method to update firebaseUid - for now we'll create new
        }
      }

      if (!user) {
        // Create new user with Firebase UID
        const newUsername = username || email?.split("@")[0] || `user_${uid.substring(0, 8)}`;
        
        // Ensure username is unique
        let finalUsername = newUsername;
        let counter = 1;
        while (await storage.getUserByUsername(finalUsername)) {
          finalUsername = `${newUsername}_${counter}`;
          counter++;
        }

        user = await storage.createUser({
          username: finalUsername,
          email: email || `${uid}@firebase.local`,
          password: "",
          firebaseUid: uid,
          displayName: displayName || name || null,
          photoURL: photoURL || null,
          apiKey: "",
          apiSecret: ""
        });
      } else if (displayName || photoURL) {
        // Update display info if provided
        user = await storage.updateUserFirebaseInfo(user.id, displayName, photoURL);
      }

      // Create session
      await new Promise<void>((resolve, reject) => {
        req.login(user!, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const safeUser = await getSafeUserData(user);
      res.json(safeUser);
    } catch (error) {
      console.error("Firebase session error:", error);
      next(error);
    }
  });

  // Firebase Logout Endpoint
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie("connect.sid");
        res.sendStatus(200);
      });
    });
  });

  // Check if Firebase is enabled
  app.get("/api/auth/firebase-status", (req, res) => {
    res.json({ 
      enabled: isFirebaseEnabled(),
      projectId: process.env.FIREBASE_PROJECT_ID ? true : false
    });
  });
}

// Helper function to return user data with decrypted API keys (masked)
async function getSafeUserData(user: SelectUser) {
  const { password: _, apiKey, apiSecret, ...userData } = user;
  
  // For security, we don't return the actual API keys
  // Instead, we indicate if they are configured
  return {
    ...userData,
    hasApiKeys: !!(apiKey && apiSecret && apiKey.length > 0 && apiSecret.length > 0),
    apiKeyConfigured: apiKey ? true : false,
    apiSecretConfigured: apiSecret ? true : false
  };
}
