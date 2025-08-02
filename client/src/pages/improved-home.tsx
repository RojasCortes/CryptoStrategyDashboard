import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { SimpleMarketData } from "@/components/simple-market-data";
import { RealDataCharts } from "@/components/real-data-charts";
import { 
  Menu, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Activity, 
  Users,
  RefreshCw,
  CheckCircle,
  ChevronRight,
  BarChart3,
  Target,
  Zap,
  Shield,
  Globe,
  Wallet,
  Settings,
  Bell,
  Home,
  X
} from "lucide-react";

// Mock data for demonstration
const recentTrades = [
  { 
    id: 1, 
    strategy: "MACD Crossover", 
    pair: "BTC/USDT", 
    type: "BUY", 
    price: 48750, 
    profitLoss: 540,
    profitLossPercent: 4.5
  },
  { 
    id: 2, 
    strategy: "RSI Oversold", 
    pair: "ETH/USDT", 
    type: "BUY", 
    price: 2980, 
    profitLoss: 275,
    profitLossPercent: 3.7
  },
  { 
    id: 3, 
    strategy: "Grid Trading", 
    pair: "SOL/USDT", 
    type: "SELL", 
    price: 142, 
    profitLoss: -180,
    profitLossPercent: -5.1
  },
];

const topStrategies = [
  { id: 1, name: "MACD Crossover", pair: "BTC/USDT", profitLoss: 4350, trades: 24, winRate: 75, status: "active" },
  { id: 2, name: "RSI Oversold", pair: "ETH/USDT", profitLoss: 3120, trades: 18, winRate: 72, status: "active" },
  { id: 3, name: "Grid Trading", pair: "SOL/USDT", profitLoss: 2890, trades: 42, winRate: 65, status: "paused" },
];

const formatPercentage = (value: number) => {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

export default function ImprovedHomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: strategies = [], isLoading: isStrategiesLoading } = useQuery({
    queryKey: ["/api/strategies"],
    retry: 1,
    enabled: !!user,
  });

  const { data: trades = [], isLoading: isTradesLoading } = useQuery({
    queryKey: ["/api/trades"],
    retry: 1,
    enabled: !!user,
  });

  // Loading state
  if (isStrategiesLoading || isTradesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const currentHour = new Date().getHours();
  let greeting = "Buenos días";
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Buenas tardes";
  } else if (currentHour >= 18) {
    greeting = "Buenas noches";
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const portfolioStats = {
    totalBalance: 45231.89,
    todayPnL: 1247.32,
    todayPnLPercent: 2.84,
    activeStrategies: strategies.length || 4,
    winRate: 73.2
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-blue-600">
          <h1 className="text-xl font-bold text-white">Crypto Trading</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:bg-blue-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="mt-8 px-4 space-y-2">
          <a href="/" className="flex items-center px-4 py-3 text-blue-700 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </a>
          <a href="/portfolio" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
            <Wallet className="mr-3 h-5 w-5" />
            Portfolio
          </a>
          <a href="/strategies" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
            <Target className="mr-3 h-5 w-5" />
            Estrategias
          </a>
          <a href="/markets" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
            <Globe className="mr-3 h-5 w-5" />
            Mercados
          </a>
          <a href="/performance" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
            <BarChart3 className="mr-3 h-5 w-5" />
            Rendimiento
          </a>
          <a href="/settings" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
            <Settings className="mr-3 h-5 w-5" />
            Configuración
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="mr-4 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {greeting}, {user?.username}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Resumen de tu actividad de trading
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="mr-2 h-4 w-4" />
                Alertas
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Balance Total</CardTitle>
                <DollarSign className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(portfolioStats.totalBalance)}</div>
                <p className="text-xs opacity-80 mt-1">+23.30% total</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">P&L Hoy</CardTitle>
                <TrendingUp className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(portfolioStats.todayPnL)}</div>
                <p className="text-xs opacity-80 mt-1">{formatPercentage(portfolioStats.todayPnLPercent)} hoy</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estrategias Activas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioStats.activeStrategies}</div>
                <p className="text-xs text-muted-foreground mt-1">En funcionamiento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioStats.winRate}%</div>
                <Progress value={portfolioStats.winRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Market Data */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  Datos de Mercado en Tiempo Real
                </CardTitle>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Datos Reales
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <SimpleMarketData 
                symbols={['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT']}
                className="mb-4"
              />
            </CardContent>
          </Card>

          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Análisis de Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RealDataCharts className="h-96" />
            </CardContent>
          </Card>

          {/* Trading Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Trades */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-500" />
                    Operaciones Recientes
                  </CardTitle>
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
                        <TableCell>{formatCurrency(trade.price)}</TableCell>
                        <TableCell className={trade.profitLoss >= 0 ? "text-green-600" : "text-red-600"}>
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
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Top Strategies */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-500" />
                    Top Estrategias
                  </CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/strategies">
                      Ver todas <ChevronRight className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topStrategies.map((strategy) => (
                    <div key={strategy.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <div className="font-medium">{strategy.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{strategy.pair}</Badge>
                          <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                            {strategy.status === 'active' ? 'Activa' : 'Pausada'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Win Rate:</span>
                          <span className="font-medium">{strategy.winRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">P/L:</span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(strategy.profitLoss)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Operaciones:</span>
                          <span className="font-medium">{strategy.trades}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estado:</span>
                          <span className={`font-medium ${strategy.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                            {strategy.status === 'active' ? 'Ejecutando' : 'Detenida'}
                          </span>
                        </div>
                      </div>
                      <Progress value={strategy.winRate} className="mt-3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="h-20 flex flex-col space-y-2" asChild>
                  <a href="/strategies">
                    <Target className="h-6 w-6" />
                    <span>Nueva Estrategia</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                  <a href="/portfolio">
                    <Wallet className="h-6 w-6" />
                    <span>Ver Portfolio</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                  <a href="/markets">
                    <BarChart3 className="h-6 w-6" />
                    <span>Analizar Mercado</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                  <a href="/settings">
                    <Settings className="h-6 w-6" />
                    <span>Configurar API</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  );
}