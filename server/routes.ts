import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { getBinanceService, commonSymbols, strategyTypes, timeframes } from "./binance";
import { sendTradeExecutionEmail, sendDailyReportEmail, sendPriceAlertEmail } from "./email";
import { insertStrategySchema, insertApiKeySchema, insertNotificationSettingsSchema } from "@shared/schema";

// Authentication middleware
const authenticate = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API Keys routes
  app.get("/api/api-keys", authenticate, async (req, res) => {
    try {
      const apiKeys = await storage.getApiKeys(req.user.id);
      // Hide secret keys in response
      const secureKeys = apiKeys.map(key => ({
        ...key,
        secretKey: "••••••••••••••••"
      }));
      res.json(secureKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  app.post("/api/api-keys", authenticate, async (req, res) => {
    try {
      const apiKeyData = insertApiKeySchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const apiKey = await storage.createApiKey(apiKeyData);
      // Hide secret key in response
      const secureKey = {
        ...apiKey,
        secretKey: "••••••••••••••••"
      };
      res.status(201).json(secureKey);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Failed to create API key" });
    }
  });

  app.patch("/api/api-keys/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const apiKey = await storage.getApiKey(id);
      
      if (!apiKey) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      if (apiKey.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to API key" });
      }
      
      const isActive = req.body.isActive;
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean value" });
      }
      
      const updatedApiKey = await storage.updateApiKey(id, isActive);
      
      // Hide secret key in response
      const secureKey = {
        ...updatedApiKey,
        secretKey: "••••••••••••••••"
      };
      
      res.json(secureKey);
    } catch (error) {
      console.error("Error updating API key:", error);
      res.status(500).json({ message: "Failed to update API key" });
    }
  });

  app.delete("/api/api-keys/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const apiKey = await storage.getApiKey(id);
      
      if (!apiKey) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      if (apiKey.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to API key" });
      }
      
      await storage.deleteApiKey(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: "Failed to delete API key" });
    }
  });

  // Strategy routes
  app.get("/api/strategies", authenticate, async (req, res) => {
    try {
      const strategies = await storage.getStrategies(req.user.id);
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ message: "Failed to fetch strategies" });
    }
  });

  app.get("/api/strategies/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to strategy" });
      }
      
      res.json(strategy);
    } catch (error) {
      console.error("Error fetching strategy:", error);
      res.status(500).json({ message: "Failed to fetch strategy" });
    }
  });

  app.post("/api/strategies", authenticate, async (req, res) => {
    try {
      const strategyData = insertStrategySchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const strategy = await storage.createStrategy(strategyData);
      res.status(201).json(strategy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating strategy:", error);
      res.status(500).json({ message: "Failed to create strategy" });
    }
  });

  app.patch("/api/strategies/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to strategy" });
      }
      
      // Only allow updating specific fields
      const allowedUpdates = ["name", "type", "pair", "timeframe", "parameters", "isActive"];
      const updates: Record<string, any> = {};
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      const updatedStrategy = await storage.updateStrategy(id, updates);
      res.json(updatedStrategy);
    } catch (error) {
      console.error("Error updating strategy:", error);
      res.status(500).json({ message: "Failed to update strategy" });
    }
  });

  app.delete("/api/strategies/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to strategy" });
      }
      
      await storage.deleteStrategy(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ message: "Failed to delete strategy" });
    }
  });

  // Execute a specific strategy
  app.post("/api/strategies/:id/execute", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to strategy" });
      }
      
      if (!strategy.isActive) {
        return res.status(400).json({ message: "Cannot execute a paused strategy" });
      }
      
      // Get user's Binance service
      const binanceService = await getBinanceService(req.user.id);
      
      if (!binanceService) {
        return res.status(400).json({ message: "No active Binance API key found" });
      }
      
      // Execute the strategy
      const result = await binanceService.executeStrategy(strategy);
      res.json(result);
    } catch (error) {
      console.error("Error executing strategy:", error);
      res.status(500).json({ message: "Failed to execute strategy" });
    }
  });

  // Trade history routes
  app.get("/api/trade-history", authenticate, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const trades = await storage.getTradeHistory(req.user.id, limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trade history:", error);
      res.status(500).json({ message: "Failed to fetch trade history" });
    }
  });

  app.get("/api/trade-history/strategy/:id", authenticate, async (req, res) => {
    try {
      const strategyId = parseInt(req.params.id);
      const strategy = await storage.getStrategy(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to strategy" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const trades = await storage.getTradeHistoryByStrategy(strategyId, limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching strategy trade history:", error);
      res.status(500).json({ message: "Failed to fetch strategy trade history" });
    }
  });

  // Notification settings routes
  app.get("/api/notification-settings", authenticate, async (req, res) => {
    try {
      let settings = await storage.getNotificationSettings(req.user.id);
      
      if (!settings) {
        // Create default settings if none exist
        settings = await storage.createNotificationSettings({
          userId: req.user.id,
          tradeExecution: true,
          dailyReports: true,
          priceAlerts: false,
          systemNotifications: true
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.patch("/api/notification-settings", authenticate, async (req, res) => {
    try {
      const updateSchema = insertNotificationSettingsSchema.partial().pick({
        tradeExecution: true,
        dailyReports: true,
        priceAlerts: true,
        systemNotifications: true
      });
      
      const updates = updateSchema.parse(req.body);
      
      let settings = await storage.getNotificationSettings(req.user.id);
      
      if (!settings) {
        // Create default settings if none exist
        settings = await storage.createNotificationSettings({
          userId: req.user.id,
          ...updates,
          // Set defaults for any missing fields
          tradeExecution: updates.tradeExecution ?? true,
          dailyReports: updates.dailyReports ?? true,
          priceAlerts: updates.priceAlerts ?? false,
          systemNotifications: updates.systemNotifications ?? true
        });
      } else {
        // Update existing settings
        settings = await storage.updateNotificationSettings(req.user.id, updates) as any;
      }
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Market data routes
  app.get("/api/market/symbols", authenticate, async (req, res) => {
    try {
      res.json(commonSymbols);
    } catch (error) {
      console.error("Error fetching symbols:", error);
      res.status(500).json({ message: "Failed to fetch symbols" });
    }
  });

  app.get("/api/market/prices", authenticate, async (req, res) => {
    try {
      const binanceService = await getBinanceService(req.user.id);
      
      if (!binanceService) {
        return res.status(400).json({ message: "No active Binance API key found" });
      }
      
      const symbols = req.query.symbols 
        ? (req.query.symbols as string).split(",") 
        : commonSymbols.map(s => s.symbol);
      
      const prices = await binanceService.getPrices(symbols);
      res.json(prices);
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ message: "Failed to fetch prices" });
    }
  });

  app.get("/api/market/klines", authenticate, async (req, res) => {
    try {
      const symbol = req.query.symbol as string;
      const interval = req.query.interval as string || "1h";
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      if (!symbol) {
        return res.status(400).json({ message: "Symbol is required" });
      }
      
      const binanceService = await getBinanceService(req.user.id);
      
      if (!binanceService) {
        return res.status(400).json({ message: "No active Binance API key found" });
      }
      
      const klines = await binanceService.getKlines(symbol, interval, limit);
      res.json(klines);
    } catch (error) {
      console.error("Error fetching klines:", error);
      res.status(500).json({ message: "Failed to fetch klines" });
    }
  });

  // Strategy metadata routes
  app.get("/api/strategy-types", authenticate, async (req, res) => {
    try {
      res.json(strategyTypes);
    } catch (error) {
      console.error("Error fetching strategy types:", error);
      res.status(500).json({ message: "Failed to fetch strategy types" });
    }
  });

  app.get("/api/timeframes", authenticate, async (req, res) => {
    try {
      res.json(timeframes);
    } catch (error) {
      console.error("Error fetching timeframes:", error);
      res.status(500).json({ message: "Failed to fetch timeframes" });
    }
  });

  // Email test route
  app.post("/api/test-email", authenticate, async (req, res) => {
    try {
      const { type } = req.body;
      
      if (!req.user.email) {
        return res.status(400).json({ message: "User email not found" });
      }
      
      let success = false;
      
      switch (type) {
        case "trade":
          success = await sendTradeExecutionEmail(
            req.user.email,
            "BTC/USDT",
            "buy",
            "38567.43",
            "0.01",
            "+2.34"
          );
          break;
        case "report":
          success = await sendDailyReportEmail(
            req.user.email,
            [
              {
                name: "Moving Average Crossover",
                pair: "BTC/USDT",
                dailyPL: "+2.45",
                weeklyPL: "+8.12",
                trades: 28
              },
              {
                name: "RSI Divergence",
                pair: "ETH/USDT",
                dailyPL: "-0.85",
                weeklyPL: "-1.23",
                trades: 14
              }
            ]
          );
          break;
        case "alert":
          success = await sendPriceAlertEmail(
            req.user.email,
            "BTC/USDT",
            "38567.43",
            "above",
            "38000.00"
          );
          break;
        default:
          return res.status(400).json({ message: "Invalid email type" });
      }
      
      if (success) {
        res.json({ message: "Test email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
