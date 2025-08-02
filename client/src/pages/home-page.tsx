import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBinanceData } from "@/hooks/use-binance";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { MarketDataWebSocket } from "@/components/market-data-websocket";
import { RealDataCharts } from "@/components/real-data-charts";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Strategy } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Users,
  RefreshCw,
  ChevronRight,
  Bell,
  Wallet,
  Zap,
  LineChart,
  PieChart,
  DollarSign,
  Globe,
  Calendar,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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
  Legend,
  LineChart as RechartsLineChart,
  Line
} from "recharts";

// Mock data for charts and statistics
const portfolioData = [
  { date: "Jan", value: 35000 },
  { date: "Feb", value: 38000 },
  { date: "Mar", value: 36000 },
  { date: "Apr", value: 40000 },
  { date: "May", value: 42000 },
  { date: "Jun", value: 41000 },
  { date: "Jul", value: 45000 },
  { date: "Aug", value: 47000 },
  { date: "Sep", value: 49000 },
  { date: "Oct", value: 52000 },
  { date: "Nov", value: 51000 },
  { date: "Dec", value: 55000 },
];

const revenueData = [
  { date: "Jan", revenue: 5200 },
  { date: "Feb", revenue: 4800 },
  { date: "Mar", revenue: 6100 },
  { date: "Apr", revenue: 5600 },
  { date: "May", revenue: 6800 },
  { date: "Jun", revenue: 7400 },
  { date: "Jul", revenue: 7200 },
  { date: "Aug", revenue: 8100 },
  { date: "Sep", revenue: 7900 },
  { date: "Oct", revenue: 8600 },
  { date: "Nov", revenue: 9200 },
  { date: "Dec", revenue: 10400 },
];

const recentTrades = [
  { 
    id: 1, 
    strategy: "MACD Crossover", 
    pair: "BTC/USDT", 
    type: "BUY", 
    amount: 0.25, 
    price: 48750, 
    status: "completed", 
    timestamp: "2023-12-20T14:32:21Z",
    profitLoss: 540,
    profitLossPercent: 4.5
  },
  { 
    id: 2, 
    strategy: "RSI Oversold", 
    pair: "ETH/USDT", 
    type: "BUY", 
    amount: 2.5, 
    price: 2980, 
    status: "completed", 
    timestamp: "2023-12-21T09:12:43Z",
    profitLoss: 275,
    profitLossPercent: 3.7
  },
  { 
    id: 3, 
    strategy: "Grid Trading", 
    pair: "SOL/USDT", 
    type: "SELL", 
    amount: 25, 
    price: 142, 
    status: "completed", 
    timestamp: "2023-12-21T16:45:10Z",
    profitLoss: -180,
    profitLossPercent: -5.1
  },
  { 
    id: 4, 
    strategy: "Trend Following", 
    pair: "BNB/USDT", 
    type: "BUY", 
    amount: 3, 
    price: 462, 
    status: "completed", 
    timestamp: "2023-12-22T11:05:37Z",
    profitLoss: 126,
    profitLossPercent: 9.1
  },
];

const topStrategies = [
  { id: 1, name: "MACD Crossover", pair: "BTC/USDT", profitLoss: 4350, trades: 24, winRate: 75 },
  { id: 2, name: "RSI Oversold", pair: "ETH/USDT", profitLoss: 3120, trades: 18, winRate: 72 },
  { id: 3, name: "Grid Trading", pair: "SOL/USDT", profitLoss: 2890, trades: 42, winRate: 65 },
];

