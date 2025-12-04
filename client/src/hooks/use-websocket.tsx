import { useEffect, useRef, useCallback, useState } from 'react';
import { useFirebaseAuth } from './use-firebase-auth';

interface MarketData {
  symbol: string;
  price: number;
  priceChange: number;
  volume: number;
  high: number;
  low: number;
  lastUpdate: number;
}

interface WebSocketMessage {
  type: 'marketData' | 'pong' | 'error';
  symbol?: string;
  data?: MarketData;
  timestamp?: number;
  error?: string;
}

interface UseWebSocketOptions {
  symbols?: string[];
  onMarketData?: (data: MarketData) => void;
  onError?: (error: string) => void;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    symbols = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt'],
    onMarketData,
    onError,
    reconnectInterval = 5000
  } = options;

  const { user } = useFirebaseAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    if (!user) {
      console.log('User not authenticated, skipping WebSocket connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionAttempts(0);

        // Authenticate with user ID
        if (wsRef.current && user.id) {
          wsRef.current.send(JSON.stringify({
            type: 'auth',
            userId: user.id
          }));

          // Subscribe to symbols
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            symbols: symbols
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'marketData':
              if (message.symbol && message.data) {
                setMarketData(prev => {
                  const newData = new Map(prev);
                  newData.set(message.symbol!, message.data!);
                  return newData;
                });

                if (onMarketData) {
                  onMarketData(message.data);
                }
              }
              break;

            case 'pong':
              console.log('WebSocket pong received');
              break;

            case 'error':
              console.error('WebSocket error:', message.error);
              if (onError) {
                onError(message.error || 'Unknown WebSocket error');
              }
              break;

            default:
              console.log('Unknown WebSocket message type:', message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
        setIsConnected(false);

        // Don't reconnect if it was a clean close (code 1000)
        if (event.code !== 1000 && connectionAttempts < maxReconnectAttempts) {
          const delay = Math.min(reconnectInterval * Math.pow(2, connectionAttempts), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${connectionAttempts + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else if (connectionAttempts >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          if (onError) {
            onError('Max reconnection attempts reached');
          }
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        if (onError) {
          onError('WebSocket connection error');
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (onError) {
        onError('Failed to create WebSocket connection');
      }
    }
  }, [user, symbols, onMarketData, onError, reconnectInterval, connectionAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionAttempts(0);
  }, []);

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const ping = useCallback(() => {
    return sendMessage({ type: 'ping' });
  }, [sendMessage]);

  const subscribe = useCallback((newSymbols: string[]) => {
    return sendMessage({
      type: 'subscribe',
      symbols: newSymbols
    });
  }, [sendMessage]);

  const unsubscribe = useCallback((symbolsToRemove: string[]) => {
    return sendMessage({
      type: 'unsubscribe',
      symbols: symbolsToRemove
    });
  }, [sendMessage]);

  // Initialize connection when user is available
  // Note: Only depend on user.id to avoid reconnection loops from connect/disconnect recreation
  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only reconnect when user ID changes, not when functions recreate

  // Ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      ping();
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected, ping]);

  return {
    isConnected,
    marketData,
    connectionAttempts,
    connect,
    disconnect,
    sendMessage,
    ping,
    subscribe,
    unsubscribe,
    // Helper function to get specific symbol data
    getSymbolData: (symbol: string) => marketData.get(symbol.toLowerCase()),
    // Get all symbols as array
    getAllSymbols: () => Array.from(marketData.keys()),
    // Check if symbol is being tracked
    hasSymbol: (symbol: string) => marketData.has(symbol.toLowerCase())
  };
}