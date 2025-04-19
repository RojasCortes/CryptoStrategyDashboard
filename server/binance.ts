import { storage } from "./storage";
import { ApiKey, Strategy, InsertTradeHistory } from "@shared/schema";
import { sendTradeExecutionEmail } from "./email";

// Mock Binance API Types
interface BinanceCandle {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  trades: number;
  takerBaseAssetVolume: string;
  takerQuoteAssetVolume: string;
}

interface BinancePrice {
  symbol: string;
  price: string;
}

// Trading strategies
const strategies = {
  // Moving Average Crossover Strategy
  movingAverage: async (userId: number, strategyId: number, pair: string, params: any) => {
    try {
      // Mock implementation of moving average strategy
      // In production, this would use actual Binance API data and calculations
      const decision = Math.random() > 0.5 ? "buy" : "sell";
      const price = (Math.random() * 1000).toFixed(2);
      const amount = (Math.random() * 0.1).toFixed(6);
      const profit = ((Math.random() * 5) - 2.5).toFixed(2);
      
      // Create trade record
      const trade: InsertTradeHistory = {
        userId,
        strategyId,
        pair,
        type: decision,
        price,
        amount,
        profit
      };
      
      const createdTrade = await storage.createTradeHistory(trade);
      
      // Get user and notification settings
      const user = await storage.getUser(userId);
      const settings = await storage.getNotificationSettings(userId);
      
      // Send email notification if enabled
      if (user && settings?.tradeExecution) {
        await sendTradeExecutionEmail(
          user.email,
          pair,
          decision,
          price,
          amount,
          profit
        );
      }
      
      return createdTrade;
    } catch (error) {
      console.error("Error executing moving average strategy:", error);
      throw new Error("Failed to execute trading strategy");
    }
  },
  
  // RSI Strategy
  rsi: async (userId: number, strategyId: number, pair: string, params: any) => {
    try {
      // Mock implementation of RSI strategy
      const decision = Math.random() > 0.5 ? "buy" : "sell";
      const price = (Math.random() * 1000).toFixed(2);
      const amount = (Math.random() * 0.1).toFixed(6);
      const profit = ((Math.random() * 5) - 2.5).toFixed(2);
      
      // Create trade record
      const trade: InsertTradeHistory = {
        userId,
        strategyId,
        pair,
        type: decision,
        price,
        amount,
        profit
      };
      
      const createdTrade = await storage.createTradeHistory(trade);
      
      // Get user and notification settings
      const user = await storage.getUser(userId);
      const settings = await storage.getNotificationSettings(userId);
      
      // Send email notification if enabled
      if (user && settings?.tradeExecution) {
        await sendTradeExecutionEmail(
          user.email,
          pair,
          decision,
          price,
          amount,
          profit
        );
      }
      
      return createdTrade;
    } catch (error) {
      console.error("Error executing RSI strategy:", error);
      throw new Error("Failed to execute trading strategy");
    }
  },
  
  // MACD Strategy
  macd: async (userId: number, strategyId: number, pair: string, params: any) => {
    try {
      // Mock implementation of MACD strategy
      const decision = Math.random() > 0.5 ? "buy" : "sell";
      const price = (Math.random() * 1000).toFixed(2);
      const amount = (Math.random() * 0.1).toFixed(6);
      const profit = ((Math.random() * 5) - 2.5).toFixed(2);
      
      // Create trade record
      const trade: InsertTradeHistory = {
        userId,
        strategyId,
        pair,
        type: decision,
        price,
        amount,
        profit
      };
      
      const createdTrade = await storage.createTradeHistory(trade);
      
      // Get user and notification settings
      const user = await storage.getUser(userId);
      const settings = await storage.getNotificationSettings(userId);
      
      // Send email notification if enabled
      if (user && settings?.tradeExecution) {
        await sendTradeExecutionEmail(
          user.email,
          pair,
          decision,
          price,
          amount,
          profit
        );
      }
      
      return createdTrade;
    } catch (error) {
      console.error("Error executing MACD strategy:", error);
      throw new Error("Failed to execute trading strategy");
    }
  }
};

