import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBinanceData } from "@/hooks/use-binance";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Trade, Strategy } from "@shared/schema";

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
  RefreshCw,
  Filter,
  CalendarRange,
  Clock,
  PieChart,
  LineChart,
  DollarSign,
  Calendar,
  ArrowRight,
  ArrowUpDown,
  Download,
  Zap,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Mock performance data
const monthlyPerformance = [
  { month: "Ene", profit: 2100, trades: 28 },
  { month: "Feb", profit: 1800, trades: 24 },
  { month: "Mar", profit: 3200, trades: 35 },
  { month: "Abr", profit: 2700, trades: 30 },
  { month: "May", profit: 3800, trades: 42 },
  { month: "Jun", profit: 2500, trades: 28 },
  { month: "Jul", profit: 4200, trades: 45 },
  { month: "Ago", profit: 3600, trades: 38 },
  { month: "Sep", profit: 5100, trades: 52 },
  { month: "Oct", profit: 4800, trades: 48 },
  { month: "Nov", profit: 5500, trades: 55 },
  { month: "Dic", profit: 6200, trades: 60 },
];

// Mock strategy performance metrics
const strategyPerformance = [
  { name: "MACD Crossover", roi: 24.5, trades: 145, winRate: 68, profitFactor: 2.8, sharpeRatio: 1.8 },
  { name: "RSI Oversold", roi: 18.2, trades: 92, winRate: 72, profitFactor: 3.1, sharpeRatio: 1.6 },
  { name: "Moving Average", roi: 12.8, trades: 76, winRate: 62, profitFactor: 2.2, sharpeRatio: 1.3 },
  { name: "Bollinger Bands", roi: 16.5, trades: 103, winRate: 65, profitFactor: 2.5, sharpeRatio: 1.5 },
  { name: "Grid Trading", roi: 21.3, trades: 280, winRate: 58, profitFactor: 1.9, sharpeRatio: 1.7 },
];

// Mock asset allocation data
const assetAllocation = [
  { name: "BTC", value: 35 },
  { name: "ETH", value: 25 },
  { name: "SOL", value: 15 },
  { name: "BNB", value: 10 },
  { name: "ADA", value: 8 },
  { name: "Otros", value: 7 },
];

// Mock trade performance by pair
const tradePairs = [
  { pair: "BTC/USDT", trades: 124, winRate: 67, averageProfit: 210, totalProfit: 26040 },
  { pair: "ETH/USDT", trades: 98, winRate: 71, averageProfit: 175, totalProfit: 17150 },
  { pair: "SOL/USDT", trades: 86, winRate: 64, averageProfit: 140, totalProfit: 12040 },
  { pair: "BNB/USDT", trades: 65, winRate: 60, averageProfit: 110, totalProfit: 7150 },
  { pair: "ADA/USDT", trades: 52, winRate: 58, averageProfit: 95, totalProfit: 4940 },
];

// Mock radar data for strategy comparison
const strategyRadarData = [
  {
    subject: "ROI",
    "MACD Crossover": 80,
    "RSI Oversold": 65,
    "Moving Average": 45,
    "Bollinger Bands": 60,
    "Grid Trading": 75,
    fullMark: 100,
  },
  {
    subject: "Win Rate",
    "MACD Crossover": 68,
    "RSI Oversold": 72,
    "Moving Average": 62,
    "Bollinger Bands": 65,
    "Grid Trading": 58,
    fullMark: 100,
  },
  {
    subject: "Profit Factor",
    "MACD Crossover": 75,
    "RSI Oversold": 85,
    "Moving Average": 60,
    "Bollinger Bands": 70,
    "Grid Trading": 55,
    fullMark: 100,
  },
  {
    subject: "Trade Frequency",
    "MACD Crossover": 70,
    "RSI Oversold": 50,
    "Moving Average": 40,
    "Bollinger Bands": 55,
    "Grid Trading": 90,
    fullMark: 100,
  },
  {
    subject: "Risk/Reward",
    "MACD Crossover": 75,
    "RSI Oversold": 80,
    "Moving Average": 65,
    "Bollinger Bands": 70,
    "Grid Trading": 60,
    fullMark: 100,
  },
];

// Colors for charts
const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#94a3b8"];

