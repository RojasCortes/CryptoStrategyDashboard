import { useState, useMemo } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBinanceData } from "@/hooks/use-binance";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { formatCurrency } from "@/lib/utils";
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
  Search,
  RefreshCw,
  ArrowUpDown,
  Settings,
  AlertCircle,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CryptoIcon } from "@/components/crypto-icon";

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

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#94a3b8", "#ec4899", "#14b8a6"];

export default function MarketsPage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useFirebaseAuth();
  const { marketData = [], isLoading: isLoadingMarketData } = useBinanceData();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const hasApiKeys = user?.apiKey && user?.apiSecret;

  const filteredData = useMemo(() => {
    if (!marketData || marketData.length === 0) return [];
    return marketData.filter(
      (crypto) =>
        crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [marketData, searchTerm]);

  const sortedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const sorted = [...filteredData].sort((a, b) => {
      if (!sortConfig) {
        return parseFloat(b.volume) - parseFloat(a.volume);
      }
      
      const key = sortConfig.key;
      let aVal: number, bVal: number;
      
      if (key === 'price') {
        aVal = parseFloat(a.price);
        bVal = parseFloat(b.price);
      } else if (key === 'priceChangePercent') {
        aVal = parseFloat(a.priceChangePercent);
        bVal = parseFloat(b.priceChangePercent);
      } else if (key === 'volume') {
        aVal = parseFloat(a.volume);
        bVal = parseFloat(b.volume);
      } else {
        return 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [filteredData, sortConfig]);

  const topGainers = useMemo(() => {
    if (!marketData || marketData.length === 0) return [];
    return [...marketData]
      .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
      .slice(0, 5);
  }, [marketData]);

  const topLosers = useMemo(() => {
    if (!marketData || marketData.length === 0) return [];
    return [...marketData]
      .sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent))
      .slice(0, 5);
  }, [marketData]);

  const volumeChartData = useMemo(() => {
    if (!marketData || marketData.length === 0) return [];
    return [...marketData]
      .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))
      .slice(0, 8)
      .map(item => ({
        symbol: item.symbol.replace('USDT', ''),
        volume: parseFloat(item.volume) / 1000000,
        price: parseFloat(item.price),
      }));
  }, [marketData]);

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
    await queryClient.invalidateQueries({ queryKey: ["/api/market/data"] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor inicia sesión para acceder al análisis de mercados.</p>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  return (
    <div className="flex h-screen bg-muted/10">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5">
          <div className="max-w-7xl mx-auto">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Análisis de Mercados</h1>
                <p className="text-muted-foreground mt-1">
                  Datos en tiempo real de criptomonedas desde Binance
                </p>
              </div>
              
              <div className="flex mt-4 md:mt-0 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoadingMarketData}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing || isLoadingMarketData ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>

            {!hasApiKeys && (
              <Alert className="mb-6 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Datos públicos de Binance</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Estás viendo datos públicos del mercado. Para ver tu portfolio personal, configura tus claves API.
                </AlertDescription>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-blue-300 text-blue-800 hover:bg-blue-100"
                  onClick={() => window.location.href = "/settings"}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar API Keys
                </Button>
              </Alert>
            )}
            
            <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 md:w-[300px]">
                <TabsTrigger value="overview">Vista general</TabsTrigger>
                <TabsTrigger value="all">Todos los pares</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-4">
                {isLoadingMarketData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {[...Array(6)].map((_, i) => (
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
                ) : marketData.length === 0 ? (
                  <Card className="bg-white mb-6">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Sin datos de mercado</h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        No se pudieron cargar los datos del mercado. Intenta actualizar la página.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Pares Activos
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{marketData.length}</div>
                          <p className="text-xs text-muted-foreground">Pares de trading USDT</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                            Top Ganador
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {topGainers[0] && (
                            <>
                              <div className="text-2xl font-bold flex items-center">
                                <CryptoIcon symbol={topGainers[0].symbol} size={24} className="mr-2" />
                                {topGainers[0].symbol.replace('USDT', '')}
                              </div>
                              <p className="text-sm text-green-600 font-medium">
                                +{parseFloat(topGainers[0].priceChangePercent).toFixed(2)}%
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                            Mayor Pérdida
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {topLosers[0] && (
                            <>
                              <div className="text-2xl font-bold flex items-center">
                                <CryptoIcon symbol={topLosers[0].symbol} size={24} className="mr-2" />
                                {topLosers[0].symbol.replace('USDT', '')}
                              </div>
                              <p className="text-sm text-red-600 font-medium">
                                {parseFloat(topLosers[0].priceChangePercent).toFixed(2)}%
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <Card className="bg-white">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                            Top Ganadores (24h)
                          </CardTitle>
                          <CardDescription>Mayores subidas en las últimas 24 horas</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {topGainers.map((crypto, index) => (
                              <div key={crypto.symbol} className="flex items-center justify-between p-2 rounded-lg bg-green-50">
                                <div className="flex items-center">
                                  <span className="text-sm text-muted-foreground mr-3 w-4">{index + 1}</span>
                                  <CryptoIcon symbol={crypto.symbol} size={24} className="mr-2" />
                                  <div>
                                    <span className="font-medium">{crypto.symbol.replace('USDT', '')}</span>
                                    <p className="text-xs text-muted-foreground">${parseFloat(crypto.price).toLocaleString()}</p>
                                  </div>
                                </div>
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                  +{parseFloat(crypto.priceChangePercent).toFixed(2)}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                            Mayores Pérdidas (24h)
                          </CardTitle>
                          <CardDescription>Mayores bajadas en las últimas 24 horas</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {topLosers.map((crypto, index) => (
                              <div key={crypto.symbol} className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                                <div className="flex items-center">
                                  <span className="text-sm text-muted-foreground mr-3 w-4">{index + 1}</span>
                                  <CryptoIcon symbol={crypto.symbol} size={24} className="mr-2" />
                                  <div>
                                    <span className="font-medium">{crypto.symbol.replace('USDT', '')}</span>
                                    <p className="text-xs text-muted-foreground">${parseFloat(crypto.price).toLocaleString()}</p>
                                  </div>
                                </div>
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                  {parseFloat(crypto.priceChangePercent).toFixed(2)}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {volumeChartData.length > 0 && (
                      <Card className="bg-white mb-6">
                        <CardHeader>
                          <CardTitle>Volumen de Trading (24h)</CardTitle>
                          <CardDescription>Top 8 pares por volumen en millones USDT</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={volumeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="symbol" />
                                <YAxis tickFormatter={(value) => `${value}M`} />
                                <RechartsTooltip 
                                  formatter={(value: number) => [`$${value.toFixed(2)}M`, 'Volumen']}
                                />
                                <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="all" className="pt-4">
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <CardTitle>Todos los Pares de Trading</CardTitle>
                        <CardDescription>Datos en tiempo real de Binance</CardDescription>
                      </div>
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Buscar par..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMarketData ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : sortedData.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        {searchTerm ? (
                          <p>No se encontraron pares para "{searchTerm}"</p>
                        ) : (
                          <p>No hay datos de mercado disponibles</p>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Par</TableHead>
                              <TableHead className="text-right cursor-pointer" onClick={() => requestSort('price')}>
                                <div className="flex items-center justify-end">
                                  Precio
                                  <ArrowUpDown className="ml-2 h-4 w-4" />
                                </div>
                              </TableHead>
                              <TableHead className="text-right cursor-pointer" onClick={() => requestSort('priceChangePercent')}>
                                <div className="flex items-center justify-end">
                                  Cambio 24h
                                  <ArrowUpDown className="ml-2 h-4 w-4" />
                                </div>
                              </TableHead>
                              <TableHead className="text-right cursor-pointer" onClick={() => requestSort('volume')}>
                                <div className="flex items-center justify-end">
                                  Volumen
                                  <ArrowUpDown className="ml-2 h-4 w-4" />
                                </div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedData.slice(0, 50).map((crypto) => {
                              const priceChange = parseFloat(crypto.priceChangePercent);
                              const isPositive = priceChange >= 0;
                              
                              return (
                                <TableRow key={crypto.symbol}>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <CryptoIcon symbol={crypto.symbol} size={24} className="mr-2" />
                                      <span className="font-medium">{crypto.symbol}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    ${parseFloat(crypto.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={`flex items-center justify-end ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                      {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                                      {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    ${formatNumber(parseFloat(crypto.volume))}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
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
