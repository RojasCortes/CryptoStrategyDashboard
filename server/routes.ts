import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { createBinanceService } from "./binance";
import { emailService } from "./email";
import { insertStrategySchema, insertTradeSchema } from "@shared/schema";
import { z } from "zod";
import { comparePasswords, hashPassword } from "./auth";

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
      const user = req.user;
      const apiKey = user.apiKey || process.env.BINANCE_API_KEY || "";
      const apiSecret = user.apiSecret || process.env.BINANCE_API_SECRET || "";
      
      const binanceService = createBinanceService(apiKey, apiSecret);
      const marketData = await binanceService.getMarketData(symbols);
      
      res.json(marketData);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/market/pairs", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      const apiKey = user.apiKey || process.env.BINANCE_API_KEY || "";
      const apiSecret = user.apiSecret || process.env.BINANCE_API_SECRET || "";
      
      const binanceService = createBinanceService(apiKey, apiSecret);
      const pairs = await binanceService.getAvailablePairs();
      
      res.json(pairs);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/binance/test", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { apiKey, apiSecret } = req.body;
      if (!apiKey || !apiSecret) {
        return res.status(400).json({ message: "API key and secret are required" });
      }
      
      const binanceService = createBinanceService(apiKey, apiSecret);
      const isConnected = await binanceService.testConnection();
      
      res.json({ success: isConnected });
    } catch (error) {
      next(error);
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

  const httpServer = createServer(app);
  return httpServer;
}
