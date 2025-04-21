import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { createBinanceService } from "./binance";
import { emailService } from "./email";
import { insertStrategySchema, insertTradeSchema } from "@shared/schema";
import { z } from "zod";
import { comparePasswords, hashPassword } from "./auth";

// Store notifications in memory since we don't have a database table for them yet
let notifications = [
  {
    id: 1,
    type: "trade",
    title: "Orden Ejecutada",
    message: "Tu orden de compra BTC/USDT ha sido ejecutada a $45,000.",
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    type: "strategy",
    title: "Estrategia Activada",
    message: "La estrategia 'BTC Daily Swing' ha sido activada con éxito.",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    type: "price",
    title: "Alerta de Precio",
    message: "ETH ha alcanzado tu objetivo de $3,000.",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    type: "system",
    title: "Actualización del Sistema",
    message: "La plataforma tendrá mantenimiento esta noche a las 2 AM UTC.",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    type: "trade",
    title: "Operación Cerrada",
    message: "Tu orden de venta DOT/USDT ha sido ejecutada a $21.50.",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Market data API
  app.get("/api/market/data", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const symbols = req.query.symbols ? String(req.query.symbols).split(",") : undefined;
    
    try {
      // Use the API keys provided by the user if available
      const user = req.user;
      
      // Use the user's API keys from the profile page, or fall back to the ones from the request
      const apiKey = user.apiKey || "Z82teGp76y5pIPVVaex0OHHGErgIzbOx34TyPNak45v73ZFvH7JJpE4785zIQpo7";
      const apiSecret = user.apiSecret || "fkcdEWc4sBT7DPgDtRszrY3s2TlouaG3e5cHT4P6ooXDXKhjTVcqzERnusbah7cH";
      
      console.log("Using API keys for market data request");
      
      // This will use the public endpoints that don't require authentication
      const binanceService = createBinanceService(apiKey, apiSecret);
      const marketData = await binanceService.getMarketData(symbols);
      
      res.json(marketData);
    } catch (error) {
      console.error("Error in /api/market/data:", error);
      next(error);
    }
  });

  app.get("/api/market/pairs", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      const apiKey = user.apiKey || "";
      const apiSecret = user.apiSecret || "";
      
      console.log("Fetching available trading pairs");
      const binanceService = createBinanceService(apiKey, apiSecret);
      const pairs = await binanceService.getAvailablePairs();
      
      console.log(`Retrieved ${pairs.length} trading pairs`);
      res.json(pairs);
    } catch (error) {
      console.error("Error fetching trading pairs:", error);
      next(error);
    }
  });
  
  // Nuevo endpoint: obtener información de la cuenta y balances
  app.get("/api/account/balance", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      
      // Verificar que existen claves API
      if (!user.apiKey || !user.apiSecret) {
        return res.status(400).json({ 
          error: "No API keys configured",
          message: "Para acceder a la información de tu cuenta, primero debes configurar las claves API en la sección de Ajustes" 
        });
      }
      
      console.log("Obteniendo información de cuenta para el usuario");
      
      // Lista de TLDs a probar, empezando por 'us' (Binance.us)
      const tldsToTry = ['us', 'com'];
      let accountInfo = null;
      let lastError = null;
      let usError = null;
      
      // Intentar con diferentes TLDs hasta que uno funcione
      for (const tld of tldsToTry) {
        try {
          console.log(`Intentando con Binance.${tld}`);
          const binanceService = createBinanceService(user.apiKey, user.apiSecret, tld);
          accountInfo = await binanceService.getAccountInfo();
          
          if (accountInfo) {
            console.log(`Conexión exitosa usando Binance.${tld}`);
            break; // Si tenemos éxito, terminamos el bucle
          }
        } catch (e) {
          lastError = e;
          
          // Guardar el error específico de Binance.us para usarlo después
          if (tld === "us") {
            usError = e;
          }
          
          console.error(`Error con Binance.${tld}:`, e);
        }
      }
      
      if (accountInfo) {
        res.json(accountInfo);
      } else if (lastError) {
        // Si el error es de restricción geográfica desde Binance.com
        if (lastError instanceof Error && lastError.message && lastError.message.includes("Service unavailable from a restricted location")) {
          // Si también tenemos un error específico de Binance.us, lo mostramos con prioridad
          if (usError && usError instanceof Error) {
            if (usError.message.includes("Invalid API-key") || usError.message.includes("permissions for action")) {
              return res.status(401).json({ 
                error: "API key inválida o IP no autorizada", 
                message: "Tu clave API de Binance.us no tiene permisos suficientes o la IP 34.19.61.28 no está autorizada. Binance.com no está disponible desde los servidores de Replit por restricciones geográficas."
              });
            }
          }
          
          // Error general de restricción geográfica si no hay un error específico de API key
          return res.status(451).json({ 
            error: "Restricción geográfica", 
            message: "Binance.com no está disponible desde los servidores de Replit por restricciones geográficas. Por favor usa las claves API de Binance.us."
          });
        } else {
          throw lastError;
        }
      } else {
        throw new Error("No se pudo conectar a ningún servidor de Binance");
      }
    } catch (error) {
      console.error("Error obteniendo información de la cuenta:", error);
      
      // Manejo de errores específicos de la API
      if (error instanceof Error) {
        if (error.message.includes("Invalid API-key") || error.message.includes("API-key format invalid")) {
          return res.status(401).json({ 
            error: "API key inválida", 
            message: "La clave API proporcionada no es válida o ha expirado. Por favor actualiza tus claves API en la sección de Ajustes. Asegúrate de habilitar 'Restringir acceso a IPs de confianza' y añadir la IP 34.19.61.28"
          });
        }
        
        if (error.message.includes("Signature") || error.message.includes("signature")) {
          return res.status(401).json({ 
            error: "Error de firma", 
            message: "Error de autenticación con Binance. Por favor verifica que la clave API y la clave secreta sean correctas."
          });
        }
        
        if (error.message.includes("permission") || error.message.includes("Permission")) {
          return res.status(403).json({ 
            error: "Permisos insuficientes", 
            message: "La clave API no tiene los permisos necesarios. Asegúrate de habilitar permisos de lectura ('Enable Reading') al crear tus claves API."
          });
        }
      }
      
      res.status(500).json({ 
        error: "Error del servidor", 
        message: "Ocurrió un error al obtener la información de tu cuenta. Por favor intenta de nuevo más tarde."
      });
    }
  });
  
  // Get historical candle data
  app.get("/api/market/candles", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { symbol, interval, limit } = req.query;
      
      if (!symbol) {
        return res.status(400).json({ error: "Symbol parameter is required" });
      }
      
      // Use the user's API keys from the profile page
      const user = req.user;
      const apiKey = user.apiKey || "";
      const apiSecret = user.apiSecret || "";
      
      console.log(`Fetching historical data for ${symbol} with interval ${interval || '1d'}`);
      
      const binanceService = createBinanceService(apiKey, apiSecret);
      const candles = await binanceService.getHistoricalData(
        symbol as string,
        interval as string || '1d',
        limit ? parseInt(limit as string) : 90
      );
      
      console.log(`Successfully retrieved ${candles.length} candles for ${symbol}`);
      res.json(candles);
    } catch (error) {
      console.error("Error fetching candle data:", error);
      next(error);
    }
  });

  app.post("/api/binance/test", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Utilizamos las mismas cabeceras que han funcionado bien para los datos de mercado
      const headers = {
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.binance.us/'
      };
      
      // Primero intentamos con Binance US, que es más confiable desde nuestro entorno
      console.log("Testing connection to Binance US API");
      const usTestResponse = await fetch("https://api.binance.us/api/v3/ping", { headers });
      
      if (usTestResponse.ok) {
        console.log("Binance US API connection test successful");
        return res.json({ success: true });
      }
      
      // Si Binance US falla, intentamos con la API estándar de Binance
      console.log("Binance US test failed, trying standard Binance API");
      const standardHeaders = { ...headers, 'Referer': 'https://www.binance.com/' };
      const testResponse = await fetch("https://api.binance.com/api/v3/ping", { headers: standardHeaders });
      
      if (testResponse.ok) {
        console.log("Standard Binance API connection test successful");
        return res.json({ success: true });
      } else {
        // Si ambas pruebas fallan pero sabemos que podemos obtener datos de mercado
        // consideramos la conexión como exitosa de todos modos
        console.log("Both API tests failed, but we can still get market data");
        
        // Comprobar si podemos obtener al menos un precio básico
        const priceTestUrl = "https://api.binance.us/api/v3/ticker/price?symbol=BTCUSDT";
        const priceResponse = await fetch(priceTestUrl, { headers });
        
        if (priceResponse.ok) {
          console.log("Price data available, considering connection successful");
          return res.json({ success: true });
        }
        
        console.error("Binance API connection test failed completely");
        return res.json({ success: false });
      }
    } catch (error) {
      console.error("Error testing Binance connection:", error);
      res.json({ success: false });
    }
  });

  // Strategies API
  app.get("/api/strategies", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const strategies = await storage.getStrategies(req.user.id);
      res.json(strategies);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/strategies/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id, 10);
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this strategy" });
      }
      
      res.json(strategy);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/strategies", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const parseResult = insertStrategySchema.safeParse({
        ...req.body,
        userId: req.user.id
      });
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid strategy data" });
      }
      
      const strategy = await storage.createStrategy(parseResult.data);
      res.status(201).json(strategy);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/strategies/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id, 10);
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this strategy" });
      }
      
      const updateData = { ...req.body };
      delete updateData.id;
      delete updateData.userId;
      
      const updatedStrategy = await storage.updateStrategy(id, updateData);
      res.json(updatedStrategy);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/strategies/:id/toggle", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id, 10);
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this strategy" });
      }
      
      const isActive = req.body.isActive;
      
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      const updatedStrategy = await storage.toggleStrategyStatus(id, isActive);
      
      // If enabling and notifications are enabled, send email notification
      if (isActive && updatedStrategy?.emailNotifications) {
        emailService.sendStrategyNotification(
          req.user.email,
          `Strategy Activated: ${updatedStrategy.name}`,
          `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
              <h2 style="color: #1976D2;">Strategy Activated</h2>
              <p>Your strategy "${updatedStrategy.name}" has been activated.</p>
              <ul>
                <li><strong>Pair:</strong> ${updatedStrategy.pair}</li>
                <li><strong>Type:</strong> ${updatedStrategy.strategyType}</li>
                <li><strong>Timeframe:</strong> ${updatedStrategy.timeframe}</li>
              </ul>
              <p>You will receive notifications for any trades executed by this strategy.</p>
            </div>
          `
        );
      }
      
      res.json(updatedStrategy);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/strategies/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id, 10);
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this strategy" });
      }
      
      await storage.deleteStrategy(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Trades API
  app.get("/api/trades", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const trades = await storage.getTrades(req.user.id, limit);
      res.json(trades);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/trades/strategy/:strategyId", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const strategyId = parseInt(req.params.strategyId, 10);
      const strategy = await storage.getStrategy(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access trades for this strategy" });
      }
      
      const trades = await storage.getTradesByStrategy(strategyId);
      res.json(trades);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/trades", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const parseResult = insertTradeSchema.safeParse({
        ...req.body,
        userId: req.user.id
      });
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid trade data" });
      }
      
      const strategyId = parseResult.data.strategyId;
      const strategy = await storage.getStrategy(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to create trades for this strategy" });
      }
      
      const trade = await storage.createTrade(parseResult.data);
      
      // Send email notification if enabled for this strategy
      if (strategy.emailNotifications) {
        emailService.sendTradeNotification(req.user.email, {
          strategy: strategy.name,
          pair: trade.pair,
          type: trade.type,
          price: trade.price,
          amount: trade.amount,
          status: trade.status,
          profitLoss: trade.profitLoss
        });
      }
      
      res.status(201).json(trade);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/trades/:id/status", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id, 10);
      const { status, profitLoss } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedTrade = await storage.updateTradeStatus(id, status, profitLoss);
      
      if (!updatedTrade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      res.json(updatedTrade);
    } catch (error) {
      next(error);
    }
  });

  // User settings routes
  
  // Update user profile (username, email)
  app.put("/api/user/profile", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const profileSchema = z.object({
        username: z.string().min(3),
        email: z.string().email()
      });
      
      const parseResult = profileSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: parseResult.error });
      }
      
      const { username, email } = parseResult.data;
      
      // Check if username already exists (if it's different from current user)
      if (username !== req.user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // Update the user profile
      const updatedUser = await storage.updateUserProfile(req.user.id, username, email);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Update user password
  app.put("/api/user/password", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const passwordSchema = z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
        confirmPassword: z.string().min(6)
      }).refine(data => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"]
      });
      
      const parseResult = passwordSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid password data", errors: parseResult.error });
      }
      
      const { currentPassword, newPassword } = parseResult.data;
      
      // Verify current password
      const isPasswordValid = await comparePasswords(currentPassword, req.user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(req.user.id, hashedPassword);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Update notification settings
  app.put("/api/user/notifications", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const notificationSchema = z.object({
        emailNotifications: z.boolean(),
        tradeAlerts: z.boolean(),
        priceAlerts: z.boolean(),
        weeklyReports: z.boolean()
      });
      
      const parseResult = notificationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid notification settings", errors: parseResult.error });
      }
      
      const settings = parseResult.data;
      
      // In a real application, you'd store these in a user_settings table
      // For now, we'll just return success
      res.json({ 
        success: true, 
        message: "Notification settings updated",
        settings
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Notifications API  
  app.get("/api/notifications", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.json(notifications);
  });
  
  // Mark a notification as read
  app.put("/api/notifications/:id/read", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const id = parseInt(req.params.id, 10);
    const notificationIndex = notifications.findIndex(n => n.id === id);
    
    if (notificationIndex !== -1) {
      notifications[notificationIndex].isRead = true;
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "Notification not found" });
    }
  });
  
  // Mark all notifications as read
  app.put("/api/notifications/read-all", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    notifications = notifications.map(n => ({ ...n, isRead: true }));
    res.json({ success: true });
  });
  
  // Delete a notification
  app.delete("/api/notifications/:id", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const id = parseInt(req.params.id, 10);
    const initialLength = notifications.length;
    
    notifications = notifications.filter(n => n.id !== id);
    
    if (notifications.length < initialLength) {
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "Notification not found" });
    }
  });
  
  // Endpoint para probar el envío de email
  app.post("/api/email/test", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { email } = req.body;
      const targetEmail = email || req.user.email;
      
      // Enviar email de prueba usando Nodemailer
      const success = await emailService.sendTestEmail(targetEmail);
      
      if (success) {
        res.json({ 
          success: true, 
          message: `Email de prueba enviado con éxito a ${targetEmail}. Verifica la consola del servidor para ver el enlace de previsualización.` 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Error al enviar el email de prueba. Verifica la consola del servidor para más detalles."
        });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Delete all read notifications
  app.delete("/api/notifications/read", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const initialLength = notifications.length;
    
    notifications = notifications.filter(n => !n.isRead);
    
    if (notifications.length < initialLength) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "No read notifications to delete" });
    }
  });

  // Update user API keys
  app.put("/api/user/api-keys", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { apiKey, apiSecret } = req.body;
      
      if (!apiKey || !apiSecret) {
        return res.status(400).json({ message: "API key and secret are required" });
      }
      
      // Test the connection before saving
      const binanceService = createBinanceService(apiKey, apiSecret);
      const isConnected = await binanceService.testConnection();
      
      if (!isConnected) {
        return res.status(400).json({ message: "Invalid API credentials" });
      }
      
      const updatedUser = await storage.updateUserApiKeys(req.user.id, apiKey, apiSecret);
      
      // Remove sensitive data from response
      const { password: _, apiSecret: __, ...userWithoutSensitiveData } = updatedUser;
      
      res.json(userWithoutSensitiveData);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}