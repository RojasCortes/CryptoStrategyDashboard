import { useState, useEffect, useCallback } from 'react';

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  lastUpdate: number;
}

interface UseMarketStreamOptions {
  symbols?: string[];
  onMarketData?: (data: MarketData[]) => void;
  onError?: (error: Error) => void;
}

export function useMarketStream({ symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'], onMarketData, onError }: UseMarketStreamOptions = {}) {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const startMarketStream = useCallback(() => {
    // Prevent excessive reconnection attempts
    if (connectionAttempts >= 3) {
      console.log('Max connection attempts reached, stopping reconnection');
      return null;
    }
    
    setConnectionAttempts(prev => prev + 1);
    
    function updateDashboard(data: MarketData[]) {
      setMarketData(data);
      setLastUpdate(new Date());
      setIsConnected(true);
      onMarketData?.(data);
    }

    // 1. SSE para datos críticos en tiempo real
    const connectSSE = () => {
      try {
        const eventSource = new EventSource('/api/market-stream');
        
        eventSource.onopen = () => {
          setIsConnected(true);
          console.log('SSE connection established');
        };
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            updateDashboard(data);
          } catch (error) {
            console.error('Error parsing SSE data:', error);
          }
        };
        
        eventSource.onerror = (error) => {
          console.error('SSE error:', error);
          setIsConnected(false);
          eventSource.close();
          
          // Only retry if we haven't exceeded max attempts
          if (connectionAttempts < 3) {
            setTimeout(() => {
              if (connectionAttempts < 3) {
                startFallbackPolling();
              }
            }, 5000);
          }
        };
        
        return eventSource;
      } catch (error) {
        console.error('SSE not supported, falling back to polling');
        return startFallbackPolling();
      }
    };

    // 2. Polling como fallback
    const startFallbackPolling = () => {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/market-data');
          const data = await response.json();
          updateDashboard(data);
        } catch (error) {
          console.error('Polling error:', error);
          setIsConnected(false);
          onError?.(error as Error);
        }
      };
      
      // Fetch immediately
      fetchData();
      
      // Set up interval with longer delay to reduce load
      const interval = setInterval(fetchData, 60000); // Changed to 60 seconds
      return interval;
    };

    // 3. Detección automática
    if (typeof EventSource !== 'undefined') {
      return connectSSE(); // Preferir SSE
    } else {
      return startFallbackPolling(); // Fallback para navegadores viejos
    }
  }, [onMarketData, onError]);

  useEffect(() => {
    const connection = startMarketStream();
    
    return () => {
      if (connection instanceof EventSource) {
        connection.close();
      } else if (typeof connection === 'number') {
        clearInterval(connection);
      }
    };
  }, [startMarketStream]);

  const getSymbolData = useCallback((symbol: string) => {
    return marketData.find(data => data.symbol.toLowerCase() === symbol.toLowerCase());
  }, [marketData]);

  return {
    marketData,
    isConnected,
    connectionAttempts,
    lastUpdate,
    getSymbolData
  };
}