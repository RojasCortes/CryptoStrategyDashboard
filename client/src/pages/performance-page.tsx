import { useState } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Trade, Strategy } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Settings,
  AlertCircle,
  LineChart,
  Target,
  Activity,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#94a3b8"];

export default function PerformancePage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useFirebaseAuth();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");

  const { data: strategies = [], isLoading: isLoadingStrategies } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
    enabled: !!user,
  });

  const { data: trades = [], isLoading: isLoadingTrades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    enabled: !!user,
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const hasApiKeys = user?.apiKey && user?.apiSecret;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor inicia sesión para acceder al análisis de rendimiento.</p>
      </div>
    );
  }

  const isLoading = isLoadingStrategies || isLoadingTrades;

  const calculateStats = () => {
    if (trades.length === 0) {
      return {
        totalProfit: 0,
        totalTrades: 0,
        winRate: 0,
        avgProfit: 0,
        winningTrades: 0,
      };
    }

    const completedTrades = trades.filter(t => t.status === 'completed');
    const profitableTrades = completedTrades.filter(t => (t.profitLoss || 0) > 0);
    const totalProfit = completedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    
    return {
      totalProfit,
      totalTrades: completedTrades.length,
      winRate: completedTrades.length > 0 ? (profitableTrades.length / completedTrades.length) * 100 : 0,
      avgProfit: completedTrades.length > 0 ? totalProfit / completedTrades.length : 0,
      winningTrades: profitableTrades.length,
    };
  };

  const stats = calculateStats();

  const getStrategyPerformance = () => {
    if (strategies.length === 0 || trades.length === 0) return [];
    
    return strategies.map(strategy => {
      const strategyTrades = trades.filter(t => t.strategyId === strategy.id && t.status === 'completed');
      const profitableTrades = strategyTrades.filter(t => (t.profitLoss || 0) > 0);
      const totalProfit = strategyTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
      
      return {
        id: strategy.id,
        name: strategy.name,
        trades: strategyTrades.length,
        winRate: strategyTrades.length > 0 ? (profitableTrades.length / strategyTrades.length) * 100 : 0,
        profit: totalProfit,
        isActive: strategy.isActive,
      };
    });
  };

  const strategyPerformance = getStrategyPerformance();

  return (
    <div className="flex h-screen bg-muted/10">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5">
          <div className="max-w-7xl mx-auto">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Análisis de Rendimiento</h1>
                <p className="text-muted-foreground mt-1">
                  Seguimiento de estrategias y análisis de resultados
                </p>
              </div>
              
              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <Select
                  defaultValue={selectedTimeframe}
                  onValueChange={setSelectedTimeframe}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="90d">Últimos 90 días</SelectItem>
                    <SelectItem value="6m">Últimos 6 meses</SelectItem>
                    <SelectItem value="1y">Último año</SelectItem>
                    <SelectItem value="all">Todo el historial</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>
            
            {!hasApiKeys && (
              <Alert className="mb-6 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Claves API no configuradas</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Para ver datos de rendimiento reales de tu cuenta de Binance, necesitas configurar tus claves API.
                  Las estadísticas mostradas se basarán en tus estrategias y trades registrados en la aplicación.
                </AlertDescription>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => window.location.href = "/settings"}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar API Keys
                </Button>
              </Alert>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="bg-white">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : trades.length === 0 && strategies.length === 0 ? (
              <Card className="bg-white mb-6">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Sin datos de rendimiento</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    Aún no tienes estrategias ni trades registrados. Crea una estrategia de trading para comenzar a ver estadísticas de rendimiento.
                  </p>
                  <Button onClick={() => window.location.href = "/strategies"}>
                    <Target className="h-4 w-4 mr-2" />
                    Crear Estrategia
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Beneficio Total
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(stats.totalProfit)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats.totalTrades} operaciones completadas
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Tasa de Éxito
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.winRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats.winningTrades} de {stats.totalTrades} operaciones
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Promedio por Operación
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${stats.avgProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(stats.avgProfit)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Por trade completado
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Estrategias Activas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {strategies.filter(s => s.isActive).length}/{strategies.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Estrategias configuradas
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {strategies.length > 0 && (
                  <Card className="bg-white mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        Rendimiento por Estrategia
                      </CardTitle>
                      <CardDescription>
                        Métricas detalladas de cada estrategia de trading
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {strategyPerformance.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <LineChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No hay datos de rendimiento disponibles para las estrategias.</p>
                          <p className="text-sm">Ejecuta trades para ver estadísticas.</p>
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Estrategia</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Trades</TableHead>
                                <TableHead className="text-right">Win Rate</TableHead>
                                <TableHead className="text-right">Beneficio</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {strategyPerformance.map((strategy) => (
                                <TableRow key={strategy.id}>
                                  <TableCell className="font-medium">{strategy.name}</TableCell>
                                  <TableCell>
                                    <Badge variant={strategy.isActive ? "default" : "secondary"}>
                                      {strategy.isActive ? "Activa" : "Inactiva"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">{strategy.trades}</TableCell>
                                  <TableCell className="text-right">
                                    {strategy.trades > 0 ? `${strategy.winRate.toFixed(1)}%` : '-'}
                                  </TableCell>
                                  <TableCell className={`text-right font-medium ${strategy.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {strategy.trades > 0 ? formatCurrency(strategy.profit) : '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {trades.length > 0 && (
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Historial de Trades Recientes
                      </CardTitle>
                      <CardDescription>
                        Últimas 10 operaciones realizadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Par</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Cantidad</TableHead>
                              <TableHead className="text-right">Precio</TableHead>
                              <TableHead className="text-right">Beneficio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {trades.slice(0, 10).map((trade) => (
                              <TableRow key={trade.id}>
                                <TableCell className="font-medium">{trade.pair}</TableCell>
                                <TableCell>
                                  <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'}>
                                    {trade.type === 'buy' ? 'Compra' : 'Venta'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={trade.status === 'completed' ? 'outline' : 'secondary'}>
                                    {trade.status === 'completed' ? 'Completado' : trade.status === 'pending' ? 'Pendiente' : trade.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">{trade.amount}</TableCell>
                                <TableCell className="text-right">{formatCurrency(trade.price)}</TableCell>
                                <TableCell className={`text-right font-medium ${(trade.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {trade.profitLoss !== null ? formatCurrency(trade.profitLoss) : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
