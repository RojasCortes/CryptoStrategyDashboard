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
  
  async getHistoricalData(symbol: string, interval: string = '1d', limit: number = 90): Promise<CandleData[]> {
    try {
      // Para desarrollo, generamos datos simulados
      const candleData: CandleData[] = [];
      const currentDate = new Date();
      
      // Determinar factor de precio basado en símbolo
      let basePrice = 0;
      if (symbol.includes('BTC')) {
        basePrice = 45000;
      } else if (symbol.includes('ETH')) {
        basePrice = 3000;
      } else if (symbol.includes('BNB')) {
        basePrice = 500;
      } else if (symbol.includes('SOL')) {
        basePrice = 150;
      } else {
        basePrice = 50;
      }
      
      let price = basePrice;
      let time = new Date(currentDate);
      
      // Ajustar intervalo
      let intervalHours = 24; // Por defecto 1 día
      if (interval === '1h') intervalHours = 1;
      if (interval === '4h') intervalHours = 4;
      if (interval === '1w') intervalHours = 168; // 7 días * 24 horas
      
      time.setHours(time.getHours() - (limit * intervalHours));
      
      for (let i = 0; i < limit; i++) {
        // Simular movimiento de precio con tendencia
        const trend = Math.sin(i / 10) * 0.03; // tendencia sinusoidal
        const volatility = 0.02; // 2% de volatilidad
        const change = trend + (Math.random() - 0.5) * volatility;
        
        const open = price;
        const close = open * (1 + change);
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const volume = Math.floor(Math.random() * 10000 + 1000) * (Math.random() > 0.8 ? 3 : 1);
        
        // Timestamp en formato Unix (segundos)
        const timestamp = Math.floor(time.getTime() / 1000);
        
        candleData.push({
          time: timestamp,
          open: open,
          high: high,
          low: low,
          close: close,
          volume: volume
        });
        
        // Actualizar para la siguiente vela
        price = close;
        time = new Date(time.getTime() + (intervalHours * 60 * 60 * 1000));
      }
      
      return candleData;
      
      /* 
      // En producción, utilizaríamos la API real de Binance
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
      */
    } catch (error) {
      console.error(`Error obteniendo datos históricos para ${symbol}:`, error);
      // En caso de error, devolvemos un conjunto de datos vacío
      return [];
    }
  }
}

export function createBinanceService(apiKey: string, apiSecret: string): BinanceService {
  return new BinanceService(apiKey, apiSecret);
}
