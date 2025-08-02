import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  TrendingUp, 
  BarChart3, 
  AlertCircle, 
  Settings,
  RefreshCw,
  Coins
} from 'lucide-react';

interface Cryptocurrency {
  symbol: string;
  name: string;
}

interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export function CryptocurrencyList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuoteAsset, setSelectedQuoteAsset] = useState('USDT');

  // Fetch all cryptocurrencies
  const { data: cryptocurrencies, isLoading: isLoadingCryptos, error: cryptoError } = useQuery<Cryptocurrency[]>({
    queryKey: ['/api/market/cryptocurrencies'],
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  // Fetch all trading pairs
  const { data: tradingPairs, isLoading: isLoadingPairs, error: pairsError } = useQuery<TradingPair[]>({
    queryKey: ['/api/market/pairs'],
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  // Filter cryptocurrencies based on search term
  const filteredCryptos = cryptocurrencies?.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get trading pairs for selected quote asset
  const filteredPairs = tradingPairs?.filter(pair => 
    pair.quoteAsset === selectedQuoteAsset
  ) || [];

  // Get unique quote assets for filter buttons
  const quoteAssets = Array.from(new Set(tradingPairs?.map(pair => pair.quoteAsset) || []));

  const ErrorState = ({ title, message, onRetry }: { title: string, message: string, onRetry?: () => void }) => (
    <div className="text-center p-6 border border-orange-200 bg-orange-50 rounded-lg">
      <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
      <h3 className="font-semibold text-orange-800 mb-2">{title}</h3>
      <p className="text-sm text-orange-600 mb-4">{message}</p>
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => window.location.href = '/settings'}>
          <Settings className="h-4 w-4 mr-2" />
          Configurar API
        </Button>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );

  const LoadingState = () => (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
            <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-muted animate-pulse rounded w-16"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Criptomonedas de Binance
          </h2>
          <p className="text-muted-foreground">
            Todas las criptomonedas disponibles para trading en Binance
          </p>
        </div>
        <Badge variant="outline" className="text-green-600">
          Datos Reales de Binance
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar criptomoneda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {quoteAssets.slice(0, 5).map((asset) => (
                <Button
                  key={asset}
                  variant={selectedQuoteAsset === asset ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedQuoteAsset(asset)}
                >
                  {asset}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cryptocurrencies List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Todas las Criptomonedas</span>
              <Badge variant="secondary">
                {cryptocurrencies?.length || 0} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCryptos ? (
              <LoadingState />
            ) : cryptoError ? (
              <ErrorState 
                title="No se pudieron cargar las criptomonedas"
                message="Para acceder a la lista completa de criptomonedas de Binance, configura tus claves API."
              />
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredCryptos.map((crypto) => (
                    <div key={crypto.symbol} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium">{crypto.name}</div>
                        <div className="text-sm text-muted-foreground">{crypto.symbol}</div>
                      </div>
                      <Badge variant="outline">{crypto.symbol}</Badge>
                    </div>
                  ))}
                  {filteredCryptos.length === 0 && searchTerm && (
                    <div className="text-center py-8 text-muted-foreground">
                      No se encontraron criptomonedas que coincidan con "{searchTerm}"
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Trading Pairs for Selected Quote Asset */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pares de Trading ({selectedQuoteAsset})</span>
              <Badge variant="secondary">
                {filteredPairs.length} pares
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPairs ? (
              <LoadingState />
            ) : pairsError ? (
              <ErrorState 
                title="No se pudieron cargar los pares de trading"
                message="Para acceder a todos los pares de trading de Binance, configura tus claves API."
              />
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredPairs.map((pair) => (
                    <div key={pair.symbol} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium">{pair.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {pair.baseAsset} / {pair.quoteAsset}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{pair.baseAsset}</Badge>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  ))}
                  {filteredPairs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay pares disponibles para {selectedQuoteAsset}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {cryptocurrencies?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Criptomonedas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {tradingPairs?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Pares de Trading</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {quoteAssets.length}
              </div>
              <div className="text-sm text-muted-foreground">Activos Base</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                100%
              </div>
              <div className="text-sm text-muted-foreground">Datos Reales</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}