import { useState, useMemo } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useBinanceData } from "@/hooks/use-binance";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
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

const COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#94a3b8", "#ec4899", "#14b8a6"];

export default function MarketsPage() {
  const { user } = useFirebaseAuth();
  const { marketData = [], isLoading: isLoadingMarketData, refetch } = useBinanceData();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  // Reset to page 1 when search or sort changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  // Optimize: Calculate all sorted data in one pass to avoid multiple sorts
  const { topGainers, topLosers, volumeChartData, marketCapDistribution } = useMemo(() => {
    if (!marketData || marketData.length === 0) {
      return {
        topGainers: [],
        topLosers: [],
        volumeChartData: [],
        marketCapDistribution: []
      };
    }

    // Calculate topGainers (sort by priceChangePercent desc) - NEW COPY
    const gainers = [...marketData]
      .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
      .slice(0, 5);

    // Calculate topLosers (sort by priceChangePercent asc) - NEW COPY
    const losers = [...marketData]
      .sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent))
      .slice(0, 5);

    // Calculate volumeChartData (sort by volume desc)
    const volumeData = [...marketData]
      .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))
      .slice(0, 8)
      .map(crypto => ({
        name: crypto.symbol.replace('USDT', ''),
        volume: parseFloat(crypto.volume) / 1000000
      }));

    // Calculate marketCapDistribution (sort by market cap desc)
    const top5MarketCap = [...marketData]
      .sort((a, b) => parseFloat(b.volume) * parseFloat(b.price) - parseFloat(a.volume) * parseFloat(a.price))
      .slice(0, 5);

    const total = top5MarketCap.reduce((acc, c) => acc + parseFloat(c.volume) * parseFloat(c.price), 0);

    const distribution = top5MarketCap.map(c => ({
      name: c.symbol.replace('USDT', ''),
      value: Math.round((parseFloat(c.volume) * parseFloat(c.price) / total) * 100)
    }));


    return {
      topGainers: gainers,
      topLosers: losers,
      volumeChartData: volumeData,
      marketCapDistribution: distribution
    };
  }, [marketData]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'ascending' ? 'descending' : 'ascending' };
      }
      return { key, direction: 'descending' };
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/market/data'] });
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground">Por favor, inicia sesión para acceder al análisis de mercados.</p>
      </div>
    );
  }

  const topGainer = marketData.length > 0 
    ? [...marketData].sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))[0]
    : null;
  
  const topLoser = marketData.length > 0 
    ? [...marketData].sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent))[0]
    : null;

  return (
    <DashboardLayout 
      title="Análisis de Mercados" 
      subtitle="Datos en tiempo real de criptomonedas desde Binance"
    >
      {!hasApiKeys && (
        <Alert className="mb-6 bg-primary/10 border-primary/30">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle className="text-foreground">Datos públicos de Binance</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Estás viendo datos públicos del mercado. Para ver tu portfolio personal, configura tus claves API.
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2 border-primary text-primary hover:bg-primary/10"
            onClick={() => window.location.href = "/settings"}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar API Keys
          </Button>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Vista general</TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Todos los pares</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-border hover:bg-secondary transition-smooth"
          data-testid="button-refresh"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : 'btn-icon-animated'}`} />
          Actualizar
        </Button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="stat-card hover-lift-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 icon-primary" />
                  Pares Activos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="stat-value">{marketData.length}</div>
                <p className="stat-label">Pares de trading USDT</p>
              </CardContent>
            </Card>

            <Card className="stat-card hover-lift-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 icon-success" />
                  Top Ganador
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topGainer ? (
                  <>
                    <div className="flex items-center gap-2 animate-fade-in-scale">
                      <CryptoIcon symbol={topGainer.symbol} size={24} />
                      <span className="text-xl font-bold text-foreground">
                        {topGainer.symbol.replace('USDT', '')}
                      </span>
                    </div>
                    <span className="ticker-positive mt-1 inline-block badge-animated">
                      +{parseFloat(topGainer.priceChangePercent).toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <div className="skeleton-enhanced h-10 w-24" />
                )}
              </CardContent>
            </Card>

            <Card className="stat-card hover-lift-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 icon-danger" />
                  Mayor Pérdida
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topLoser ? (
                  <>
                    <div className="flex items-center gap-2 animate-fade-in-scale">
                      <CryptoIcon symbol={topLoser.symbol} size={24} />
                      <span className="text-xl font-bold text-foreground">
                        {topLoser.symbol.replace('USDT', '')}
                      </span>
                    </div>
                    <span className="ticker-negative mt-1 inline-block badge-animated">
                      {parseFloat(topLoser.priceChangePercent).toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <div className="skeleton-enhanced h-10 w-24" />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <TrendingUp className="h-5 w-5 icon-success animate-bounce-soft" />
                  Mayores subidas en las últimas 24 horas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingMarketData ? (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => <div key={i} className="skeleton-enhanced h-12" />)}
                  </div>
                ) : topGainers.length > 0 ? (
                  <div className="space-y-3">
                    {topGainers.map((crypto, index) => (
                      <div key={crypto.symbol} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 hover-lift-sm transition-all">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground w-6">{index + 1}</span>
                          <CryptoIcon symbol={crypto.symbol} size={32} />
                          <div>
                            <p className="font-medium text-foreground">{crypto.symbol.replace('USDT', '')}</p>
                            <p className="text-xs text-muted-foreground">${parseFloat(crypto.price).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className="ticker-positive">
                          +{parseFloat(crypto.priceChangePercent).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No hay datos disponibles</p>
                )}
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <TrendingDown className="h-5 w-5 icon-danger animate-bounce-soft" />
                  Mayores bajadas en las últimas 24 horas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingMarketData ? (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => <div key={i} className="skeleton-enhanced h-12" />)}
                  </div>
                ) : topLosers.length > 0 ? (
                  <div className="space-y-3">
                    {topLosers.map((crypto, index) => (
                      <div key={crypto.symbol} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 hover-lift-sm transition-all">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground w-6">{index + 1}</span>
                          <CryptoIcon symbol={crypto.symbol} size={32} />
                          <div>
                            <p className="font-medium text-foreground">{crypto.symbol.replace('USDT', '')}</p>
                            <p className="text-xs text-muted-foreground">${parseFloat(crypto.price).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className="ticker-negative">
                          {parseFloat(crypto.priceChangePercent).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No hay datos disponibles</p>
                )}
              </CardContent>
            </Card>
          </div>

          {volumeChartData.length > 0 && (
            <Card className="chart-container">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Volumen de Trading (24h)</CardTitle>
                <CardDescription className="text-muted-foreground">Top 8 pares por volumen en millones de USDT (escala logarítmica)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        scale="log"
                        domain={['auto', 'auto']}
                        tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}B` : `${value.toFixed(0)}M`}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value: number) => [
                          value >= 1000
                            ? `${(value/1000).toFixed(2)}B USDT`
                            : `${value.toFixed(2)}M USDT`,
                          'Volumen'
                        ]}
                      />
                      <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "all" && (
        <Card className="dashboard-card animate-fade-in">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-foreground">Todos los Pares de Trading</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {filteredData.length} pares encontrados
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar par..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-[250px] bg-secondary border-border"
                  data-testid="input-search-pairs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMarketData ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="skeleton-enhanced h-16" />)}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label="Tabla de criptomonedas">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Par</TableHead>
                        <TableHead className="text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('price')}
                            className="text-muted-foreground hover:text-foreground p-0 h-auto"
                            aria-label="Ordenar por precio"
                          >
                            Precio <ArrowUpDown className="ml-1 h-4 w-4" aria-hidden="true" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('priceChangePercent')}
                            className="text-muted-foreground hover:text-foreground p-0 h-auto"
                            aria-label="Ordenar por cambio en 24 horas"
                          >
                            Cambio 24h <ArrowUpDown className="ml-1 h-4 w-4" aria-hidden="true" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('volume')}
                            className="text-muted-foreground hover:text-foreground p-0 h-auto"
                            aria-label="Ordenar por volumen en 24 horas"
                          >
                            Volumen 24h <ArrowUpDown className="ml-1 h-4 w-4" aria-hidden="true" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((crypto) => {
                        const change = parseFloat(crypto.priceChangePercent);
                        const isPositive = change >= 0;
                        return (
                          <TableRow
                            key={crypto.symbol}
                            className="table-row"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <CryptoIcon symbol={crypto.symbol} size={32} />
                                <div>
                                  <p className="font-medium text-foreground">{crypto.symbol.replace('USDT', '')}</p>
                                  <p className="text-xs text-muted-foreground">USDT</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              ${parseFloat(crypto.price).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                            </TableCell>
                            <TableCell>
                              <span
                                className={isPositive ? "ticker-positive" : "ticker-negative"}
                                aria-label={`${isPositive ? 'Aumento' : 'Disminución'} de ${Math.abs(change).toFixed(2)} por ciento`}
                              >
                                {isPositive ? '+' : ''}{change.toFixed(2)}%
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              ${(parseFloat(crypto.volume) / 1000000).toFixed(2)}M
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 px-2">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} de {sortedData.length}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="border-border"
                      >
                        Anterior
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={currentPage === pageNum ? "" : "border-border"}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="border-border"
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