class BinanceService {
  private apiKey: string;
  private secretKey: string;
  
  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }
  
  // Get current prices for a list of symbols
  async getPrices(symbols: string[]): Promise<BinancePrice[]> {
    try {
      // In production, this would make an actual API call to Binance
      return symbols.map(symbol => ({
        symbol,
        price: (Math.random() * 10000).toFixed(2)
      }));
    } catch (error) {
      console.error("Error fetching prices from Binance:", error);
      throw new Error("Failed to get prices from Binance");
    }
  }
  
  // Get historical candle data
  async getKlines(symbol: string, interval: string, limit: number): Promise<BinanceCandle[]> {
    try {
      // In production, this would make an actual API call to Binance
      const candles: BinanceCandle[] = [];
      const now = Date.now();
      
      for (let i = 0; i < limit; i++) {
        const time = now - (i * 60000); // 1 minute intervals
        const open = 100 + Math.random() * 10;
        const close = open + (Math.random() * 2 - 1);
        const high = Math.max(open, close) + Math.random();
        const low = Math.min(open, close) - Math.random();
        
        candles.push({
          openTime: time,
          open: open.toFixed(2),
          high: high.toFixed(2),
          low: low.toFixed(2),
          close: close.toFixed(2),
          volume: (Math.random() * 100).toFixed(2),
          closeTime: time + 60000,
          quoteAssetVolume: (Math.random() * 1000).toFixed(2),
          trades: Math.floor(Math.random() * 100),
          takerBaseAssetVolume: (Math.random() * 50).toFixed(2),
          takerQuoteAssetVolume: (Math.random() * 500).toFixed(2)
        });
      }
      
      return candles.reverse(); // Most recent first
    } catch (error) {
      console.error("Error fetching klines from Binance:", error);
      throw new Error("Failed to get historical data from Binance");
    }
  }
  
  // Execute a strategy
  async executeStrategy(strategy: Strategy): Promise<any> {
    try {
      switch (strategy.type) {
        case "movingAverage":
          return await strategies.movingAverage(
            strategy.userId,
            strategy.id,
            strategy.pair,
            strategy.parameters
          );
        case "rsi":
          return await strategies.rsi(
            strategy.userId,
            strategy.id,
            strategy.pair,
            strategy.parameters
          );
        case "macd":
          return await strategies.macd(
            strategy.userId,
            strategy.id,
            strategy.pair,
            strategy.parameters
          );
        default:
          throw new Error(`Unsupported strategy type: ${strategy.type}`);
      }
    } catch (error) {
      console.error(`Error executing strategy ${strategy.name}:`, error);
      throw new Error("Failed to execute trading strategy");
    }
  }
}

export async function getBinanceService(userId: number): Promise<BinanceService | null> {
  try {
    // Get user's active API key
    const apiKeys = await storage.getApiKeys(userId);
    const activeKey = apiKeys.find(key => key.isActive);
    
    if (!activeKey) {
      return null;
    }
    
    return new BinanceService(activeKey.apiKey, activeKey.secretKey);
  } catch (error) {
    console.error("Error creating Binance service:", error);
    return null;
  }
}

// Common cryptocurrency symbols
export const commonSymbols = [
  { symbol: "BTCUSDT", name: "Bitcoin", shortName: "BTC" },
  { symbol: "ETHUSDT", name: "Ethereum", shortName: "ETH" },
  { symbol: "BNBUSDT", name: "Binance Coin", shortName: "BNB" },
  { symbol: "ADAUSDT", name: "Cardano", shortName: "ADA" },
  { symbol: "XRPUSDT", name: "Ripple", shortName: "XRP" },
  { symbol: "DOGEUSDT", name: "Dogecoin", shortName: "DOGE" },
  { symbol: "DOTUSDT", name: "Polkadot", shortName: "DOT" },
  { symbol: "SOLUSDT", name: "Solana", shortName: "SOL" }
];

// Available strategy types
export const strategyTypes = [
  { id: "movingAverage", name: "Moving Average Crossover" },
  { id: "rsi", name: "RSI Divergence" },
  { id: "macd", name: "MACD Oscillator" }
];

// Available timeframes
export const timeframes = [
  { value: "1m", name: "1 minute" },
  { value: "5m", name: "5 minutes" },
  { value: "15m", name: "15 minutes" },
  { value: "30m", name: "30 minutes" },
  { value: "1h", name: "1 hour" },
  { value: "4h", name: "4 hours" },
  { value: "1d", name: "1 day" }
];
