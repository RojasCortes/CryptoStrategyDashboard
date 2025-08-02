import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketDataProps {
  symbols?: string[];
  className?: string;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
}

export function SimpleMarketData({ symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'], className }: MarketDataProps) {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string>('');

  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Use direct Binance API call
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al obtener datos de mercado');
      }
      
      const data = await response.json();
      
      const formattedData = data.map((item: any) => ({
        symbol: item.symbol,
        price: parseFloat(item.lastPrice),
        change24h: parseFloat(item.priceChangePercent),
        volume: parseFloat(item.volume)
      }));
      
      setMarketData(formattedData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
      setError('Error al cargar datos de mercado');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    // Update every 2 minutes to reduce load
    const interval = setInterval(fetchMarketData, 120000);
    
    return () => clearInterval(interval);
  }, [symbols]);

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
      'BTCUSDT': 'Bitcoin',
      'ETHUSDT': 'Ethereum', 
      'BNBUSDT': 'BNB',
      'SOLUSDT': 'Solana'
    };
    return names[symbol] || symbol;
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Datos de Mercado</span>
            <Button variant="outline" size="sm" onClick={fetchMarketData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Verifique su conexión a internet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            Datos de Binance
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
          </div>
          <Button variant="outline" size="sm" onClick={fetchMarketData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Market Data Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {symbols.map((symbol) => {
          const data = marketData.find(item => item.symbol === symbol);
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
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}