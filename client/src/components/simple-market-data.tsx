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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-3 py-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            Live desde Binance
          </Badge>
          <div className="text-sm text-gray-500">
            Actualizado: {lastUpdate.toLocaleTimeString('es-ES')}
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchMarketData} 
          disabled={isLoading}
          className="hover:bg-blue-50 hover:border-blue-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Market Data Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {symbols.map((symbol) => {
          const data = marketData.find(item => item.symbol === symbol);
          const isPositive = data ? data.change24h >= 0 : false;
          
          return (
            <Card key={symbol} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-6">
                {data ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-orange-600">
                            {symbol.replace('USDT', '').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{getSymbolDisplayName(symbol)}</h3>
                          <p className="text-xs text-gray-500">{symbol}</p>
                        </div>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isPositive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{formatPercentage(data.change24h)}</span>
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(data.price)}
                      </div>
                      <div className="text-sm text-gray-500">Precio actual</div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-3 pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Volumen 24h</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Intl.NumberFormat('es-ES', {
                            notation: 'compact',
                            maximumFractionDigits: 1
                          }).format(data.volume)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cambio</span>
                        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(data.change24h)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="space-y-1">
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
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