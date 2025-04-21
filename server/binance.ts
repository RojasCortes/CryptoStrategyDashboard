import { MarketData, CryptoPair, CandleData } from "@shared/schema";

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
      console.error("Error en prueba de conexión a Binance:", error);
      return false;
    }
  }

  async getMarketData(symbols: string[] = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"]): Promise<MarketData[]> {
    try {
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
      console.error("Error obteniendo datos de mercado:", error);
      
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
      console.error("Error obteniendo pares disponibles:", error);
      // Return mock data for development in case of error
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
  
  async getHistoricalData(symbol: string, interval: string = '1d', limit: number = 90): Promise<CandleData[]> {
    try {
      // Validate symbol
      symbol = symbol.toUpperCase();
      
      // Set default symbol if none provided
      if (!symbol) {
        symbol = 'BTCUSDT';
      }
      
      // Validate interval
      const validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
      if (!validIntervals.includes(interval)) {
        interval = '1d';
      }
      
      // Validate limit
      if (limit > 1000) limit = 1000;
      if (limit < 1) limit = 90;
      
      // Use real Binance API
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching klines: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convertir el formato de Binance a nuestro formato
      return data.map((item: any) => ({
        time: Math.floor(item[0] / 1000), // Convertir de milisegundos a segundos
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5])
      }));
    } catch (error) {
      console.error(`Error obteniendo datos históricos para ${symbol}:`, error);
      
      // En caso de error, generamos datos de ejemplo básicos
      const mockData: CandleData[] = [];
      const basePrice = symbol.includes('BTC') ? 65000 : 
                       symbol.includes('ETH') ? 3500 : 
                       symbol.includes('BNB') ? 600 : 
                       symbol.includes('SOL') ? 180 : 50;
                       
      const now = Math.floor(Date.now() / 1000);
      const intervalSeconds = interval === '1h' ? 3600 : 
                             interval === '4h' ? 14400 : 
                             interval === '1w' ? 604800 : 86400;
                             
      for (let i = 0; i < limit; i++) {
        const time = now - ((limit - i) * intervalSeconds);
        const multiplier = 1 + (Math.sin(i / 10) * 0.05);
        mockData.push({
          time,
          open: basePrice * multiplier,
          high: basePrice * multiplier * 1.02,
          low: basePrice * multiplier * 0.98,
          close: basePrice * multiplier * (1 + (Math.random() * 0.02 - 0.01)),
          volume: basePrice * 10 * (Math.random() * 5 + 1)
        });
      }
      
      return mockData;
    }
  }
}

export function createBinanceService(apiKey: string, apiSecret: string): BinanceService {
  return new BinanceService(apiKey, apiSecret);
}
