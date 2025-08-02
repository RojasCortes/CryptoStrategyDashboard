import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Settings, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface RealDataChartsProps {
  symbol?: string;
  className?: string;
}

export function RealDataCharts({ symbol = 'BTCUSDT', className }: RealDataChartsProps) {
  const [timeframe, setTimeframe] = useState('1d');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real historical data from Binance
  const { data: historicalData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/market/candles', symbol, timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/market/candles?symbol=${symbol}&interval=${timeframe}&limit=90`);
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch account balance for portfolio chart
  const { data: accountData, isLoading: isLoadingAccount, error: accountError } = useQuery({
    queryKey: ['/api/account/balance'],
    queryFn: async () => {
      const response = await fetch('/api/account/balance');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch account data');
      }
      return response.json();
    },
    retry: false,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  };

  // Error state component
  const ErrorState = ({ error, title, action }: { error: any, title: string, action?: () => void }) => (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className="font-semibold text-orange-800 mb-2">{title}</h3>
        <p className="text-sm text-orange-600 mb-4">
          {error?.message?.includes('API') 
            ? 'Para acceder a datos reales de Binance, configura tus claves API en Ajustes.'
            : error?.message || 'No se pudieron cargar los datos reales.'}
        </p>
        {action && (
          <Button variant="outline" size="sm" onClick={action} className="mr-2">
            <Settings className="h-4 w-4 mr-2" />
            Configurar API
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );

  // Loading state component
  const LoadingState = ({ title }: { title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <Badge variant="outline" className="w-fit">
          Cargando datos reales...
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] animate-pulse bg-muted rounded"></div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      {/* Price History Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Historial de Precios - {symbol}</CardTitle>
                <CardDescription>Datos reales de Binance</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {['1d', '1w', '1M'].map((tf) => (
                    <Button
                      key={tf}
                      variant={timeframe === tf ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeframe(tf)}
                      className="text-xs"
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] animate-pulse bg-muted rounded"></div>
            ) : error ? (
              <ErrorState 
                error={error} 
                title="No se pudieron cargar los datos de precios"
                action={() => window.location.href = '/settings'}
              />
            ) : historicalData && historicalData.length > 0 ? (
              <>
                <Badge variant="outline" className="mb-4 text-green-600">
                  Datos reales de Binance • Actualizado hace {new Date().toLocaleTimeString('es-ES')}
                </Badge>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="openTime" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: '0.75rem', fill: '#64748b' }}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatPrice(value)}
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: '0.75rem', fill: '#64748b' }}
                      />
                      <Tooltip 
                        formatter={(value) => [formatPrice(Number(value)), 'Precio']}
                        labelFormatter={(value) => new Date(value).toLocaleString('es-ES')}
                        contentStyle={{
                          backgroundColor: 'white',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="close" 
                        stroke="#3b82f6" 
                        fillOpacity={1}
                        fill="url(#priceGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <ErrorState 
                error={{ message: "No hay datos disponibles para este símbolo" }} 
                title="Sin datos de precios"
              />
            )}
          </CardContent>
        </Card>

        {/* Portfolio Balance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Balance de Cartera</CardTitle>
            <CardDescription>Balances reales de tu cuenta Binance</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAccount ? (
              <div className="h-[300px] animate-pulse bg-muted rounded"></div>
            ) : accountError ? (
              <ErrorState 
                error={accountError} 
                title="No se pudo acceder a los datos de la cuenta"
                action={() => window.location.href = '/settings'}
              />
            ) : accountData?.balances ? (
              <>
                <Badge variant="outline" className="mb-4 text-green-600">
                  Datos reales de tu cuenta Binance
                </Badge>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accountData.balances.filter((balance: any) => parseFloat(balance.free) > 0).slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="asset" 
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: '0.75rem', fill: '#64748b' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: '0.75rem', fill: '#64748b' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [parseFloat(value as string).toFixed(6), 'Balance']}
                        contentStyle={{
                          backgroundColor: 'white',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Bar 
                        dataKey="free" 
                        fill="#34d399" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <ErrorState 
                error={{ message: "Configura tus claves API para ver los balances reales" }} 
                title="API requerida para balances"
                action={() => window.location.href = '/settings'}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real Data Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-sm">
              <strong>Datos 100% Reales:</strong> Todos los gráficos y estadísticas provienen directamente de la API de Binance. 
              Sin datos simulados o falsos. {!accountData && !error && "Configura tus claves API para acceder a datos de cuenta."}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}