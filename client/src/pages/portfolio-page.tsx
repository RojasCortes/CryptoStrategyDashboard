import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBinanceData } from "@/hooks/use-binance";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPercentage } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  RefreshCw,
  ArrowDownUp,
  PieChart,
  DollarSign,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { CryptoIcon } from "@/components/crypto-icon";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

// Types for portfolio data
interface Asset {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  price: number;
  change24h: number;
  lastUpdated: string;
}

interface PortfolioOverview {
  totalValue: number;
  dayChange: number;
  dayChangePercentage: number;
  weekChange: number;
  weekChangePercentage: number;
  monthChange: number;
  monthChangePercentage: number;
  allTimeProfit: number;
  allTimeProfitPercentage: number;
}

interface HistoricalData {
  date: string;
  value: number;
}

// Mock data (would be replaced with API data in production)
const API_DATA = {
  assets: [
    { symbol: "BTC", name: "Bitcoin", amount: 0.5, value: 25000, price: 50000, change24h: 3.5, lastUpdated: new Date().toISOString() },
    { symbol: "ETH", name: "Ethereum", amount: 5, value: 15000, price: 3000, change24h: -1.2, lastUpdated: new Date().toISOString() },
    { symbol: "SOL", name: "Solana", amount: 50, value: 7500, price: 150, change24h: 7.8, lastUpdated: new Date().toISOString() },
    { symbol: "BNB", name: "Binance Coin", amount: 10, value: 5000, price: 500, change24h: 0.5, lastUpdated: new Date().toISOString() },
    { symbol: "ADA", name: "Cardano", amount: 2000, value: 2500, price: 1.25, change24h: -2.3, lastUpdated: new Date().toISOString() },
  ],
  overview: {
    totalValue: 55000,
    dayChange: 1200,
    dayChangePercentage: 2.2,
    weekChange: 3500,
    weekChangePercentage: 6.8,
    monthChange: 7500,
    monthChangePercentage: 15.8,
    allTimeProfit: 12000,
    allTimeProfitPercentage: 27.9,
  },
  historicalData: [
    { date: "2023-01-01", value: 35000 },
    { date: "2023-02-01", value: 38000 },
    { date: "2023-03-01", value: 36000 },
    { date: "2023-04-01", value: 40000 },
    { date: "2023-05-01", value: 42000 },
    { date: "2023-06-01", value: 41000 },
    { date: "2023-07-01", value: 45000 },
    { date: "2023-08-01", value: 47000 },
    { date: "2023-09-01", value: 49000 },
    { date: "2023-10-01", value: 52000 },
    { date: "2023-11-01", value: 51000 },
    { date: "2023-12-01", value: 55000 },
  ],
};

// Colors for the pie chart
const COLORS = ["#3498db", "#2ecc71", "#f1c40f", "#e74c3c", "#9b59b6", "#1abc9c"];

