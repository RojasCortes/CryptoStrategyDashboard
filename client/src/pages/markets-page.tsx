import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBinanceData } from "@/hooks/use-binance";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { useQuery } from "@tanstack/react-query";
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
  Search,
  RefreshCw,
  Eye,
  Star,
  StarOff,
  ArrowUpDown,
  Filter,
  SlidersHorizontal,
  Clock,
  Info,
  AlertTriangle,
  LineChart,
  BarChart3,
  ArrowDownUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CryptoIcon } from "@/components/crypto-icon";
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
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts";

// Types
interface MarketData {
  symbol: string;
  name: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  marketCap: number;
  volume: number;
  supply: number;
  high24h: number;
  low24h: number;
  ath: number;
  atl: number;
}

// Sample market data
const cryptoMarketData: MarketData[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 45000,
    priceChange: 1200,
    priceChangePercent: 2.74,
    marketCap: 850000000000,
    volume: 28000000000,
    supply: 19000000,
    high24h: 46000,
    low24h: 43500,
    ath: 69000,
    atl: 3000
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 3200,
    priceChange: -75,
    priceChangePercent: -2.29,
    marketCap: 380000000000,
    volume: 16000000000,
    supply: 120000000,
    high24h: 3300,
    low24h: 3100,
    ath: 4800,
    atl: 80
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: 105,
    priceChange: 8,
    priceChangePercent: 8.25,
    marketCap: 45000000000,
    volume: 3500000000,
    supply: 430000000,
    high24h: 108,
    low24h: 97,
    ath: 260,
    atl: 0.5
  },
  {
    symbol: "BNB",
    name: "Binance Coin",
    price: 460,
    priceChange: 15,
    priceChangePercent: 3.37,
    marketCap: 77000000000,
    volume: 2500000000,
    supply: 167000000,
    high24h: 465,
    low24h: 445,
    ath: 690,
    atl: 2.6
  },
  {
    symbol: "ADA",
    name: "Cardano",
    price: 0.55,
    priceChange: -0.02,
    priceChangePercent: -3.51,
    marketCap: 19500000000,
    volume: 950000000,
    supply: 35500000000,
    high24h: 0.57,
    low24h: 0.53,
    ath: 3.1,
    atl: 0.01
  },
  {
    symbol: "XRP",
    name: "Ripple",
    price: 0.63,
    priceChange: 0.03,
    priceChangePercent: 5.01,
    marketCap: 33000000000,
    volume: 2800000000,
    supply: 52500000000,
    high24h: 0.65,
    low24h: 0.60,
    ath: 3.4,
    atl: 0.002
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    price: 8.2,
    priceChange: 0.3,
    priceChangePercent: 3.8,
    marketCap: 9700000000,
    volume: 650000000,
    supply: 1180000000,
    high24h: 8.3,
    low24h: 7.9,
    ath: 55,
    atl: 2.7
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    price: 0.078,
    priceChange: -0.002,
    priceChangePercent: -2.5,
    marketCap: 10500000000,
    volume: 580000000,
    supply: 135000000000,
    high24h: 0.08,
    low24h: 0.076,
    ath: 0.73,
    atl: 0.0001
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    price: 37.5,
    priceChange: 2.4,
    priceChangePercent: 6.8,
    marketCap: 12000000000,
    volume: 970000000,
    supply: 320000000,
    high24h: 38.2,
    low24h: 35.1,
    ath: 146,
    atl: 2.8
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    price: 0.85,
    priceChange: 0.05,
    priceChangePercent: 6.25,
    marketCap: 7800000000,
    volume: 520000000,
    supply: 9200000000,
    high24h: 0.86,
    low24h: 0.80,
    ath: 2.9,
    atl: 0.01
  }
];

// Sample market dominance data for donut chart
const marketDominanceData = [
  { name: "Bitcoin", value: 42.5 },
  { name: "Ethereum", value: 19.2 },
  { name: "Stablecoins", value: 11.4 },
  { name: "BNB", value: 3.8 },
  { name: "XRP", value: 2.6 },
  { name: "Others", value: 20.5 },
];

// Colors for charts
const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#94a3b8"];

// Sample market metrics
const marketMetrics = {
  totalMarketCap: 1950000000000,
  totalVolume24h: 85000000000,
  btcDominance: 42.5,
  activeCoins: 10872,
  marketSentiment: "Neutral",
  fearGreedIndex: 53,
};

