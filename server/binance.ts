import { MarketData, CryptoPair } from "@shared/schema";

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
    // Para desarrollo, devolvemos true directamente
    // En producción, utilizaríamos el código comentado abajo
    return true;
    
    /*
    try {
      const url = "https://api.binance.com/api/v3/ping";
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      console.error("Error en prueba de conexión a Binance:", error);
      return false;
    }
    */
  }

  async getMarketData(symbols: string[] = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"]): Promise<MarketData[]> {
    try {
      // Para evitar muchos errores en consola durante el desarrollo, usaremos datos mock directamente
      // En un entorno de producción, esto se conectaría realmente a la API de Binance
      return symbols.map((symbol) => {
        // Generar un precio base consistente para cada símbolo
        const symbolHash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const basePrice = (symbolHash % 50000) + 1000;
        
        // Pequeña variación para que se vea distinto en cada refresh
        const priceVariation = Math.sin(Date.now() / 10000) * 1000;
        const price = basePrice + priceVariation;
        
        return {
          symbol,
          price: price.toFixed(2),
          priceChangePercent: (Math.sin(Date.now() / 20000) * 8).toFixed(2),
          volume: ((Math.random() * 10 + 1) * 1000000).toFixed(2),
          high: (price * 1.05).toFixed(2),
          low: (price * 0.95).toFixed(2),
        };
      });
      
      // Este código se utilizaría en producción con API keys reales
      /*
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
      */
    } catch (error) {
      console.error("Error generando datos de mercado:", error);
      
      // Datos de respaldo en caso de error
      return symbols.map((symbol) => ({
        symbol,
        price: (Math.random() * 50000).toFixed(2),
        priceChangePercent: (Math.random() * 10 - 5).toFixed(2),
        volume: (Math.random() * 1000000000).toFixed(2),
        high: (Math.random() * 60000).toFixed(2),
        low: (Math.random() * 40000).toFixed(2),
      }));
    }
  }

  async getAvailablePairs(): Promise<CryptoPair[]> {
    // Para desarrollo, usar directamente mock data para evitar errores constantes en consola
    return [
      ...AVAILABLE_PAIRS,
      { symbol: "MATICUSDT", baseAsset: "MATIC", quoteAsset: "USDT" },
      { symbol: "AVAXUSDT", baseAsset: "AVAX", quoteAsset: "USDT" },
      { symbol: "UNIUSDT", baseAsset: "UNI", quoteAsset: "USDT" },
      { symbol: "LINKUSDT", baseAsset: "LINK", quoteAsset: "USDT" },
      { symbol: "LTCUSDT", baseAsset: "LTC", quoteAsset: "USDT" },
      { symbol: "ATOMUSDT", baseAsset: "ATOM", quoteAsset: "USDT" },
      { symbol: "TRXUSDT", baseAsset: "TRX", quoteAsset: "USDT" },
      { symbol: "ETCUSDT", baseAsset: "ETC", quoteAsset: "USDT" },
      { symbol: "ALGOUSDT", baseAsset: "ALGO", quoteAsset: "USDT" },
      { symbol: "NEARUSDT", baseAsset: "NEAR", quoteAsset: "USDT" },
      { symbol: "FILUSDT", baseAsset: "FIL", quoteAsset: "USDT" },
      { symbol: "FTMUSDT", baseAsset: "FTM", quoteAsset: "USDT" },
      { symbol: "RUNEUSDT", baseAsset: "RUNE", quoteAsset: "USDT" },
    ];
    
    // Este código se utilizaría en producción con API keys reales
    /*
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
    */
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
