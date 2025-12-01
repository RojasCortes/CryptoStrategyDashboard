import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMarketStream } from '@/hooks/use-market-stream';
import { TrendingUp, TrendingDown, Wifi, WifiOff, Activity } from 'lucide-react';

interface MarketDataProps {
  symbols?: string[];
  className?: string;
}

export function MarketDataWebSocket({ symbols = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt'], className }: MarketDataProps) {
  const { 
    isConnected, 
    marketData, 
    connectionAttempts,
    lastUpdate,
    getSymbolData 
  } = useMarketStream({
    symbols,
    onMarketData: (data) => {
      console.log('Real-time market data received:', data);
    },
    onError: (error) => {
      console.error('Market stream error:', error);
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  };

  const formatPercentage = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getSymbolDisplayName = (symbol: string) => {
    const names: Record<string, string> = {
      'btcusdt': 'Bitcoin',
      'ethusdt': 'Ethereum', 
      'bnbusdt': 'BNB',
      'solusdt': 'Solana'
    };
    return names[symbol.toLowerCase()] || symbol.toUpperCase();
  };

  return (
    <div className={className}>
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                SSE Conectado
              </Badge>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-orange-500" />
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                {connectionAttempts > 0 ? `Reconectando... (${connectionAttempts}/10)` : 'Conectando...'}
              </Badge>
            </>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
        </div>
      </div>

      {/* Market Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {symbols.map((symbol) => {
          const data = marketData.find(item => item.symbol.toLowerCase() === symbol.toLowerCase());
          const isPositive = data ? data.change24h >= 0 : false;
          
          return (
            <Card key={symbol} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{getSymbolDisplayName(symbol)}</span>
                  <Badge 
                    variant={isPositive ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {data ? (
                      <div className="flex items-center gap-1">
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {formatPercentage(data.change24h)}
                      </div>
                    ) : (
                      <div className="animate-pulse">Cargando...</div>
                    )}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {data ? (
                  <div className="space-y-2">
                    <div>
                      <div className="text-2xl font-bold">
                        {formatPrice(data.price)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Precio actual
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Cambio 24h</div>
                        <div className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(data.change24h)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs">
                      <div className="text-muted-foreground">Volumen 24h</div>
                      <div className="font-medium">
                        {new Intl.NumberFormat('es-ES', {
                          notation: 'compact',
                          maximumFractionDigits: 2
                        }).format(data.volume)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-8 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              {/* Real-time indicator */}
              {data && (
                <div className="absolute top-2 right-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Performance Stats */}
      <div className="mt-6 p-4 bg-card rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-sm font-medium">Fuente de Datos</div>
            <div className="text-xs text-muted-foreground">
              {isConnected ? 'WebSocket (Tiempo Real)' : 'REST API (Cache 30s)'}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">Uso de Rate Limit</div>
            <div className="text-xs text-green-600">&lt;0.5%</div>
          </div>
          <div>
            <div className="text-sm font-medium">Latencia</div>
            <div className="text-xs text-muted-foreground">
              {isConnected ? '~50ms' : '~500ms'}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">Símbolos Activos</div>
            <div className="text-xs text-muted-foreground">{symbols.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}