// Sample correlation data
const correlationData = [
  { x: 1, y: 3.5, z: 1, name: "BTC" },
  { x: 0.78, y: -2.2, z: 0.8, name: "ETH" },
  { x: 0.65, y: 7.8, z: 0.4, name: "SOL" },
  { x: 0.82, y: 3.1, z: 0.6, name: "BNB" },
  { x: 0.42, y: -3.8, z: 0.2, name: "ADA" },
  { x: 0.51, y: 5.3, z: 0.3, name: "XRP" },
  { x: 0.39, y: 2.8, z: 0.25, name: "DOT" },
  { x: 0.28, y: -2.1, z: 0.15, name: "DOGE" },
  { x: 0.63, y: 5.9, z: 0.35, name: "AVAX" },
  { x: 0.56, y: 5.8, z: 0.3, name: "MATIC" },
];

export default function MarketsPage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const { marketData = [], isLoading: isLoadingMarketData } = useBinanceData();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Filter market data based on search term
  const filteredData = cryptoMarketData.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort function for the table
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const key = sortConfig.key as keyof MarketData;
    
    if (a[key] < b[key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[key] > b[key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

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
        <p>Por favor inicia sesión para acceder al análisis de mercados.</p>
      </div>
    );
  }
  
  // Format number function to handle large values
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
  };

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
                <h1 className="text-3xl font-bold tracking-tight">Análisis de Mercados</h1>
                <p className="text-muted-foreground mt-1">
                  Datos en tiempo real, correlaciones y análisis de criptomonedas
                </p>
              </div>
              
              <div className="flex mt-4 md:mt-0 gap-2">
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
            
            {/* Tabs */}
            <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 md:w-[400px]">
                <TabsTrigger value="overview">Vista general</TabsTrigger>
                <TabsTrigger value="analysis">Análisis</TabsTrigger>
                <TabsTrigger value="correlation">Correlaciones</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="pt-4">
                {/* Market metrics cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Capitalización Total
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${(marketMetrics.totalMarketCap / 1000000000000).toFixed(2)} T
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Volumen 24h: ${(marketMetrics.totalVolume24h / 1000000000).toFixed(2)} B
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Dominancia de Bitcoin
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {marketMetrics.btcDominance}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {marketMetrics.activeCoins.toLocaleString()} criptomonedas activas
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Índice de Miedo y Codicia
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <div className="text-2xl font-bold mr-2">
                          {marketMetrics.fearGreedIndex}
                        </div>
                        <Badge 
                          variant={
                            marketMetrics.fearGreedIndex > 75 ? "destructive" : 
                            marketMetrics.fearGreedIndex > 60 ? "default" : 
                            marketMetrics.fearGreedIndex > 40 ? "secondary" : 
                            marketMetrics.fearGreedIndex > 25 ? "outline" : 
                            "destructive"
                          }
                        >
                          {
                            marketMetrics.fearGreedIndex > 75 ? "Codicia extrema" : 
                            marketMetrics.fearGreedIndex > 60 ? "Codicia" : 
                            marketMetrics.fearGreedIndex > 40 ? "Neutral" : 
                            marketMetrics.fearGreedIndex > 25 ? "Miedo" : 
                            "Miedo extremo"
                          }
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Sentimiento del mercado: {marketMetrics.marketSentiment}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Market dominance and liquidity section */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
                  <Card className="bg-white lg:col-span-3">
                    <CardHeader>
                      <CardTitle>Resumen de Mercado</CardTitle>
                      <CardDescription>
                        Capitalización del mercado por criptomoneda en los últimos 30 días
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={[
                              { date: "01/01", BTC: 850, ETH: 380, BNB: 77, SOL: 45, Others: 598 },
                              { date: "01/05", BTC: 830, ETH: 375, BNB: 73, SOL: 43, Others: 589 },
                              { date: "01/10", BTC: 870, ETH: 390, BNB: 75, SOL: 47, Others: 608 },
                              { date: "01/15", BTC: 900, ETH: 410, BNB: 78, SOL: 51, Others: 621 },
                              { date: "01/20", BTC: 880, ETH: 400, BNB: 76, SOL: 48, Others: 616 },
                              { date: "01/25", BTC: 910, ETH: 420, BNB: 80, SOL: 53, Others: 627 },
                              { date: "01/30", BTC: 950, ETH: 430, BNB: 83, SOL: 56, Others: 631 },
                            ]}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" />
                            <YAxis tickFormatter={(value) => `$${value}B`} />
                            <RechartsTooltip 
                              formatter={(value) => [`$${value}B`, '']}
                              labelFormatter={(label) => `Fecha: ${label}`}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="Others" stackId="1" stroke="#94a3b8" fill="#94a3b8" />
                            <Area type="monotone" dataKey="SOL" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                            <Area type="monotone" dataKey="BNB" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                            <Area type="monotone" dataKey="ETH" stackId="1" stroke="#22c55e" fill="#22c55e" />
                            <Area type="monotone" dataKey="BTC" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Dominancia en el Mercado</CardTitle>
                      <CardDescription>
                        Porcentaje de capitalización de mercado por criptomoneda
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={marketDominanceData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={120}
                              fill="#8884d8"
                              paddingAngle={1}
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                              labelLine={false}
                            >
                              {marketDominanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              formatter={(value) => [`${value}%`, 'Dominancia']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Market data table */}
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <CardTitle>Top Criptomonedas</CardTitle>
                      <div className="relative w-full md:w-[300px] mt-2 md:mt-0">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre o símbolo..."
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">#</TableHead>
                            <TableHead>
                              <Button variant="ghost" className="p-0 font-medium h-auto" onClick={() => requestSort('name')}>
                                Criptomoneda <ArrowUpDown className="ml-1 h-3 w-3" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" className="p-0 font-medium h-auto" onClick={() => requestSort('price')}>
                                Precio <ArrowUpDown className="ml-1 h-3 w-3" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" className="p-0 font-medium h-auto" onClick={() => requestSort('priceChangePercent')}>
                                24h % <ArrowUpDown className="ml-1 h-3 w-3" />
                              </Button>
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                              <Button variant="ghost" className="p-0 font-medium h-auto" onClick={() => requestSort('marketCap')}>
                                Capitalización <ArrowUpDown className="ml-1 h-3 w-3" />
                              </Button>
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                              <Button variant="ghost" className="p-0 font-medium h-auto" onClick={() => requestSort('volume')}>
                                Volumen (24h) <ArrowUpDown className="ml-1 h-3 w-3" />
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedData.length > 0 ? (
                            sortedData.map((crypto, index) => (
                              <TableRow key={crypto.symbol}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="w-7 h-7 flex items-center justify-center mr-2">
                                      <CryptoIcon symbol={crypto.symbol} size={28} />
                                    </div>
                                    <div>
                                      <div className="font-medium">{crypto.name}</div>
                                      <div className="text-xs text-muted-foreground">{crypto.symbol}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{formatCurrency(crypto.price)}</TableCell>
                                <TableCell>
                                  <span className={crypto.priceChangePercent >= 0 ? "text-green-600" : "text-red-600"}>
                                    {formatPercentage(crypto.priceChangePercent)}
                                  </span>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  ${formatNumber(crypto.marketCap)}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  ${formatNumber(crypto.volume)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-6">
                                No se encontraron resultados para "{searchTerm}"
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Mostrando {sortedData.length} de {cryptoMarketData.length} criptomonedas
                    </div>
                    <Button variant="outline" size="sm">
                      Ver todas las criptomonedas
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Analysis Tab */}
              <TabsContent value="analysis" className="pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Análisis de Tendencias</CardTitle>
                      <CardDescription>
                        Rendimiento comparativo de las principales criptomonedas (30 días)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart
                            data={[
                              { date: "01/01", BTC: 0, ETH: 0, SOL: 0, BNB: 0 },
                              { date: "01/05", BTC: -2, ETH: -5, SOL: -8, BNB: -4 },
                              { date: "01/10", BTC: 5, ETH: 2, SOL: 12, BNB: 3 },
                              { date: "01/15", BTC: 8, ETH: 10, SOL: 25, BNB: 6 },
                              { date: "01/20", BTC: 6, ETH: 7, SOL: 20, BNB: 3 },
                              { date: "01/25", BTC: 12, ETH: 15, SOL: 30, BNB: 8 },
                              { date: "01/30", BTC: 15, ETH: 18, SOL: 35, BNB: 10 },
                            ]}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" />
                            <YAxis tickFormatter={(value) => `${value}%`} />
                            <RechartsTooltip
                              formatter={(value) => [`${value}%`, '']}
                              labelFormatter={(label) => `Fecha: ${label}`}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="BTC" stroke="#3b82f6" activeDot={{ r: 8 }} strokeWidth={2} />
                            <Line type="monotone" dataKey="ETH" stroke="#22c55e" activeDot={{ r: 8 }} strokeWidth={2} />
                            <Line type="monotone" dataKey="SOL" stroke="#8b5cf6" activeDot={{ r: 8 }} strokeWidth={2} />
                            <Line type="monotone" dataKey="BNB" stroke="#f59e0b" activeDot={{ r: 8 }} strokeWidth={2} />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Volumen de Operaciones</CardTitle>
                      <CardDescription>
                        Volumen diario de operaciones en billones de dólares
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { date: "01/01", volume: 75 },
                              { date: "01/05", volume: 82 },
                              { date: "01/10", volume: 88 },
                              { date: "01/15", volume: 95 },
                              { date: "01/20", volume: 85 },
                              { date: "01/25", volume: 92 },
                              { date: "01/30", volume: 98 },
                            ]}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" />
                            <YAxis tickFormatter={(value) => `$${value}B`} />
                            <RechartsTooltip
                              formatter={(value) => [`$${value}B`, 'Volumen']}
                              labelFormatter={(label) => `Fecha: ${label}`}
                            />
                            <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Indicadores técnicos</CardTitle>
                      <CardDescription>
                        Resumen de los principales indicadores técnicos por criptomoneda
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Símbolo</TableHead>
                              <TableHead>RSI (14)</TableHead>
                              <TableHead>MACD</TableHead>
                              <TableHead>MA (50)</TableHead>
                              <TableHead>MA (200)</TableHead>
                              <TableHead>BB (20)</TableHead>
                              <TableHead>Señal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">BTC</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className="mr-2">63</span>
                                  <Badge variant="outline">Sobrecompra</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-green-600">Alcista</TableCell>
                              <TableCell className="text-green-600">Por encima</TableCell>
                              <TableCell className="text-green-600">Por encima</TableCell>
                              <TableCell>Superior</TableCell>
                              <TableCell>
                                <Badge variant="default">Comprar</Badge>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">ETH</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className="mr-2">45</span>
                                  <Badge variant="outline">Neutral</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-red-600">Bajista</TableCell>
                              <TableCell className="text-red-600">Por debajo</TableCell>
                              <TableCell className="text-green-600">Por encima</TableCell>
                              <TableCell>Medio</TableCell>
                              <TableCell>
                                <Badge variant="secondary">Neutral</Badge>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">SOL</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className="mr-2">72</span>
                                  <Badge variant="outline">Sobrecompra</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-green-600">Alcista</TableCell>
                              <TableCell className="text-green-600">Por encima</TableCell>
                              <TableCell className="text-green-600">Por encima</TableCell>
                              <TableCell>Superior</TableCell>
                              <TableCell>
                                <Badge variant="default">Comprar</Badge>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">BNB</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className="mr-2">54</span>
                                  <Badge variant="outline">Neutral</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-green-600">Alcista</TableCell>
                              <TableCell className="text-green-600">Por encima</TableCell>
                              <TableCell className="text-green-600">Por encima</TableCell>
                              <TableCell>Medio</TableCell>
                              <TableCell>
                                <Badge variant="default">Comprar</Badge>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">ADA</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className="mr-2">30</span>
                                  <Badge variant="destructive">Sobreventa</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-red-600">Bajista</TableCell>
                              <TableCell className="text-red-600">Por debajo</TableCell>
                              <TableCell className="text-red-600">Por debajo</TableCell>
                              <TableCell>Inferior</TableCell>
                              <TableCell>
                                <Badge variant="destructive">Vender</Badge>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Correlation Tab */}
              <TabsContent value="correlation" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Correlación con Bitcoin</CardTitle>
                      <CardDescription>
                        Grado de correlación de las principales criptomonedas con BTC
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart
                            margin={{
                              top: 20,
                              right: 20,
                              bottom: 20,
                              left: 20,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" dataKey="x" name="Correlación" domain={[0, 1]} />
                            <YAxis type="number" dataKey="y" name="Rendimiento 30d %" domain={[-10, 10]} />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} />
                            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={
                              ({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 border rounded-lg shadow-sm">
                                      <p className="font-medium">{payload[0].payload.name}</p>
                                      <p>Correlación con BTC: {payload[0].value.toFixed(2)}</p>
                                      <p>Rendimiento 30d: {payload[0].payload.y.toFixed(2)}%</p>
                                    </div>
                                  );
                                }
                                return null;
                              }
                            } />
                            <Legend />
                            {correlationData.map((entry, index) => (
                              <Scatter key={index} name={entry.name} data={[entry]} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Matriz de Correlación</CardTitle>
                      <CardDescription>
                        Correlación entre las principales criptomonedas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]"></TableHead>
                              <TableHead>BTC</TableHead>
                              <TableHead>ETH</TableHead>
                              <TableHead>SOL</TableHead>
                              <TableHead>BNB</TableHead>
                              <TableHead>ADA</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">BTC</TableCell>
                              <TableCell className="bg-blue-100">1.00</TableCell>
                              <TableCell>0.78</TableCell>
                              <TableCell>0.65</TableCell>
                              <TableCell>0.82</TableCell>
                              <TableCell>0.42</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">ETH</TableCell>
                              <TableCell>0.78</TableCell>
                              <TableCell className="bg-blue-100">1.00</TableCell>
                              <TableCell>0.71</TableCell>
                              <TableCell>0.69</TableCell>
                              <TableCell>0.48</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">SOL</TableCell>
                              <TableCell>0.65</TableCell>
                              <TableCell>0.71</TableCell>
                              <TableCell className="bg-blue-100">1.00</TableCell>
                              <TableCell>0.58</TableCell>
                              <TableCell>0.45</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">BNB</TableCell>
                              <TableCell>0.82</TableCell>
                              <TableCell>0.69</TableCell>
                              <TableCell>0.58</TableCell>
                              <TableCell className="bg-blue-100">1.00</TableCell>
                              <TableCell>0.39</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">ADA</TableCell>
                              <TableCell>0.42</TableCell>
                              <TableCell>0.48</TableCell>
                              <TableCell>0.45</TableCell>
                              <TableCell>0.39</TableCell>
                              <TableCell className="bg-blue-100">1.00</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-4 text-xs text-muted-foreground">
                        <p>Interpretación:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>1.00: Correlación perfecta</li>
                          <li>0.70-0.99: Correlación fuerte</li>
                          <li>0.50-0.69: Correlación moderada</li>
                          <li>0.30-0.49: Correlación débil</li>
                          <li>0.00-0.29: Correlación muy débil o nula</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Correlación con Activos Tradicionales</CardTitle>
                    <CardDescription>
                      Relación entre criptomonedas y mercados tradicionales
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col space-y-1.5 p-4 border rounded-lg">
                          <h3 className="text-sm font-medium">BTC - S&P 500</h3>
                          <div className="text-2xl font-bold">0.32</div>
                          <Badge variant="outline" className="w-fit">Correlación Débil</Badge>
                          <p className="text-xs text-muted-foreground mt-2">
                            Bitcoin ha mostrado una correlación creciente con el mercado de valores en los últimos 6 meses.
                          </p>
                        </div>
                        <div className="flex flex-col space-y-1.5 p-4 border rounded-lg">
                          <h3 className="text-sm font-medium">BTC - Oro</h3>
                          <div className="text-2xl font-bold">0.18</div>
                          <Badge variant="outline" className="w-fit">Correlación Muy Débil</Badge>
                          <p className="text-xs text-muted-foreground mt-2">
                            A pesar de ser llamado "oro digital", BTC muestra poca correlación con el oro físico.
                          </p>
                        </div>
                        <div className="flex flex-col space-y-1.5 p-4 border rounded-lg">
                          <h3 className="text-sm font-medium">BTC - USD Index</h3>
                          <div className="text-2xl font-bold">-0.42</div>
                          <Badge variant="destructive" className="w-fit">Correlación Negativa</Badge>
                          <p className="text-xs text-muted-foreground mt-2">
                            Bitcoin tiende a moverse en dirección opuesta al dólar estadounidense.
                          </p>
                        </div>
                      </div>
                      
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart
                            data={[
                              { date: "01/01", BTC: 0, SP500: 0, Gold: 0, USD: 0 },
                              { date: "01/05", BTC: -2, SP500: -1, Gold: 1, USD: 0.5 },
                              { date: "01/10", BTC: 5, SP500: 2, Gold: 0.5, USD: -1 },
                              { date: "01/15", BTC: 8, SP500: 3, Gold: -1, USD: -2 },
                              { date: "01/20", BTC: 6, SP500: 2.5, Gold: -0.5, USD: -1.5 },
                              { date: "01/25", BTC: 12, SP500: 4, Gold: 0, USD: -3 },
                              { date: "01/30", BTC: 15, SP500: 5, Gold: 1, USD: -3.5 },
                            ]}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" />
                            <YAxis tickFormatter={(value) => `${value}%`} />
                            <RechartsTooltip
                              formatter={(value) => [`${value}%`, '']}
                              labelFormatter={(label) => `Fecha: ${label}`}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="BTC" stroke="#3b82f6" activeDot={{ r: 8 }} strokeWidth={2} />
                            <Line type="monotone" dataKey="SP500" stroke="#22c55e" activeDot={{ r: 8 }} strokeWidth={2} />
                            <Line type="monotone" dataKey="Gold" stroke="#f59e0b" activeDot={{ r: 8 }} strokeWidth={2} />
                            <Line type="monotone" dataKey="USD" stroke="#ef4444" activeDot={{ r: 8 }} strokeWidth={2} />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}