export default function PerformancePage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");

  // Fetch strategies data
  const { data: strategies = [], isLoading: isLoadingStrategies } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
    enabled: !!user,
  });

  // Fetch trades
  const { data: trades = [], isLoading: isLoadingTrades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    enabled: !!user,
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor inicia sesión para acceder al análisis de rendimiento.</p>
      </div>
    );
  }

  // Summary statistics
  const totalProfit = 41000;
  const totalTrades = 556;
  const totalWinRate = 67;
  const averageReturnPerTrade = totalProfit / totalTrades;
  const monthlyAverageReturn = totalProfit / 12;

  return (
    <div className="flex h-screen bg-muted/10">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5">
          <div className="max-w-7xl mx-auto">
            
            {/* Page Header */}
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
            
            {/* Performance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Beneficio Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalProfit)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(monthlyAverageReturn)} mensuales
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Operaciones Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalTrades}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(averageReturnPerTrade)} por operación
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Porcentaje de Victorias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalWinRate}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(totalTrades * (totalWinRate / 100))} operaciones ganadoras
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
                    {strategies.filter(s => s.isActive).length || 5}/{strategies.length || 5}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {strategies.length === 0 ? "5" : strategies.length} estrategias configuradas
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Mejor Estrategia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-bold truncate">
                    MACD Crossover
                  </div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+24.5%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Profit Performance Chart & Asset Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="bg-white lg:col-span-2">
                <CardHeader>
                  <CardTitle>Rendimiento por Mes</CardTitle>
                  <CardDescription>
                    Beneficios y número de operaciones por mes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyPerformance}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tickFormatter={(value) => `$${value}`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                        <RechartsTooltip 
                          formatter={(value, name) => {
                            if (name === "profit") return [`$${value}`, "Beneficio"];
                            return [value, "Operaciones"];
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="profit" name="Beneficio" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="trades" name="Operaciones" stroke="#22c55e" strokeWidth={2} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Distribución por Activo</CardTitle>
                  <CardDescription>
                    Porcentaje de asignación por criptomoneda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={assetAllocation}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          fill="#8884d8"
                          paddingAngle={1}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {assetAllocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value) => [`${value}%`, 'Asignación']}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Strategy Performance Table */}
            <Card className="bg-white mb-6">
              <CardHeader>
                <CardTitle>Rendimiento por Estrategia</CardTitle>
                <CardDescription>
                  Métricas detalladas para cada estrategia de trading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estrategia</TableHead>
                        <TableHead>ROI</TableHead>
                        <TableHead>Operaciones</TableHead>
                        <TableHead>Win Rate</TableHead>
                        <TableHead>Factor de Beneficio</TableHead>
                        <TableHead>Ratio Sharpe</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {strategyPerformance.map((strategy) => (
                        <TableRow key={strategy.name}>
                          <TableCell className="font-medium">{strategy.name}</TableCell>
                          <TableCell className="text-green-600">+{strategy.roi}%</TableCell>
                          <TableCell>{strategy.trades}</TableCell>
                          <TableCell>{strategy.winRate}%</TableCell>
                          <TableCell>{strategy.profitFactor}</TableCell>
                          <TableCell>{strategy.sharpeRatio}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Detalles <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
            {/* Performance by Trading Pair & Strategy Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Rendimiento por Par</CardTitle>
                  <CardDescription>
                    Rendimiento por par de trading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={tradePairs}
                        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                        <YAxis type="category" dataKey="pair" />
                        <RechartsTooltip 
                          formatter={(value, name) => {
                            if (name === "totalProfit") return [`$${value}`, "Beneficio Total"];
                            if (name === "averageProfit") return [`$${value}`, "Beneficio Promedio"];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="totalProfit" fill="#3b82f6" name="Beneficio Total" />
                        <Bar dataKey="averageProfit" fill="#22c55e" name="Beneficio Promedio" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Comparación de Estrategias</CardTitle>
                  <CardDescription>
                    Análisis comparativo de las principales estrategias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius={120} data={strategyRadarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="MACD Crossover" dataKey="MACD Crossover" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                        <Radar name="RSI Oversold" dataKey="RSI Oversold" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                        <Radar name="Grid Trading" dataKey="Grid Trading" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Monthly ROI Progress */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Progreso de ROI Mensual</CardTitle>
                <CardDescription>
                  Seguimiento del retorno de inversión acumulado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { month: "Ene", roi: 2.5 },
                        { month: "Feb", roi: 4.2 },
                        { month: "Mar", roi: 7.1 },
                        { month: "Abr", roi: 9.5 },
                        { month: "May", roi: 12.8 },
                        { month: "Jun", roi: 15.0 },
                        { month: "Jul", roi: 18.5 },
                        { month: "Ago", roi: 21.7 },
                        { month: "Sep", roi: 25.8 },
                        { month: "Oct", roi: 29.2 },
                        { month: "Nov", roi: 33.5 },
                        { month: "Dic", roi: 38.2 },
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <RechartsTooltip formatter={(value) => [`${value}%`, 'ROI']} />
                      <Area 
                        type="monotone" 
                        dataKey="roi" 
                        stroke="#3b82f6" 
                        fillOpacity={1}
                        fill="url(#colorRoi)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar informe
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}