export default function HomePage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const { marketData = [], isLoading: isLoadingMarketData, error: marketError } = useBinanceData();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const { data: strategies = [], isLoading: isStrategiesLoading, error: strategiesError } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
    retry: 1,
    staleTime: 30000,
    enabled: !!user,
  });

  const { data: trades = [], isLoading: isTradesLoading, error: tradesError } = useQuery({
    queryKey: ["/api/trades"],
    retry: 1,
    staleTime: 30000,
    enabled: !!user,
  });

  console.log('HomePage render:', { user, marketData, strategies, trades });
  
  // Get current time for greeting
  const currentHour = new Date().getHours();
  let greeting = "Buenos días";
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Buenas tardes";
  } else if (currentHour >= 18) {
    greeting = "Buenas noches";
  }
  
  // Get today's date
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = today.toLocaleDateString('es-ES', options);
  // Capitalize first letter
  const dateString = formattedDate && typeof formattedDate === 'string' 
    ? formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
    : 'Fecha no disponible';



  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Debug render state
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <p>Usuario no encontrado. Redirigiendo a login...</p>
        </div>
      </div>
    );
  }

  // Show loading state if data is still loading
  if (isStrategiesLoading || isTradesLoading || isLoadingMarketData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
          <div className="text-xs text-muted-foreground/70">
            {isStrategiesLoading && <div>• Cargando estrategias...</div>}
            {isTradesLoading && <div>• Cargando operaciones...</div>}
            {isLoadingMarketData && <div>• Cargando datos de mercado...</div>}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there are critical errors
  if (strategiesError || tradesError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Error al cargar el dashboard</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            {strategiesError && <div>Error de estrategias: {strategiesError.message}</div>}
            {tradesError && <div>Error de operaciones: {tradesError.message}</div>}
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Recargar página
          </Button>
        </div>
      </div>
    );
  }

  // Portfolio summary stats
  const portfolioValue = 55000;
  const portfolioChange = 2500;
  const portfolioChangePercent = 4.76;
  
  // Strategy stats
  const totalStrategies = strategies.length;
  const activeStrategies = strategies.filter(s => s.isActive).length;
  
  // Calculate daily profit
  const dailyProfit = 1280;
  const dailyProfitPercent = 2.4;
  
  // Calculate monthly profit
  const monthlyProfit = 12500;
  const monthlyProfitPercent = 23.8;

  return (
    <div className="flex h-screen bg-muted/10">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5">
          <div className="max-w-7xl mx-auto">
            
            {/* Header section with greeting */}
            <div className="mb-8">
              <div className="text-sm text-muted-foreground">{dateString}</div>
              <h1 className="text-3xl font-bold tracking-tight">
                {greeting}, {user.username}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Aquí tienes un resumen de tu actividad de trading
              </p>
            </div>
            
            {/* Key metrics section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Daily profit */}
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Beneficio diario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(dailyProfit)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        vs. ayer
                      </div>
                    </div>
                    <div className={`flex items-center ${dailyProfitPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {dailyProfitPercent >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      <span>{formatPercentage(dailyProfitPercent)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Monthly profit */}
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Beneficio mensual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(monthlyProfit)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        vs. mes anterior
                      </div>
                    </div>
                    <div className={`flex items-center ${monthlyProfitPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {monthlyProfitPercent >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      <span>{formatPercentage(monthlyProfitPercent)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Portfolio value */}
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Valor de cartera
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(portfolioValue)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {trades.length || 0} operaciones
                      </div>
                    </div>
                    <div className={`flex items-center ${portfolioChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {portfolioChangePercent >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      <span>{formatPercentage(portfolioChangePercent)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Active strategies */}
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Estrategias activas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {activeStrategies}/{totalStrategies}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        estrategias
                      </div>
                    </div>
                    <div className="text-blue-500">
                      <Zap className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Real-time Market Data WebSocket Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Datos de Mercado en Tiempo Real</h2>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  WebSocket Activo
                </Badge>
              </div>
              <MarketDataWebSocket 
                symbols={['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt']}
                className="mb-6"
              />
            </div>
            
            {/* Real Data Charts Section */}
            <RealDataCharts className="mb-6" />

            
            {/* Tables section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent trades table */}
              <Card className="bg-white lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Operaciones recientes</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/portfolio">
                        Ver todos <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estrategia</TableHead>
                        <TableHead>Par</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>P/L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTrades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="font-medium">
                            {trade.strategy}
                          </TableCell>
                          <TableCell>{trade.pair}</TableCell>
                          <TableCell>
                            <Badge variant={trade.type === "BUY" ? "default" : "secondary"}>
                              {trade.type}
                            </Badge>
                          </TableCell>
                          <TableCell>${trade.price.toLocaleString()}</TableCell>
                          <TableCell className={trade.profitLoss >= 0 ? "text-green-500" : "text-red-500"}>
                            <div className="flex items-center">
                              {trade.profitLoss >= 0 ? (
                                <TrendingUp className="mr-1 h-4 w-4" />
                              ) : (
                                <TrendingDown className="mr-1 h-4 w-4" />
                              )}
                              {formatPercentage(trade.profitLossPercent)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              {/* Top strategies table */}
              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Top Estrategias</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/strategies">
                        Ver todos <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topStrategies.map((strategy) => (
                      <div key={strategy.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">{strategy.name}</div>
                          <Badge variant="outline">{strategy.pair}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <div>Win Rate:</div>
                          <div className="font-medium">{strategy.winRate}%</div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <div>P/L:</div>
                          <div className="font-medium text-green-500">
                            +${strategy.profitLoss.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <div>Operaciones:</div>
                          <div className="font-medium">{strategy.trades}</div>
                        </div>
                      </div>
                    ))
                  </div>
                </CardContent>
              </Card>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}