export default function PortfolioPage(): JSX.Element {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const { toast } = useToast();
  const { marketData = [], isLoading: isLoadingMarketData } = useBinanceData();
  const [timeframe, setTimeframe] = useState<string>("1month");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // This would be a real API call in production
  const { data, isLoading, isError, refetch } = useQuery<{
    assets: Asset[];
    overview: PortfolioOverview;
    historicalData: HistoricalData[];
  }>({
    queryKey: ["/api/portfolio"],
    // In a real app we'd use the data from the API
    // For now, simulate a response
    queryFn: async () => {
      return API_DATA;
    },
    enabled: !!user,
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
    toast({
      title: "Datos de portafolio actualizados",
      description: "La información de tu portafolio ha sido actualizada.",
    });
  };

  // If no API keys are set up, we should show a warning
  const hasApiKeys = user?.apiKey && user?.apiSecret;

  const historicalData = data?.historicalData || [];
  const portfolioOverview = data?.overview || {
    totalValue: 0,
    dayChange: 0,
    dayChangePercentage: 0,
    weekChange: 0,
    weekChangePercentage: 0,
    monthChange: 0,
    monthChangePercentage: 0,
    allTimeProfit: 0,
    allTimeProfitPercentage: 0,
  };
  const assets = data?.assets || [];

  // Calculate allocation percentages for the pie chart
  const assetAllocation = assets.map((asset) => ({
    name: asset.symbol,
    value: asset.value,
    percentage: (asset.value / portfolioOverview.totalValue) * 100,
  }));

  // Format date for X-axis of chart
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-muted/30">
        <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppBar toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="space-y-6">
                <Skeleton className="h-[200px] w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-[120px]" />
                  <Skeleton className="h-[120px]" />
                  <Skeleton className="h-[120px]" />
                </div>
                <Skeleton className="h-[400px] w-full" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor, inicia sesión para acceder a tu portafolio.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            
            {!hasApiKeys && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Claves API no configuradas</AlertTitle>
                <AlertDescription>
                  No has configurado tus claves API de Binance. Ve a la página de configuración para configurar tus claves API.
                </AlertDescription>
                <Button variant="outline" className="mt-2" onClick={() => window.location.href = "/settings"}>
                  Ir a Configuración
                </Button>
              </Alert>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold">Resumen del Portafolio</h1>
                <p className="text-muted-foreground">
                  Valor Total: {formatCurrency(portfolioOverview.totalValue)}
                </p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="mt-2 md:mt-0"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cambio 24h</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    {portfolioOverview.dayChange >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <div>
                      <p className={`text-2xl font-bold ${portfolioOverview.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(portfolioOverview.dayChange)}
                      </p>
                      <p className={`text-sm ${portfolioOverview.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercentage(portfolioOverview.dayChangePercentage)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Wallet className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(portfolioOverview.totalValue)}</p>
                      <p className="text-sm text-muted-foreground">
                        {assets.length} activo{assets.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ganancia Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    {portfolioOverview.allTimeProfit >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <div>
                      <p className={`text-2xl font-bold ${portfolioOverview.allTimeProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(portfolioOverview.allTimeProfit)}
                      </p>
                      <p className={`text-sm ${portfolioOverview.allTimeProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercentage(portfolioOverview.allTimeProfitPercentage)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="md:col-span-2 h-auto">
                <CardHeader>
                  <CardTitle>Valor del Portafolio</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant={timeframe === "7days" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setTimeframe("7days")}
                    >
                      7D
                    </Button>
                    <Button 
                      variant={timeframe === "1month" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setTimeframe("1month")}
                    >
                      1M
                    </Button>
                    <Button 
                      variant={timeframe === "3months" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setTimeframe("3months")}
                    >
                      3M
                    </Button>
                    <Button 
                      variant={timeframe === "1year" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setTimeframe("1year")}
                    >
                      1Y
                    </Button>
                    <Button 
                      variant={timeframe === "all" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setTimeframe("all")}
                    >
                      Todo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={historicalData}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate} 
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Valor del Portafolio']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3498db" 
                          fill="#3498db" 
                          fillOpacity={0.3} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={assetAllocation}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {assetAllocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Valor']}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Leyenda personalizada con íconos */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {assetAllocation.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <div className="flex items-center gap-1">
                          <CryptoIcon symbol={entry.name} size={16} />
                          <span className="text-sm">{entry.name}</span>
                        </div>
                        <span className="text-sm ml-auto font-medium">{entry.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Cambio 24h</TableHead>
                      <TableHead>Distribución</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.symbol}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="mr-2 w-8 h-8 flex items-center justify-center">
                              <CryptoIcon symbol={asset.symbol} size={28} />
                            </div>
                            <div>
                              <div>{asset.name}</div>
                              <div className="text-muted-foreground text-xs">{asset.symbol}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{asset.amount.toLocaleString()}</TableCell>
                        <TableCell>${asset.price.toLocaleString()}</TableCell>
                        <TableCell>${asset.value.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(asset.value / portfolioOverview.totalValue) * 100} 
                              className="h-2"
                            />
                            <span className="text-xs">
                              {((asset.value / portfolioOverview.totalValue) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
          </div>
        </main>
      </div>
    </div>
  );
}