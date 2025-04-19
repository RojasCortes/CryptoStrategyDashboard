import { BinanceAPI, MarketData, CryptoPair } from "@shared/schema";

// Mock pairs to avoid creating new API keys during development
const AVAILABLE_PAIRS: CryptoPair[] = [
  { symbol: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT" },
  { symbol: "ETHUSDT", baseAsset: "ETH", quoteAsset: "USDT" },
  { symbol: "BNBUSDT", baseAsset: "BNB", quoteAsset: "USDT" },
  { symbol: "SOLUSDT", baseAsset: "SOL", quoteAsset: "USDT" },
  { symbol: "ADAUSDT", baseAsset: "ADA", quoteAsset: "USDT" },
  { symbol: "XRPUSDT", baseAsset: "XRP", quoteAsset: "USDT" },
  { symbol: "DOGEUSDT", baseAsset: "DOGE", quoteAsset: "USDT" },
  { symbol: "DOTUSDT", baseAsset: "DOT", quoteAsset: "USDT" },
];

export class BinanceService {
  private apiKey: string;
  private apiSecret: string;
  
  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = "https://api.binance.com/api/v3/ping";
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      console.error("Binance connection test failed:", error);
      return false;
    }
  }

  async getMarketData(symbols: string[] = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"]): Promise<MarketData[]> {
    try {
      // Get 24hr ticker price change statistics for all symbols
      const url = "https://api.binance.com/api/v3/ticker/24hr";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch market data: ${response.statusText}`);
      }
      
      const allData = await response.json();
      
      // Filter for our requested symbols
      const filteredData = allData.filter((item: any) => 
        symbols.includes(item.symbol)
      );
      
      return filteredData.map((item: any) => ({
        symbol: item.symbol,
        price: item.lastPrice,
        priceChangePercent: item.priceChangePercent,
        volume: item.volume,
        high: item.highPrice,
        low: item.lowPrice,
      }));
    } catch (error) {
      console.error("Error fetching market data:", error);
      throw error;
    }
  }

  async getAvailablePairs(): Promise<CryptoPair[]> {
    try {
      const url = "https://api.binance.com/api/v3/exchangeInfo";
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange info: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.symbols
        .filter((s: any) => s.status === "TRADING" && s.quoteAsset === "USDT")
        .map((s: any) => ({
          symbol: s.symbol,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset,
        }));
    } catch (error) {
      console.error("Error fetching available pairs:", error);
      // Return mock data for development
      return AVAILABLE_PAIRS;
    }
  }

  // This would normally trigger a trade on Binance
  // It's simplified for demo purposes
  async executeTrade(symbol: string, side: 'BUY' | 'SELL', quantity: number): Promise<any> {
    try {
      // In a real implementation, this would connect to Binance API
      // For demo, we'll just simulate a successful response
      return {
        symbol,
        side,
        quantity,
        price: side === 'BUY' ? (Math.random() * 100).toFixed(2) : (Math.random() * 100).toFixed(2),
        status: 'FILLED',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error executing trade for ${symbol}:`, error);
      throw error;
    }
  }
}

export function createBinanceService(apiKey: string, apiSecret: string): BinanceService {
  return new BinanceService(apiKey, apiSecret);
}
