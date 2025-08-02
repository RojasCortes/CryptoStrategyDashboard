import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { createBinanceService } from './binance';

interface ClientConnection {
  ws: WebSocket;
  userId?: number;
  subscribedSymbols: Set<string>;
  lastPing: number;
}

export class BinanceWebSocketService {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private binanceWs: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private marketDataCache: Map<string, any> = new Map();
  private lastUpdate = new Map<string, number>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private binanceStreamUrl = 'wss://stream.binance.us:9443/ws/';
  
  // Rate limiting and monitoring
  private requestCount = 0;
  private rateLimitWindow = 60000; // 1 minute
  private maxRequestsPerMinute = 1200; // Binance market data limit
  
  constructor(server: Server) {
    // Create WebSocket server on /ws path to avoid conflicts with Vite HMR
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      perMessageDeflate: true 
    });
    
    this.setupClientHandlers();
    this.startHeartbeat();
    this.connectToBinance();
    this.startRateLimitReset();
    
    console.log('WebSocket server initialized on /ws path');
  }

  private setupClientHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('New WebSocket client connected');
      
      const client: ClientConnection = {
        ws,
        subscribedSymbols: new Set(),
        lastPing: Date.now()
      };
      
      this.clients.set(ws, client);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          console.error('Error parsing client message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('pong', () => {
        const client = this.clients.get(ws);
        if (client) {
          client.lastPing = Date.now();
        }
      });

      // Send initial market data if available
      this.sendCachedMarketData(ws);
    });
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'auth':
        client.userId = message.userId;
        console.log(`Client authenticated as user ${message.userId}`);
        break;
        
      case 'subscribe':
        if (Array.isArray(message.symbols)) {
          message.symbols.forEach((symbol: string) => {
            client.subscribedSymbols.add(symbol.toLowerCase());
          });
          console.log(`Client subscribed to: ${message.symbols.join(', ')}`);
          this.updateBinanceSubscriptions();
        }
        break;
        
      case 'unsubscribe':
        if (Array.isArray(message.symbols)) {
          message.symbols.forEach((symbol: string) => {
            client.subscribedSymbols.delete(symbol.toLowerCase());
          });
          console.log(`Client unsubscribed from: ${message.symbols.join(', ')}`);
          this.updateBinanceSubscriptions();
        }
        break;
        
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private connectToBinance(): void {
    if (this.binanceWs?.readyState === WebSocket.OPEN) {
      console.log('Already connected to Binance WebSocket');
      return;
    }

    // Try Binance US first, then fall back to international
    const streams = ['btcusdt@ticker', 'ethusdt@ticker', 'bnbusdt@ticker', 'solusdt@ticker'];
    const streamUrl = `${this.binanceStreamUrl}${streams.join('/')}`;
    
    console.log('Connecting to Binance WebSocket...');
    this.binanceWs = new WebSocket(streamUrl);

    this.binanceWs.on('open', () => {
      console.log('Connected to Binance WebSocket stream');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.binanceWs.on('message', (data: Buffer) => {
      this.handleBinanceMessage(data);
    });

    this.binanceWs.on('close', (code, reason) => {
      console.log(`Binance WebSocket closed: ${code} - ${reason}`);
      this.scheduleReconnect();
    });

    this.binanceWs.on('error', (error) => {
      console.error('Binance WebSocket error:', error);
      this.scheduleReconnect();
    });
  }

  private handleBinanceMessage(data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.stream && message.data) {
        const symbol = message.data.s; // Symbol from ticker data
        const tickerData = {
          symbol: symbol,
          price: parseFloat(message.data.c), // Current price
          priceChange: parseFloat(message.data.P), // Price change percentage
          volume: parseFloat(message.data.v), // Volume
          high: parseFloat(message.data.h), // High price
          low: parseFloat(message.data.l), // Low price
          lastUpdate: Date.now()
        };

        // Cache the data
        this.marketDataCache.set(symbol, tickerData);
        this.lastUpdate.set(symbol, Date.now());

        // Broadcast to subscribed clients
        this.broadcastMarketData(symbol.toLowerCase(), tickerData);
        
        // Rate limiting monitoring
        this.requestCount++;
      }
    } catch (error) {
      console.error('Error processing Binance message:', error);
    }
  }

  private broadcastMarketData(symbol: string, data: any): void {
    const message = JSON.stringify({
      type: 'marketData',
      symbol: symbol,
      data: data
    });

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN && 
          client.subscribedSymbols.has(symbol)) {
        client.ws.send(message);
      }
    });
  }

  private sendCachedMarketData(ws: WebSocket): void {
    this.marketDataCache.forEach((data, symbol) => {
      const message = JSON.stringify({
        type: 'marketData',
        symbol: symbol.toLowerCase(),
        data: data
      });
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  private updateBinanceSubscriptions(): void {
    // Collect all symbols clients are subscribed to
    const allSubscribedSymbols = new Set<string>();
    
    this.clients.forEach((client) => {
      client.subscribedSymbols.forEach(symbol => {
        allSubscribedSymbols.add(symbol);
      });
    });

    // For now, we use a fixed stream. In production, you might want to 
    // dynamically manage subscriptions based on client needs
    console.log(`Clients subscribed to: ${Array.from(allSubscribedSymbols).join(', ')}`);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Reconnecting to Binance in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connectToBinance();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          // Check if client is still alive
          if (Date.now() - client.lastPing > 60000) { // 1 minute timeout
            console.log('Terminating inactive client');
            ws.terminate();
            this.clients.delete(ws);
          } else {
            ws.ping();
          }
        } else {
          this.clients.delete(ws);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  private startRateLimitReset(): void {
    setInterval(() => {
      const requestsPerMinute = this.requestCount;
      console.log(`WebSocket requests in last minute: ${requestsPerMinute}/${this.maxRequestsPerMinute}`);
      
      if (requestsPerMinute > this.maxRequestsPerMinute * 0.8) {
        console.warn('Approaching rate limit, consider implementing throttling');
      }
      
      this.requestCount = 0;
    }, this.rateLimitWindow);
  }

  // Fallback method to get market data via REST if WebSocket fails
  public async getMarketDataFallback(symbols?: string[]): Promise<any[]> {
    try {
      console.log('Using REST API fallback for market data');
      const binanceService = createBinanceService('', ''); // Public endpoints don't need auth
      return await binanceService.getMarketData(symbols);
    } catch (error) {
      console.error('REST API fallback failed:', error);
      throw error;
    }
  }

  public getStats() {
    return {
      connectedClients: this.clients.size,
      binanceConnected: this.binanceWs?.readyState === WebSocket.OPEN,
      cachedSymbols: this.marketDataCache.size,
      requestsLastMinute: this.requestCount,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.clients.forEach((client, ws) => {
      ws.close();
    });
    
    if (this.binanceWs) {
      this.binanceWs.close();
    }
    
    this.wss.close();
    console.log('WebSocket service closed');
  }
}