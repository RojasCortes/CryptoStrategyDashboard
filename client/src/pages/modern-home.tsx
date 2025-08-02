import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SimpleMarketData } from "@/components/simple-market-data";
import { 
  Menu, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Activity, 
  Target,
  Zap,
  Shield,
  Wallet,
  Settings,
  Bell,
  Home,
  X,
  PieChart,
  BarChart3,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  RefreshCw
} from "lucide-react";

export default function ModernHomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  
  const { data: strategies = [], isLoading: isStrategiesLoading } = useQuery({
    queryKey: ["/api/strategies"],
    retry: 1,
    enabled: !!user,
    staleTime: 30000,
  });

  const { data: trades = [], isLoading: isTradesLoading } = useQuery({
    queryKey: ["/api/trades"],
    retry: 1,
    enabled: !!user,
    staleTime: 30000,
  });

  if (!user || isStrategiesLoading || isTradesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

  const portfolioStats = {
    totalBalance: 45231.89,
    todayPnL: 1247.32,
    todayPnLPercent: 2.84,
    activeStrategies: strategies.length || 4,
    winRate: 73.2
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Crypto Trading</h1>
              <p className="text-xs opacity-80">Dashboard Pro</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:bg-white hover:bg-opacity-20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.username}
              </p>
              <p className="text-xs text-gray-500">Trader Premium</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-gray-400 hover:text-gray-600"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-6 px-4 space-y-2">
          <div className="flex items-center px-4 py-3 text-blue-700 bg-blue-50 rounded-xl border-l-4 border-blue-500 cursor-pointer">
            <Home className="mr-3 h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </div>
          <div className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all cursor-pointer group">
            <Wallet className="mr-3 h-5 w-5 group-hover:text-blue-500" />
            <span>Portfolio</span>
          </div>
          <div className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all cursor-pointer group">
            <Target className="mr-3 h-5 w-5 group-hover:text-blue-500" />
            <span>Estrategias</span>
          </div>
          <div className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all cursor-pointer group">
            <BarChart3 className="mr-3 h-5 w-5 group-hover:text-blue-500" />
            <span>Análisis</span>
          </div>
          <div className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all cursor-pointer group">
            <PieChart className="mr-3 h-5 w-5 group-hover:text-blue-500" />
            <span>Rendimiento</span>
          </div>
          <div className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all cursor-pointer group">
            <Shield className="mr-3 h-5 w-5 group-hover:text-blue-500" />
            <span>Configuración</span>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-6 left-4 right-4">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">
                  {formatPercentage(portfolioStats.todayPnLPercent)}
                </div>
                <div className="text-xs text-green-600">Ganancia hoy</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {greeting}, {user.username}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Aquí tienes tu resumen de trading de hoy
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Bell className="mr-2 h-4 w-4" />
                  Alertas
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Nueva Estrategia</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-8">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Balance Total</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(portfolioStats.totalBalance)}</p>
                  </div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm text-blue-100">+23.1% total</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">P&L Hoy</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(portfolioStats.todayPnL)}</p>
                  </div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm text-green-100">{formatPercentage(portfolioStats.todayPnLPercent)} hoy</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">Estrategias Activas</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">{portfolioStats.activeStrategies}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    En funcionamiento
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">Win Rate</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">{portfolioStats.winRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${portfolioStats.winRate}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Data Section */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Mercado en Tiempo Real</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Datos actualizados desde Binance</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Live Data
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <SimpleMarketData 
                symbols={['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT']}
              />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Actions */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span>Acciones Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start h-14 bg-blue-600 hover:bg-blue-700" onClick={() => console.log('Nueva estrategia')}>
                  <Plus className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Nueva Estrategia</div>
                    <div className="text-xs opacity-80">Crear estrategia de trading</div>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-14" onClick={() => console.log('Ver portfolio')}>
                  <Eye className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Ver Portfolio</div>
                    <div className="text-xs text-gray-500">Revisar posiciones</div>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-14" onClick={() => console.log('Configurar API')}>
                  <Settings className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">API Settings</div>
                    <div className="text-xs text-gray-500">Configurar Binance</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Resumen de Rendimiento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total de Operaciones</span>
                      <span className="font-semibold">247</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Operaciones Ganadoras</span>
                      <span className="font-semibold text-green-600">181</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Operaciones Perdedoras</span>
                      <span className="font-semibold text-red-600">66</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ganancia Promedio</span>
                      <span className="font-semibold text-green-600">+$234.56</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pérdida Promedio</span>
                      <span className="font-semibold text-red-600">-$89.12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Mejor Día</span>
                      <span className="font-semibold text-green-600">+$1,234.89</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </main>
      </div>
    </div>
  );
}